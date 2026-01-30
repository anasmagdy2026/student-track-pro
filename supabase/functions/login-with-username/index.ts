import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { username, password } = await req.json()

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Missing username or password' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find profile by username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, is_active')
      .eq('username', username.trim())
      .maybeSingle()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user is active
    if (!profile.is_active) {
      return new Response(JSON.stringify({ error: 'Account is disabled' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use internal email (username@internal.local) for login
    const internalEmail = (profile.email || `${username}@internal.local`).trim().toLowerCase()

    // Sign in with email+password using Supabase Auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      // Use anon key for end-user auth operations inside the function
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    if (!Deno.env.get('SUPABASE_URL') || !Deno.env.get('SUPABASE_ANON_KEY')) {
      return new Response(
        JSON.stringify({ error: 'Server misconfigured: missing auth client keys' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: internalEmail,
      password,
    })

    if (authError || !authData.session) {
      console.error('login-with-username authError:', authError)
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      session: authData.session,
      user: authData.user,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error in login-with-username:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})