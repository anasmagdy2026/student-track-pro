
-- Add Friday session fields to groups
ALTER TABLE public.groups
ADD COLUMN has_friday_session boolean NOT NULL DEFAULT false,
ADD COLUMN friday_time text DEFAULT null;
