import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-bootstrap-token',
}

type BootstrapPayload = {
  username: string
  password: string
  email?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const expectedToken = Deno.env.get('ADMIN_BOOTSTRAP_TOKEN') ?? ''
    const providedToken = req.headers.get('x-bootstrap-token') ?? ''

    if (!expectedToken || providedToken !== expectedToken) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // One-time only: refuse if any admin already exists
    const { count, error: countError } = await supabaseAdmin
      .from('user_admins')
      .select('id', { count: 'exact', head: true })

    if (countError) {
      console.error('bootstrap-admin countError:', countError)
      return new Response(JSON.stringify({ error: 'Failed to check admin state' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if ((count ?? 0) > 0) {
      return new Response(
        JSON.stringify({ error: 'Admin already initialized' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const body = (await req.json()) as BootstrapPayload
    const username = (body.username ?? '').trim()
    const password = body.password ?? ''
    const email = (body.email ?? '').trim()

    if (!username || username.length < 2 || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const internalEmail = email ? email : `${username}@internal.local`

    // Create auth user
    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: internalEmail,
        password,
        email_confirm: true,
      })

    if (createError || !created.user) {
      return new Response(
        JSON.stringify({ error: createError?.message || 'Failed to create user' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      user_id: created.user.id,
      username,
      email: internalEmail,
      is_active: true,
    })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id)
      return new Response(JSON.stringify({ error: 'Failed to create profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Mark as admin (existing role model in this app)
    const { error: adminError } = await supabaseAdmin
      .from('user_admins')
      .insert({ user_id: created.user.id })

    if (adminError) {
      // Cleanup
      await supabaseAdmin.from('profiles').delete().eq('user_id', created.user.id)
      await supabaseAdmin.auth.admin.deleteUser(created.user.id)
      return new Response(JSON.stringify({ error: 'Failed to assign admin role' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ success: true, user_id: created.user.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Error in bootstrap-admin:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
