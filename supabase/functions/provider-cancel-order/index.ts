import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { provider_id, order_id } = await req.json();

    if (!provider_id || !order_id) {
      throw new Error('provider_id and order_id are required');
    }

    console.log('🚫 Canceling order:', { provider_id, order_id });

    // Get original order details including external_order_id
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('user_id, external_order_id, charge_user, status, cancel_requested_at')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      throw new Error('Order not found');
    }

    console.log('📋 Order details:', order);

    // Verify order ownership
    if (order.user_id !== user.id) {
      throw new Error('Unauthorized: You can only cancel your own orders');
    }

    // Check if cancel was already requested
    if (order.cancel_requested_at) {
      throw new Error('Cancellation already requested for this order');
    }

    if (!order.external_order_id) {
      throw new Error('Order does not have external order ID');
    }

    // Get provider credentials
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('providers')
      .select('api_url, api_key, name')
      .eq('id', provider_id)
      .single();

    if (providerError || !provider) {
      console.error('Provider not found:', providerError);
      throw new Error('Provider not found');
    }

    console.log('🔗 Calling provider API:', provider.name);

    // Call provider API to cancel order - orders must be string, not array
    const requestBody = {
      key: provider.api_key,
      action: 'cancel',
      orders: String(order.external_order_id)  // String format: "465343463"
    };

    console.log('📤 Request body:', { ...requestBody, key: '***' });

    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('📥 Provider cancel response:', JSON.stringify(data));

    // Response is an array [{order: X, cancel: Y}], not direct object
    const cancelResult = Array.isArray(data) ? data[0] : data;
    
    // Log the type and value for debugging
    console.log('🔍 Cancel value type:', typeof cancelResult?.cancel, 'value:', cancelResult?.cancel);
    
    // Success detection - cancel is a positive number (cancellation ID) on success
    // or cancel === 1 for some providers. Failure is when cancel is an object with error property.
    const cancelSuccess = typeof cancelResult?.cancel === 'number' && cancelResult.cancel > 0;

    console.log('✅ Cancel result:', { cancelResult, cancelSuccess });

    if (cancelSuccess) {
      // Only save that cancellation was requested - DO NOT refund or change status
      // The sync-order-statuses cron job will handle the actual status change and refund
      // when SMMCOST confirms the order is truly "Canceled"
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ 
          cancel_requested_at: new Date().toISOString()
        })
        .eq('id', order_id);

      if (updateError) {
        console.error('Failed to update cancel_requested_at:', updateError);
      } else {
        console.log('✅ Cancel request recorded - waiting for provider to confirm cancellation');
      }
    } else {
      console.log('❌ Cancel failed or not available:', cancelResult);
    }

    return new Response(
      JSON.stringify({ 
        success: cancelSuccess,
        data: cancelResult,
        message: cancelSuccess ? 'Cancellation requested - refund will be processed when provider confirms' : null,
        error: cancelResult?.cancel?.error || (!cancelSuccess ? 'Cancel unavailable' : null)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error in provider-cancel-order:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
