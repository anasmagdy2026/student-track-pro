import { useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
  });

  useEffect(() => {
    // 1) Subscribe first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        loading: false,
        session,
        user: session?.user ?? null,
      });
    });

    // 2) Then hydrate existing session
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setState({
          loading: false,
          session: data.session,
          user: data.session?.user ?? null,
        });
      })
      .catch(() => {
        setState({ loading: false, session: null, user: null });
      });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!state.user;

  const signIn = async (email: string, password: string) => {
    // Use edge function to login with username
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/login-with-username`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return { data: null, error: { message: err.error || 'Login failed' } };
    }

    const { session, user } = await res.json();
    
    // Set session manually
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    const data = error ? null : { session, user };
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  };

  return useMemo(
    () => ({
      loading: state.loading,
      session: state.session,
      user: state.user,
      isAuthenticated,
      signIn,
      signUp,
      signOut,
      updatePassword,
    }),
    [state.loading, state.session, state.user, isAuthenticated]
  );
}
