
CREATE POLICY "Authenticated users can view notifications"
ON public.registration_notifications FOR SELECT
TO authenticated
USING (true);
