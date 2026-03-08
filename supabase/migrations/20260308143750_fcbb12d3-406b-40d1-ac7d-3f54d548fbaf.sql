
DROP POLICY "Service role full access to challenges" ON public.webauthn_challenges;

CREATE POLICY "Users can manage own challenges"
  ON public.webauthn_challenges
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
