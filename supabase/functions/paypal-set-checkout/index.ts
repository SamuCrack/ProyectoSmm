import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYPAL_API_URL = 'https://api-3t.paypal.com/nvp';
const PAYPAL_REDIRECT_URL = 'https://www.paypal.com/cgi-bin/webscr';

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
    const { amount, return_url, cancel_url } = await req.json();

    // Validate minimum amount
    if (!amount || amount < 5) {
      return new Response(
        JSON.stringify({ success: false, error: 'El monto mínimo es $5 USD' }),
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

    // Calculate net amount (after 5% commission)
    const grossAmount = parseFloat(amount).toFixed(2);
    const netAmount = (parseFloat(amount) * 0.95).toFixed(2);

    console.log(`Creating PayPal checkout: Gross=$${grossAmount}, Net=$${netAmount}, User=${user.id}`);

    // Build SetExpressCheckout request
    const params = new URLSearchParams({
      METHOD: 'SetExpressCheckout',
      VERSION: '124.0',
      USER: apiUsername,
      PWD: apiPassword,
      SIGNATURE: apiSignature,
      PAYMENTREQUEST_0_PAYMENTACTION: 'Sale',
      PAYMENTREQUEST_0_AMT: grossAmount,
      PAYMENTREQUEST_0_CURRENCYCODE: 'USD',
      PAYMENTREQUEST_0_DESC: `Recarga de saldo MarketXpress - Recibes $${netAmount}`,
      PAYMENTREQUEST_0_CUSTOM: JSON.stringify({ user_id: user.id, gross: grossAmount, net: netAmount }),
      RETURNURL: return_url,
      CANCELURL: cancel_url,
      NOSHIPPING: '1',
      ALLOWNOTE: '0',
      BRANDNAME: 'MarketXpress',
    });

    // Call PayPal API
    const response = await fetch(PAYPAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const responseText = await response.text();
    const result = new URLSearchParams(responseText);
    
    const ack = result.get('ACK');
    const token_paypal = result.get('TOKEN');

    console.log(`PayPal SetExpressCheckout response: ACK=${ack}, TOKEN=${token_paypal}`);

    if (ack !== 'Success' && ack !== 'SuccessWithWarning') {
      const errorMsg = result.get('L_LONGMESSAGE0') || result.get('L_SHORTMESSAGE0') || 'Error de PayPal';
      console.error('PayPal error:', errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build redirect URL
    const redirectUrl = `${PAYPAL_REDIRECT_URL}?cmd=_express-checkout&token=${token_paypal}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: token_paypal,
        redirect_url: redirectUrl,
        gross_amount: grossAmount,
        net_amount: netAmount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in paypal-set-checkout:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
