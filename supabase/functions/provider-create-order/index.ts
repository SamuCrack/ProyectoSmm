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

    const { provider_id, service_id, link, quantity, runs, interval, order_id } = await req.json();

    if (!provider_id || !service_id || !link || !quantity) {
      throw new Error('provider_id, service_id, link, and quantity are required');
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

    console.log('Creating order on provider:', provider.name);

    // Call provider API
    const formData = new URLSearchParams();
    formData.append('key', provider.api_key);
    formData.append('action', 'add');
    formData.append('service', service_id);
    formData.append('link', link);
    formData.append('quantity', quantity.toString());
    
    if (runs) formData.append('runs', runs.toString());
    if (interval) formData.append('interval', interval.toString());

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

    console.log('Order created successfully:', data);

    // Actualizar la orden local con el external_order_id y cambiar status a "In progress"
    if (order_id && data.order) {
      console.log('Updating local order with external_order_id:', { order_id, external_order_id: data.order });
      
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          external_order_id: data.order,
          status: 'In progress'
        })
        .eq('id', order_id);

      if (updateError) {
        console.error('Error updating order with external_order_id:', updateError);
        // No lanzamos error aquí porque la orden ya fue creada en el proveedor
        // Solo logueamos el error para debugging
      } else {
        console.log('Order updated successfully with external_order_id');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        order_id: data.order
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
