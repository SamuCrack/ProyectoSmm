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
      throw new Error('Only admins can sync descriptions');
    }

    console.log('Starting description sync for existing services');

    // Get all services that have provider linking
    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('id, provider_id, provider_service_id, notes')
      .not('provider_id', 'is', null)
      .not('provider_service_id', 'is', null);

    if (servicesError) {
      throw new Error(`Failed to fetch services: ${servicesError.message}`);
    }

    if (!services || services.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No services found with provider links',
          updated_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${services.length} services with provider links`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Update each service with description from cache
    for (const service of services) {
      const { data: cachedService, error: cacheError } = await supabaseAdmin
        .from('provider_services_cache')
        .select('description')
        .eq('provider_id', service.provider_id)
        .eq('service_id', service.provider_service_id)
        .single();

      if (cacheError || !cachedService) {
        console.log(`No cache entry found for service ${service.id}`);
        skippedCount++;
        continue;
      }

      // Only update if description exists in cache
      if (cachedService.description) {
        const { error: updateError } = await supabaseAdmin
          .from('services')
          .update({ notes: cachedService.description })
          .eq('id', service.id);

        if (updateError) {
          console.error(`Failed to update service ${service.id}:`, updateError);
          skippedCount++;
        } else {
          console.log(`Updated service ${service.id} with description`);
          updatedCount++;
        }
      } else {
        console.log(`No description available for service ${service.id}`);
        skippedCount++;
      }
    }

    console.log(`Sync completed: ${updatedCount} updated, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true,
        total_services: services.length,
        updated_count: updatedCount,
        skipped_count: skippedCount
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
