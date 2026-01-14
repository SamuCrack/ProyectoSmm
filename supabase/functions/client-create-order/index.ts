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

    // Rate limiting: Check recent orders from this user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (ordersError) {
      console.error('Error checking rate limit:', ordersError);
    } else if (recentOrders && recentOrders.length >= 50) {
      throw new Error('Rate limit exceeded. Maximum 50 orders per hour. Please try again later.');
    }

    const { service_id, link, quantity, comments } = await req.json();

    // Validate required fields
    if (!service_id || !link || !quantity) {
      throw new Error('service_id, link, and quantity are required');
    }

    // Validate link format and length
    const trimmedLink = link.trim();
    if (trimmedLink.length === 0) {
      throw new Error('Link cannot be empty');
    }
    if (trimmedLink.length > 500) {
      throw new Error('Link must be less than 500 characters');
    }

    // Validate quantity is a positive number
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    // Get service details
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('*, provider:provider_id(*)')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      throw new Error('Service not found');
    }

    // Validate quantity constraints
    if (qty < service.min_qty) {
      throw new Error(`Quantity must be at least ${service.min_qty}`);
    }
    if (qty > service.max_qty) {
      throw new Error(`Quantity cannot exceed ${service.max_qty}`);
    }

    // Validate comments for Custom Comments services
    if (service.service_type === 'Custom Comments') {
      if (!comments || comments.trim().length === 0) {
        throw new Error('Los comentarios son requeridos para este tipo de servicio');
      }
      if (comments.length > 10000) {
        throw new Error('Los comentarios son demasiado largos (máximo 10,000 caracteres)');
      }
      // Validate that comment count matches quantity
      const commentLines = comments.trim().split('\n').filter((c: string) => c.trim());
      if (commentLines.length !== qty) {
        throw new Error(`La cantidad de comentarios (${commentLines.length}) debe coincidir con la cantidad solicitada (${qty})`);
      }
    }

    // Check for custom rate
    const { data: customRate } = await supabaseAdmin
      .from('pricing_rules')
      .select('custom_rate')
      .eq('user_id', user.id)
      .eq('service_id', service_id)
      .single();

    const rate = customRate?.custom_rate ?? service.rate_per_1000;

    // Get user's current discount
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('custom_discount')
      .eq('id', user.id)
      .single();

    const discount = profile?.custom_discount ?? 0;
    const finalRate = rate * (1 - discount / 100);
    const totalCost = (finalRate * qty) / 1000;

    // Get user balance
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      throw new Error('User profile not found');
    }

    // Validate sufficient balance
    if (userProfile.balance < totalCost) {
      throw new Error('Insufficient balance');
    }

    // Smart duplicate link validation for ALL services
    // Block if same link + same service + active status + less than 3 days old
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: activeOrders } = await supabaseAdmin
      .from('orders')
      .select('id, status, created_at')
      .eq('service_id', service_id)
      .eq('link', trimmedLink)
      .eq('user_id', user.id)
      .in('status', ['Pending', 'In progress'])
      .gte('created_at', threeDaysAgo)
      .limit(1);

    if (activeOrders && activeOrders.length > 0) {
      throw new Error('Ya tienes una orden activa con este link para este servicio. Espera a que se complete o intenta después de 3 días.');
    }

    // Start atomic transaction: deduct balance and create order
    const newBalance = userProfile.balance - totalCost;
    
    const { error: balanceError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (balanceError) {
      throw new Error('Failed to update balance');
    }

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        service_id: service_id,
        provider_id: service.provider_id,
        link: trimmedLink,
        quantity: qty,
        comments: comments || null,
        charge_user: totalCost,
        cost_provider: service.provider ? (service.provider.rate_per_1000 * qty) / 1000 : 0,
        status: 'Pending'
      })
      .select()
      .single();

    if (orderError) {
      // Revert balance on error
      await supabaseAdmin
        .from('profiles')
        .update({ balance: userProfile.balance })
        .eq('id', user.id);
      throw new Error('Failed to create order');
    }

    // Log the action
    await supabaseAdmin
      .from('logs')
      .insert({
        user_id: user.id,
        action: 'order_created',
        details: {
          order_id: order.id,
          service_id: service_id,
          amount: totalCost
        }
      });

    // If service has provider, submit order to external API
    if (service.provider_id && service.provider) {
      try {
        const bodyParams: Record<string, string> = {
          key: service.provider.api_key,
          action: 'add',
          service: service.provider_service_id || service_id.toString(),
          link: trimmedLink,
          quantity: qty.toString()
        };

        // Add comments if Custom Comments service
        if (service.service_type === 'Custom Comments' && comments) {
          bodyParams.comments = comments;
        }

        const providerResponse = await fetch(service.provider.api_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(bodyParams).toString()
        });

        if (providerResponse.ok) {
          const providerData = await providerResponse.json();
          
          if (providerData.order) {
            // Solo guardar external_order_id, el status permanece "Pending"
            // El cron job sync-order-statuses actualizará el estado real del proveedor
            await supabaseAdmin
              .from('orders')
              .update({
                external_order_id: providerData.order
              })
              .eq('id', order.id);
          }
        }
      } catch (providerError) {
        console.error('Provider API error:', providerError);
        // Order remains in Pending status
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        order_id: order.id,
        new_balance: newBalance
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
