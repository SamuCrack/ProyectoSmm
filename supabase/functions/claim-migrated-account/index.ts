import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email y contraseña son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Check if user exists in pending_migrations
    const { data: pendingUser, error: fetchError } = await supabaseClient
      .from('pending_migrations')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .is('claimed_at', null)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching pending migration:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Error al verificar usuario' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingUser) {
      return new Response(
        JSON.stringify({ error: 'No se encontró cuenta pendiente de migración para este email' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create the user in auth.users
    const { data: authData, error: createError } = await supabaseClient.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true, // Auto-confirm since they're migrated users
      user_metadata: {
        username: pendingUser.username,
        whatsapp: pendingUser.whatsapp,
        migrated: true
      }
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      return new Response(
        JSON.stringify({ error: 'Error al crear cuenta: ' + createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authData.user.id;

    // 3. Update the profile with migrated data (trigger should have created basic profile)
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        balance: pendingUser.balance,
        custom_discount: pendingUser.custom_discount,
        username: pendingUser.username,
        whatsapp: pendingUser.whatsapp,
        created_at: pendingUser.original_created_at || new Date().toISOString()
      })
      .eq('id', newUserId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't fail completely - user was created
    }

    // 4. Assign user role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: newUserId,
        role: 'user'
      }, { onConflict: 'user_id,role' });

    if (roleError) {
      console.error('Error assigning role:', roleError);
    }

    // 5. Mark the pending migration as claimed
    const { error: claimError } = await supabaseClient
      .from('pending_migrations')
      .update({ claimed_at: new Date().toISOString() })
      .eq('id', pendingUser.id);

    if (claimError) {
      console.error('Error marking migration as claimed:', claimError);
    }

    // 6. Log the migration claim
    await supabaseClient.from('logs').insert({
      user_id: newUserId,
      action: 'account_claimed',
      details: {
        original_created_at: pendingUser.original_created_at,
        balance_migrated: pendingUser.balance
      }
    });

    console.log(`Successfully claimed account for ${email}, balance: ${pendingUser.balance}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cuenta reclamada exitosamente. Ahora puedes iniciar sesión.',
        balance: pendingUser.balance
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in claim-migrated-account:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
