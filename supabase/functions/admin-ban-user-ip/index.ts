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

    // Verify caller is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Only admins can ban users');
    }

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    // Get user's last IP
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('last_ip')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.last_ip) {
      throw new Error('Could not get user IP address');
    }

    // Insert IP ban
    const { error: banError } = await supabaseAdmin
      .from('ip_bans')
      .insert({
        ip: profile.last_ip,
        reason: 'Banned by admin',
        expires_at: null, // Permanent ban
      });

    if (banError) {
      throw banError;
    }

    // Suspend user
    const { error: suspendError } = await supabaseAdmin
      .from('profiles')
      .update({ enabled: false })
      .eq('id', userId);

    if (suspendError) {
      throw suspendError;
    }

    // Log the action
    await supabaseAdmin.from('logs').insert({
      user_id: userId,
      action: 'ip_banned',
      ip_address: profile.last_ip,
      details: { banned_by: user.id, ip: profile.last_ip },
    });

    return new Response(
      JSON.stringify({ success: true }),
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
