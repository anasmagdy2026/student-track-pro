-- Add admin managers list (separate from profiles)
CREATE TABLE IF NOT EXISTS public.user_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_admins ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER function to avoid recursive RLS issues
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_admins
    WHERE user_id = _user_id
  )
$$;

-- Only admins can manage the admin list (bootstrap handled via server-side function)
DROP POLICY IF EXISTS "Admins manage user_admins" ON public.user_admins;
CREATE POLICY "Admins manage user_admins"
ON public.user_admins
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Add activation flag to profiles so disabled users can't access the app
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Ensure usernames are unique (required for username login)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_username_unique'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_unique UNIQUE (username);
  END IF;
END $$;