import { useState, useCallback, useEffect } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webauthn`;

async function callWebAuthn(action: string, body: any = {}, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...body }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function useWebAuthn() {
  const { user, session } = useAuth();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if WebAuthn is supported
    setSupported(
      typeof window !== 'undefined' &&
      !!window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    );
  }, []);

  useEffect(() => {
    // Check platform authenticator availability
    if (supported) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(available => {
        setSupported(available);
      });
    }
  }, [supported]);

  // Fetch registered credentials
  const fetchCredentials = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setCredentials((data as any[]) || []);
  }, [user]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Register a new biometric credential
  const registerBiometric = useCallback(async (deviceName?: string) => {
    if (!session?.access_token) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }

    setLoading(true);
    try {
      // 1. Get registration options from server
      const options = await callWebAuthn('register-options', {}, session.access_token);

      // 2. Create credential on device
      const credential = await startRegistration({ optionsJSON: options });

      // 3. Verify with server
      await callWebAuthn('register-verify', {
        credential,
        deviceName: deviceName || getDeviceName(),
      }, session.access_token);

      toast.success('تم تسجيل البصمة بنجاح! 🎉');
      await fetchCredentials();
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error('تم إلغاء عملية التسجيل');
      } else {
        toast.error(err.message || 'حدث خطأ أثناء تسجيل البصمة');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [session, fetchCredentials]);

  // Authenticate with biometric
  const authenticateWithBiometric = useCallback(async (username: string) => {
    setLoading(true);
    try {
      // 1. Get authentication options
      const options = await callWebAuthn('auth-options', { username });
      const { userId, ...authOptions } = options;

      // 2. Authenticate on device
      const credential = await startAuthentication({ optionsJSON: authOptions });

      // 3. Verify with server
      const result = await callWebAuthn('auth-verify', { credential, userId });

      if (!result.verified || !result.session) {
        throw new Error('Authentication failed');
      }

      // 4. Set session
      const { error } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });

      if (error) throw error;

      toast.success('تم تسجيل الدخول بالبصمة بنجاح! 🎉');
      return { success: true };
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error('تم إلغاء عملية المصادقة');
      } else {
        toast.error(err.message || 'فشل تسجيل الدخول بالبصمة');
      }
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove a credential
  const removeCredential = useCallback(async (credentialId: string) => {
    const { error } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('id', credentialId);

    if (error) {
      toast.error('حدث خطأ أثناء حذف البصمة');
      return false;
    }
    toast.success('تم حذف البصمة بنجاح');
    await fetchCredentials();
    return true;
  }, [fetchCredentials]);

  return {
    supported,
    loading,
    credentials,
    registerBiometric,
    authenticateWithBiometric,
    removeCredential,
    hasCredentials: credentials.length > 0,
  };
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  return 'جهاز غير معروف';
}
