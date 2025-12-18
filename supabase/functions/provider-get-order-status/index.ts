import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { provider_id, order_id } = await req.json();

    if (!provider_id || !order_id) {
      throw new Error('provider_id and order_id are required');
    }

    // Get provider credentials
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('providers')
      .select('api_url, api_key, name')
      .eq('id', provider_id)
      .single();

    if (providerError || !provider) {
      throw new Error('Provider not found');
    }

    console.log('Getting order status from provider:', provider.name);

    // Call provider API
    const formData = new URLSearchParams();
    formData.append('key', provider.api_key);
    formData.append('action', 'status');
    formData.append('order', order_id.toString());

    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Provider API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    console.log('Order status retrieved:', data);

    return new Response(
      JSON.stringify({ 
        status: data.status,
        charge: data.charge,
        start_count: data.start_count,
        remains: data.remains,
        currency: data.currency || 'USD'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
