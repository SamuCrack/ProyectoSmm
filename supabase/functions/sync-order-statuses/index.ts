import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';
import { corsHeaders } from '../_shared/cors.ts';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Main sync function extracted for reuse
async function performSync(supabaseAdmin: any, cycleNumber: number) {
  console.log(`🔄 [Cycle ${cycleNumber}/4] Starting order status synchronization...`);

  // Get all orders that need status updates:
  // 1. Pending or In progress orders
  // 2. Orders with cancel_requested_at but not yet refunded (waiting for provider confirmation)
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, external_order_id, provider_id, status, user_id, charge_user, quantity, cancel_requested_at, refunded')
    .not('external_order_id', 'is', null)
    .or('status.in.(Pending,In progress),and(cancel_requested_at.not.is.null,refunded.eq.false)');

  if (ordersError) {
    throw new Error(`Failed to fetch orders: ${ordersError.message}`);
  }

  if (!orders || orders.length === 0) {
    console.log(`✅ [Cycle ${cycleNumber}/4] No orders to sync`);
    return { synced: 0, errors: 0, total: 0 };
  }

  console.log(`📋 [Cycle ${cycleNumber}/4] Found ${orders.length} orders to sync`);

  // Group orders by provider to minimize API calls
  const ordersByProvider: Record<number, any[]> = {};
  for (const order of orders) {
    if (!ordersByProvider[order.provider_id]) {
      ordersByProvider[order.provider_id] = [];
    }
    ordersByProvider[order.provider_id].push(order);
  }

  let syncedCount = 0;
  let errorCount = 0;

  // Process each provider's orders
  for (const [providerId, providerOrders] of Object.entries(ordersByProvider)) {
    try {
      // Get provider credentials
      const { data: provider, error: providerError } = await supabaseAdmin
        .from('providers')
        .select('api_url, api_key, name')
        .eq('id', parseInt(providerId))
        .eq('enabled', true)
        .single();

      if (providerError || !provider) {
        console.error(`❌ Provider ${providerId} not found or disabled`);
        continue;
      }

      console.log(`🔄 [Cycle ${cycleNumber}/4] Syncing ${providerOrders.length} orders from provider: ${provider.name}`);

      // Process each order
      for (const order of providerOrders) {
        try {
          // Call provider API to get order status
          const formData = new URLSearchParams();
          formData.append('key', provider.api_key);
          formData.append('action', 'status');
          formData.append('order', order.external_order_id.toString());

          const response = await fetch(provider.api_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          if (!response.ok) {
            console.error(`❌ Provider API error for order ${order.id}: HTTP ${response.status}`);
            errorCount++;
            continue;
          }

          const data = await response.json();

          if (data.error) {
            console.error(`❌ Provider API error for order ${order.id}:`, data.error);
            errorCount++;
            continue;
          }

          // Map provider status to our status
          let newStatus = order.status;
          if (data.status === 'Completed') {
            newStatus = 'Completed';
          } else if (data.status === 'In progress' || data.status === 'Processing') {
            newStatus = 'In progress';
          } else if (data.status === 'Partial') {
            newStatus = 'Partial';
          } else if (data.status === 'Canceled' || data.status === 'Cancelled') {
            newStatus = 'Canceled';
          } else if (data.status === 'Failed' || data.status === 'Error') {
            newStatus = 'Failed';
          } else if (data.status === 'Pending') {
            newStatus = 'Pending';
          }

          // Update order in database if status changed
          if (newStatus !== order.status) {
            const { error: updateError } = await supabaseAdmin
              .from('orders')
              .update({
                status: newStatus,
                start_count: data.start_count || null,
                remains: data.remains || null,
                cost_provider: data.charge || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.id);

            if (updateError) {
              console.error(`❌ Failed to update order ${order.id}:`, updateError.message);
              errorCount++;
            } else {
              console.log(`✅ [Cycle ${cycleNumber}/4] Order ${order.id} updated: ${order.status} → ${newStatus}`);
              syncedCount++;

              // Handle refunds based on status
              if (newStatus === 'Failed' || newStatus === 'Canceled') {
                // Full refund for failed/canceled orders
                const { data: profile } = await supabaseAdmin
                  .from('profiles')
                  .select('balance')
                  .eq('id', order.user_id)
                  .single();

                if (profile) {
                  const newBalance = profile.balance + order.charge_user;
                  const { error: refundError } = await supabaseAdmin
                    .from('profiles')
                    .update({ balance: newBalance })
                    .eq('id', order.user_id);

                  if (!refundError) {
                    await supabaseAdmin
                      .from('orders')
                      .update({
                        refunded: true,
                        refund_amount: order.charge_user,
                      })
                      .eq('id', order.id);
                    
                    console.log(`💰 [Cycle ${cycleNumber}/4] Full refund ${order.charge_user} to user for order ${order.id}`);
                  }
                }
              } else if (newStatus === 'Partial' && data.remains && parseInt(data.remains) > 0) {
                // Partial refund based on remains
                const remains = parseInt(data.remains);
                const quantity = order.quantity;
                
                if (quantity > 0) {
                  const refundAmount = (remains / quantity) * order.charge_user;
                  
                  const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('balance')
                    .eq('id', order.user_id)
                    .single();

                  if (profile && refundAmount > 0) {
                    const newBalance = profile.balance + refundAmount;
                    const { error: refundError } = await supabaseAdmin
                      .from('profiles')
                      .update({ balance: newBalance })
                      .eq('id', order.user_id);

                    if (!refundError) {
                      await supabaseAdmin
                        .from('orders')
                        .update({
                          refunded: true,
                          refund_amount: refundAmount,
                        })
                        .eq('id', order.id);
                      
                      console.log(`💰 [Cycle ${cycleNumber}/4] Partial refund: ${refundAmount.toFixed(5)} for ${remains}/${quantity} remains on order ${order.id}`);
                    }
                  }
                }
              }
            }
          }

          // Small delay to avoid rate limiting
          await sleep(100);
        } catch (error) {
          console.error(`❌ Error processing order ${order.id}:`, error);
          errorCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing provider ${providerId}:`, error);
    }
  }

  console.log(`✅ [Cycle ${cycleNumber}/4] Sync completed: ${syncedCount} orders updated, ${errorCount} errors`);

  return { synced: syncedCount, errors: errorCount, total: orders.length };
}

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

    console.log('🚀 Starting sync with 4 cycles (every 15 seconds)...');

    let totalSynced = 0;
    let totalErrors = 0;
    let totalProcessed = 0;

    // Run 4 sync cycles with 15 second delays between them
    for (let cycle = 1; cycle <= 4; cycle++) {
      const result = await performSync(supabaseAdmin, cycle);
      totalSynced += result.synced;
      totalErrors += result.errors;
      totalProcessed += result.total;

      // Wait 15 seconds before next cycle (except after the last one)
      if (cycle < 4) {
        console.log(`⏳ Waiting 15 seconds before cycle ${cycle + 1}...`);
        await sleep(15000);
      }
    }

    console.log(`🏁 All 4 cycles completed: ${totalSynced} total synced, ${totalErrors} total errors`);

    return new Response(
      JSON.stringify({ 
        message: 'All sync cycles completed',
        cycles: 4,
        totalSynced,
        totalErrors,
        totalProcessed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
