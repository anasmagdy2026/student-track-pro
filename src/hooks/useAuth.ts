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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
