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

    console.log('🚀 Starting auto-sync services...');

    // Get all enabled providers
    const { data: providers, error: providersError } = await supabaseAdmin
      .from('providers')
      .select('id, name, api_url, api_key')
      .eq('enabled', true);

    if (providersError) {
      throw new Error(`Failed to fetch providers: ${providersError.message}`);
    }

    if (!providers || providers.length === 0) {
      console.log('No enabled providers found');
      return new Response(
        JSON.stringify({ success: true, message: 'No enabled providers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${providers.length} enabled providers`);

    let totalDisabled = 0;
    let totalRateUpdates = 0;
    let totalCacheUpdates = 0;

    for (const provider of providers) {
      console.log(`\n📦 Processing provider: ${provider.name} (ID: ${provider.id})`);

      try {
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
          console.error(`Provider ${provider.name} API returned status ${response.status}`);
          continue;
        }

        const providerServices = await response.json();

        if (!Array.isArray(providerServices)) {
          console.error(`Invalid response from provider ${provider.name}`);
          continue;
        }

        console.log(`Retrieved ${providerServices.length} services from ${provider.name}`);

        // Create a map of provider service IDs for quick lookup
        const providerServiceIds = new Set(
          providerServices.map(s => s.service.toString())
        );

        // Create a map of provider services for rate comparison
        const providerServiceMap = new Map(
          providerServices.map(s => [s.service.toString(), {
            rate: parseFloat(s.rate),
            min_qty: parseInt(s.min),
            max_qty: parseInt(s.max),
            refill: s.refill === true || s.refill === 'true',
            cancel_allow: s.cancel === true || s.cancel === 'true',
            name: s.name,
            category: s.category,
            description: s.desc || s.description || null
          }])
        );

        // Update provider_services_cache
        for (const service of providerServices) {
          const serviceData = {
            provider_id: provider.id,
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
          };

          const { data: existing } = await supabaseAdmin
            .from('provider_services_cache')
            .select('id')
            .eq('provider_id', provider.id)
            .eq('service_id', service.service.toString())
            .maybeSingle();

          if (existing) {
            await supabaseAdmin
              .from('provider_services_cache')
              .update(serviceData)
              .eq('id', existing.id);
          } else {
            await supabaseAdmin
              .from('provider_services_cache')
              .insert(serviceData);
            totalCacheUpdates++;
          }
        }

        // Get local services linked to this provider with sync enabled
        const { data: localServices, error: localError } = await supabaseAdmin
          .from('services')
          .select('id, name, provider_service_id, enabled, rate_per_1000, sync_with_provider')
          .eq('provider_id', provider.id)
          .not('provider_service_id', 'is', null);

        if (localError) {
          console.error(`Failed to fetch local services: ${localError.message}`);
          continue;
        }

        if (!localServices || localServices.length === 0) {
          console.log(`No linked services for provider ${provider.name}`);
          continue;
        }

        console.log(`Found ${localServices.length} linked services to check`);

        // Check each local service
        for (const localService of localServices) {
          const providerServiceId = localService.provider_service_id;
          
          // Check if service still exists in provider
          if (!providerServiceIds.has(providerServiceId)) {
            // Service no longer exists in provider - disable it if currently enabled
            if (localService.enabled) {
              console.log(`⚠️ Service "${localService.name}" (ID: ${localService.id}) no longer exists in provider - disabling`);
              
              await supabaseAdmin
                .from('services')
                .update({ enabled: false })
                .eq('id', localService.id);

              // Log the change
              await supabaseAdmin
                .from('service_updates')
                .insert({
                  service_id: localService.id,
                  service_name: localService.name,
                  update_type: 'disabled',
                  old_value: 'true',
                  new_value: 'false (auto-sync: servicio eliminado por proveedor)'
                });

              totalDisabled++;
            }
          } else {
            // Service exists in provider
            
            // Re-enable if it was disabled and sync is enabled
            if (!localService.enabled && localService.sync_with_provider) {
              console.log(`✅ Service "${localService.name}" (ID: ${localService.id}) restored by provider - re-enabling`);
              
              await supabaseAdmin
                .from('services')
                .update({ enabled: true })
                .eq('id', localService.id);

              // Log the change
              await supabaseAdmin
                .from('service_updates')
                .insert({
                  service_id: localService.id,
                  service_name: localService.name,
                  update_type: 'enabled',
                  old_value: 'false',
                  new_value: 'true (auto-sync: servicio restaurado por proveedor)'
                });
            }
            
            // Check for rate changes if sync is enabled
            if (localService.sync_with_provider) {
              const providerData = providerServiceMap.get(providerServiceId);
              
              if (providerData) {
                const currentRate = parseFloat(localService.rate_per_1000?.toString() || '0');
                const providerRate = providerData.rate;

                // Check if rate changed significantly (more than 0.001 difference)
                if (Math.abs(currentRate - providerRate) > 0.001) {
                  console.log(`💰 Rate change for "${localService.name}": ${currentRate} → ${providerRate}`);
                  
                  const updateType = providerRate > currentRate ? 'rate_increased' : 'rate_decreased';
                  
                  await supabaseAdmin
                    .from('services')
                    .update({ rate_per_1000: providerRate })
                    .eq('id', localService.id);

                  // Log the change
                  await supabaseAdmin
                    .from('service_updates')
                    .insert({
                      service_id: localService.id,
                      service_name: localService.name,
                      update_type: updateType,
                      old_value: currentRate.toString(),
                      new_value: `${providerRate} (auto-sync)`
                    });

                  totalRateUpdates++;
                }
              }
            }
          }
        }

        // Update provider last_checked
        await supabaseAdmin
          .from('providers')
          .update({ last_checked: new Date().toISOString() })
          .eq('id', provider.id);

      } catch (providerError) {
        console.error(`Error processing provider ${provider.name}:`, providerError);
        continue;
      }
    }

    console.log(`\n✅ Auto-sync completed: ${totalDisabled} disabled, ${totalRateUpdates} rate updates, ${totalCacheUpdates} new cache entries`);

    return new Response(
      JSON.stringify({ 
        success: true,
        providers_processed: providers.length,
        services_disabled: totalDisabled,
        rate_updates: totalRateUpdates,
        cache_updates: totalCacheUpdates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Auto-sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
