import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Get Google OAuth2 access token from service account
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: any) => {
    const json = JSON.stringify(obj);
    return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  // Import the private key for signing
  const pemContent = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Failed to get access token: ${err}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, body, tokens, type = "general" } = await req.json();

    if (!title || !body) {
      return new Response(JSON.stringify({ error: "title and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no tokens provided, fetch all tokens from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let targetTokens: string[] = tokens || [];

    if (targetTokens.length === 0) {
      const { data: tokenRows } = await supabase
        .from("fcm_tokens")
        .select("token");
      targetTokens = (tokenRows || []).map((r: any) => r.token);
    }

    if (targetTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No tokens to send to", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Firebase service account
    const serviceAccountStr = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountStr) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");
    }
    
    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(serviceAccountStr);
    } catch (parseErr) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", parseErr);
      console.error("First 100 chars:", serviceAccountStr.substring(0, 100));
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
    }
    
    if (!serviceAccount.private_key) {
      console.error("Service account keys present:", Object.keys(serviceAccount));
      throw new Error("FIREBASE_SERVICE_ACCOUNT is missing private_key field. Available keys: " + Object.keys(serviceAccount).join(", "));
    }
    if (!serviceAccount.client_email) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is missing client_email field");
    }
    
    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    let successCount = 0;
    let failureCount = 0;
    const failedTokens: string[] = [];

    // Send to each token via FCM v1 API
    for (const token of targetTokens) {
      try {
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token,
                notification: { title, body },
                webpush: {
                  notification: {
                    title,
                    body,
                    icon: "https://mrmagdy.lovable.app/pwa-192x192.png",
                    badge: "https://mrmagdy.lovable.app/pwa-192x192.png",
                    dir: "rtl",
                    lang: "ar",
                    requireInteraction: true,
                    vibrate: [200, 100, 200],
                    tag: type,
                  },
                  fcm_options: {
                    link: "https://mrmagdy.lovable.app/",
                  },
                },
                data: { type, title, body },
              },
            }),
          }
        );

        if (res.ok) {
          successCount++;
        } else {
          failureCount++;
          const errBody = await res.text();
          console.error(`FCM send failed for token ${token.slice(0, 10)}...: ${errBody}`);
          // If token is invalid, mark for removal
          if (errBody.includes("UNREGISTERED") || errBody.includes("INVALID_ARGUMENT")) {
            failedTokens.push(token);
          }
        }
      } catch (e) {
        failureCount++;
        console.error(`Error sending to token: ${e}`);
      }
    }

    // Remove invalid tokens
    if (failedTokens.length > 0) {
      await supabase.from("fcm_tokens").delete().in("token", failedTokens);
    }

    // Log the notification
    await supabase.from("notification_log").insert({
      type,
      title,
      body,
      target_tokens: targetTokens,
      success_count: successCount,
      failure_count: failureCount,
    });

    return new Response(
      JSON.stringify({ success: true, sent: successCount, failed: failureCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-notification error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
