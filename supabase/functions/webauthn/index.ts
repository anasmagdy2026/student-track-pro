import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from 'npm:@simplewebauthn/server@11.0.0'
import { isoBase64URL } from 'npm:@simplewebauthn/server@11.0.0/helpers'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RP_NAME = 'مستر محمد مجدي'
const RP_ID_ENV = Deno.env.get('WEBAUTHN_RP_ID') || 'mrmagdy.lovable.app'
const ORIGIN_ENV = Deno.env.get('WEBAUTHN_ORIGIN') || 'https://mrmagdy.lovable.app'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { action, ...body } = await req.json()

    // ── REGISTRATION OPTIONS ──
    if (action === 'register-options') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return json({ error: 'Unauthorized' }, 401)
      }

      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '')
      )
      if (authError || !user) return json({ error: 'Unauthorized' }, 401)

      // Get existing credentials
      const { data: existingCreds } = await supabaseAdmin
        .from('webauthn_credentials')
        .select('credential_id')
        .eq('user_id', user.id)

      const excludeCredentials = (existingCreds || []).map((c: any) => ({
        id: c.credential_id,
        type: 'public-key' as const,
      }))

      // Get username from profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single()

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID_ENV,
        userName: profile?.username || user.email || 'user',
        userID: isoBase64URL.toBuffer(user.id),
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
      })

      // Store challenge
      await supabaseAdmin.from('webauthn_challenges').insert({
        user_id: user.id,
        challenge: options.challenge,
        type: 'registration',
      })

      return json(options)
    }

    // ── VERIFY REGISTRATION ──
    if (action === 'register-verify') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return json({ error: 'Unauthorized' }, 401)

      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '')
      )
      if (authError || !user) return json({ error: 'Unauthorized' }, 401)

      // Get stored challenge
      const { data: challengeRow } = await supabaseAdmin
        .from('webauthn_challenges')
        .select('challenge')
        .eq('user_id', user.id)
        .eq('type', 'registration')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!challengeRow) return json({ error: 'Challenge not found' }, 400)

      const verification = await verifyRegistrationResponse({
        response: body.credential,
        expectedChallenge: challengeRow.challenge,
        expectedOrigin: ORIGIN_ENV,
        expectedRPID: RP_ID_ENV,
      })

      if (!verification.verified || !verification.registrationInfo) {
        return json({ error: 'Verification failed' }, 400)
      }

      const { credential, credentialDeviceType } = verification.registrationInfo

      // Store credential
      await supabaseAdmin.from('webauthn_credentials').insert({
        user_id: user.id,
        credential_id: isoBase64URL.fromBuffer(credential.id),
        public_key: isoBase64URL.fromBuffer(credential.publicKey),
        counter: Number(credential.counter),
        device_name: body.deviceName || 'جهاز غير معروف',
        transports: credential.transports || [],
      })

      // Clean up challenge
      await supabaseAdmin
        .from('webauthn_challenges')
        .delete()
        .eq('user_id', user.id)
        .eq('type', 'registration')

      return json({ verified: true })
    }

    // ── AUTHENTICATION OPTIONS ──
    if (action === 'auth-options') {
      const { username } = body

      if (!username) return json({ error: 'Username required' }, 400)

      // Find user by username
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_id, is_active')
        .ilike('username', username.trim())
        .maybeSingle()

      if (!profile || !profile.is_active) {
        return json({ error: 'User not found' }, 404)
      }

      // Get credentials
      const { data: creds } = await supabaseAdmin
        .from('webauthn_credentials')
        .select('credential_id, transports')
        .eq('user_id', profile.user_id)

      if (!creds || creds.length === 0) {
        return json({ error: 'No biometric credentials registered' }, 404)
      }

      const allowCredentials = creds.map((c: any) => ({
        id: c.credential_id,
        type: 'public-key' as const,
        transports: c.transports || [],
      }))

      const options = await generateAuthenticationOptions({
        rpID: RP_ID_ENV,
        allowCredentials,
        userVerification: 'required',
      })

      // Store challenge
      await supabaseAdmin.from('webauthn_challenges').insert({
        user_id: profile.user_id,
        challenge: options.challenge,
        type: 'authentication',
      })

      return json({ ...options, userId: profile.user_id })
    }

    // ── VERIFY AUTHENTICATION ──
    if (action === 'auth-verify') {
      const { credential, userId } = body

      if (!credential || !userId) return json({ error: 'Missing data' }, 400)

      // Get stored challenge
      const { data: challengeRow } = await supabaseAdmin
        .from('webauthn_challenges')
        .select('challenge')
        .eq('user_id', userId)
        .eq('type', 'authentication')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!challengeRow) return json({ error: 'Challenge not found' }, 400)

      // Get the credential from DB
      const credentialId = credential.id
      const { data: storedCred } = await supabaseAdmin
        .from('webauthn_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('credential_id', credentialId)
        .single()

      if (!storedCred) return json({ error: 'Credential not found' }, 400)

      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challengeRow.challenge,
        expectedOrigin: ORIGIN_ENV,
        expectedRPID: RP_ID_ENV,
        credential: {
          id: storedCred.credential_id,
          publicKey: isoBase64URL.toBuffer(storedCred.public_key),
          counter: Number(storedCred.counter),
          transports: storedCred.transports || [],
        },
      })

      if (!verification.verified) {
        return json({ error: 'Authentication failed' }, 401)
      }

      // Update counter
      await supabaseAdmin
        .from('webauthn_credentials')
        .update({ counter: Number(verification.authenticationInfo.newCounter), updated_at: new Date().toISOString() })
        .eq('id', storedCred.id)

      // Clean up challenge
      await supabaseAdmin
        .from('webauthn_challenges')
        .delete()
        .eq('user_id', userId)
        .eq('type', 'authentication')

      // Generate a session for this user
      // Get user's email for sign-in
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (!userData?.user?.email) return json({ error: 'User not found' }, 404)

      // Create a custom token / sign-in link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.user.email,
      })

      if (linkError || !linkData) {
        return json({ error: 'Failed to generate session' }, 500)
      }

      // Extract token from the link and verify it to get a session
      const token_hash = linkData.properties?.hashed_token
      if (!token_hash) return json({ error: 'Failed to generate token' }, 500)

      const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
        token_hash,
        type: 'magiclink',
      })

      if (verifyError || !verifyData.session) {
        return json({ error: 'Failed to create session' }, 500)
      }

      return json({
        verified: true,
        session: verifyData.session,
        user: verifyData.user,
      })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    console.error('WebAuthn error:', err)
    return json({ error: String(err) }, 500)
  }
})

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
