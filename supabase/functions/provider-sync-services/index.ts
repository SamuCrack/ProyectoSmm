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

    // Verify admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Only admins can sync services');
    }

    const { provider_id } = await req.json();

    if (!provider_id) {
      throw new Error('provider_id is required');
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

    console.log('Syncing services for provider:', provider.name);

    // Call provider API to get services
    const formData = new URLSearchParams();
    formData.append('key', provider.api_key);
    formData.append('action', 'services');

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

    const services = await response.json();

    if (!Array.isArray(services)) {
      throw new Error('Invalid response from provider API');
    }

    console.log(`Retrieved ${services.length} services from provider`);

    // Prepare all services data for batch upsert
    const allServicesData = services.map(service => ({
      provider_id,
      service_id: service.service.toString(),
      name: service.name,
      category: service.category,
      rate: parseFloat(service.rate),
      min_qty: parseInt(service.min),
      max_qty: parseInt(service.max),
      refill: service.refill === true || service.refill === 'true',
      cancel_allow: service.cancel === true || service.cancel === 'true',
      description: service.desc || service.description || null,
      raw_data: service,
      cached_at: new Date().toISOString()
    }));

    // Process in batches of 500 services for efficiency
    const batchSize = 500;
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allServicesData.length; i += batchSize) {
      const batch = allServicesData.slice(i, i + batchSize);
      
      const { error } = await supabaseAdmin
        .from('provider_services_cache')
        .upsert(batch, { 
          onConflict: 'provider_id,service_id',
          ignoreDuplicates: false 
        });
        
      if (error) {
        console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, error);
        errorCount++;
      } else {
        processedCount += batch.length;
      }
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allServicesData.length / batchSize)} (${processedCount}/${allServicesData.length} services)`);
    }

    // Update provider last_checked
    await supabaseAdmin
      .from('providers')
      .update({ last_checked: new Date().toISOString() })
      .eq('id', provider_id);

    console.log(`Sync completed: ${processedCount} services processed, ${errorCount} batch errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        synced_count: services.length,
        processed_count: processedCount,
        batch_errors: errorCount
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
