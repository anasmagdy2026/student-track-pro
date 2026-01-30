import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type UserProfile = {
  id: string;
  user_id: string;
  username: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
};

export function useAdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase.rpc('is_admin', { _user_id: user.id });
    setIsAdmin(!!data);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      setUsers([]);
      setLoading(false);
      return;
    }

    // Check who is admin
    const { data: admins } = await supabase.from('user_admins').select('user_id');
    const adminIds = new Set(admins?.map((a) => a.user_id) || []);

    const usersWithAdmin = (profiles || []).map((p) => ({
      ...p,
      is_admin: adminIds.has(p.user_id),
    }));

    setUsers(usersWithAdmin as UserProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAdmin();
    fetchUsers();
  }, [checkAdmin, fetchUsers]);

  const createUser = async (payload: {
    email: string;
    password: string;
    username: string;
    is_active?: boolean;
    is_admin?: boolean;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('يجب تسجيل الدخول أولاً');
      throw new Error('Not authenticated');
    }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل إنشاء المستخدم');
    }

    await fetchUsers();
  };

  const updateUser = async (
    user_id: string,
    updates: {
      username?: string;
      email?: string;
      is_active?: boolean;
      is_admin?: boolean;
    }
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('يجب تسجيل الدخول أولاً');
      throw new Error('Not authenticated');
    }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id, ...updates }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل تحديث المستخدم');
    }

    await fetchUsers();
  };

  const resetPassword = async (user_id: string, new_password: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('يجب تسجيل الدخول أولاً');
      throw new Error('Not authenticated');
    }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id, new_password }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل إعادة تعيين كلمة المرور');
    }
  };

  return {
    users,
    loading,
    isAdmin,
    createUser,
    updateUser,
    resetPassword,
    refetch: fetchUsers,
  };
}