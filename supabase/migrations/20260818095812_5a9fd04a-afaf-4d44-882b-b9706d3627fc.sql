CREATE POLICY "No direct access to admin login tokens"
ON public.admin_login_tokens
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);