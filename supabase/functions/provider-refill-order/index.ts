import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

    console.log('Creating refill for order:', { provider_id, order_id });

    // Get original order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('user_id, service_id, link, quantity, start_count, external_order_id')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Verify order ownership
    if (order.user_id !== user.id) {
      throw new Error('Unauthorized: You can only refill your own orders');
    }

    // Get provider credentials
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('providers')
      .select('api_url, api_key')
      .eq('id', provider_id)
      .single();

    if (providerError || !provider) {
      throw new Error('Provider not found');
    }

    // Call provider API to create refill using external order ID
    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: provider.api_key,
        action: 'refill',
        order: order.external_order_id
      }),
    });

    const data = await response.json();
    console.log('Provider refill response:', data);

    // Create refill record in database
    if (data.refill) {
      const { error: refillInsertError } = await supabaseAdmin
        .from('refills')
        .insert({
          order_id: order_id,
          user_id: order.user_id,
          provider_id: provider_id,
          service_id: order.service_id,
          external_refill_id: data.refill.toString(),
          status: 'Pending',
          link: order.link,
          quantity: order.quantity,
          start_count: order.start_count
        });

      if (refillInsertError) {
        console.error('Error inserting refill record:', refillInsertError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: !!data.refill,
        refill_id: data.refill || null,
        data: data,
        error: data.error || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in provider-refill-order:', error);
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
