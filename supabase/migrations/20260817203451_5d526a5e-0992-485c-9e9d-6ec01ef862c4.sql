-- Adds the PBKDF2 iteration column for admin credentials.
-- NOTE: credential material (passcode hash / salt) is never written in
-- migrations. Set the admin passcode only through the app's reset flow.
ALTER TABLE public.admin_credentials ADD COLUMN IF NOT EXISTS iterations integer NOT NULL DEFAULT 210000;
ALTER TABLE public.admin_credentials ALTER COLUMN iterations SET DEFAULT 100000;
