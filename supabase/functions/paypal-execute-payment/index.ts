import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYPAL_API_URL = 'https://api-3t.paypal.com/nvp';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { paypal_token, payer_id } = await req.json();

    if (!paypal_token || !payer_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token y PayerID requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get PayPal credentials
    const apiUsername = Deno.env.get('PAYPAL_API_USERNAME');
    const apiPassword = Deno.env.get('PAYPAL_API_PASSWORD');
    const apiSignature = Deno.env.get('PAYPAL_API_SIGNATURE');

    if (!apiUsername || !apiPassword || !apiSignature) {
      console.error('PayPal credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'PayPal no está configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, get checkout details to retrieve amount
    console.log(`Getting checkout details for token: ${paypal_token}`);
    
    const detailsParams = new URLSearchParams({
      METHOD: 'GetExpressCheckoutDetails',
      VERSION: '124.0',
      USER: apiUsername,
      PWD: apiPassword,
      SIGNATURE: apiSignature,
      TOKEN: paypal_token,
    });

    const detailsResponse = await fetch(PAYPAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: detailsParams.toString(),
    });

    const detailsText = await detailsResponse.text();
    const detailsResult = new URLSearchParams(detailsText);
    
    const detailsAck = detailsResult.get('ACK');
    if (detailsAck !== 'Success' && detailsAck !== 'SuccessWithWarning') {
      const errorMsg = detailsResult.get('L_LONGMESSAGE0') || 'Error obteniendo detalles';
      console.error('GetExpressCheckoutDetails error:', errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const grossAmount = detailsResult.get('PAYMENTREQUEST_0_AMT') || '0';
    const customData = detailsResult.get('PAYMENTREQUEST_0_CUSTOM');
    const payerEmail = detailsResult.get('EMAIL');
    
    console.log(`Checkout details: Amount=$${grossAmount}, PayerEmail=${payerEmail}`);

    // Verify user matches
    let expectedUserId = user.id;
    if (customData) {
      try {
        const parsed = JSON.parse(customData);
        expectedUserId = parsed.user_id;
      } catch (e) {
        console.warn('Could not parse custom data:', customData);
      }
    }

    if (expectedUserId !== user.id) {
      console.error(`User mismatch: expected ${expectedUserId}, got ${user.id}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no autorizado para este pago' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute the payment
    console.log(`Executing payment: Token=${paypal_token}, PayerID=${payer_id}, Amount=$${grossAmount}`);
    
    const executeParams = new URLSearchParams({
      METHOD: 'DoExpressCheckoutPayment',
      VERSION: '124.0',
      USER: apiUsername,
      PWD: apiPassword,
      SIGNATURE: apiSignature,
      TOKEN: paypal_token,
      PAYERID: payer_id,
      PAYMENTREQUEST_0_PAYMENTACTION: 'Sale',
      PAYMENTREQUEST_0_AMT: grossAmount,
      PAYMENTREQUEST_0_CURRENCYCODE: 'USD',
    });

    const executeResponse = await fetch(PAYPAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: executeParams.toString(),
    });

    const executeText = await executeResponse.text();
    const executeResult = new URLSearchParams(executeText);
    
    const executeAck = executeResult.get('ACK');
    const transactionId = executeResult.get('PAYMENTINFO_0_TRANSACTIONID');
    const paymentStatus = executeResult.get('PAYMENTINFO_0_PAYMENTSTATUS');

    console.log(`DoExpressCheckoutPayment response: ACK=${executeAck}, TxnID=${transactionId}, Status=${paymentStatus}`);

    if (executeAck !== 'Success' && executeAck !== 'SuccessWithWarning') {
      const errorMsg = executeResult.get('L_LONGMESSAGE0') || executeResult.get('L_SHORTMESSAGE0') || 'Error ejecutando pago';
      console.error('DoExpressCheckoutPayment error:', errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (paymentStatus !== 'Completed') {
      console.error(`Payment not completed: status=${paymentStatus}`);
      return new Response(
        JSON.stringify({ success: false, error: `Pago no completado: ${paymentStatus}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate net amount (5% commission)
    const grossFloat = parseFloat(grossAmount);
    const commission = grossFloat * 0.05;
    const netAmount = grossFloat - commission;

    console.log(`Payment successful: Gross=$${grossFloat}, Commission=$${commission.toFixed(2)}, Net=$${netAmount.toFixed(2)}`);

    // Check for duplicate transaction
    const { data: existingRecharge } = await supabase
      .from('recharges')
      .select('id')
      .eq('transaction_id', transactionId)
      .single();

    if (existingRecharge) {
      console.warn(`Duplicate transaction detected: ${transactionId}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Esta transacción ya fue procesada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error getting profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error obteniendo perfil de usuario' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newBalance = (profile.balance || 0) + netAmount;

    // Update balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error actualizando balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record recharge
    const { error: rechargeError } = await supabase
      .from('recharges')
      .insert({
        user_id: user.id,
        amount: netAmount,
        payment_method: 'PayPal',
        transaction_id: transactionId,
        status: 'Completed',
        notes: JSON.stringify({
          gross_amount: grossFloat,
          commission_percent: 5,
          commission_amount: commission,
          net_amount: netAmount,
          payer_email: payerEmail,
          paypal_token: paypal_token,
        }),
      });

    if (rechargeError) {
      console.error('Error recording recharge:', rechargeError);
      // Don't fail - balance was already updated
    }

    // Log the action
    await supabase.from('logs').insert({
      user_id: user.id,
      action: 'paypal_recharge',
      details: {
        transaction_id: transactionId,
        gross_amount: grossFloat,
        net_amount: netAmount,
        commission: commission,
        new_balance: newBalance,
      },
    });

    console.log(`Recharge complete: User=${user.id}, NewBalance=$${newBalance.toFixed(5)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: transactionId,
        gross_amount: grossFloat,
        net_amount: netAmount,
        commission: commission,
        new_balance: newBalance,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in paypal-execute-payment:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
