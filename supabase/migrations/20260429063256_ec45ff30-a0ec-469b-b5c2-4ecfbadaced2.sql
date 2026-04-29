-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_request_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten request insert: must be the reporter or anonymous-allowed null
DROP POLICY IF EXISTS "Anyone authenticated can create request" ON public.emergency_requests;
CREATE POLICY "Authenticated users create requests as themselves"
  ON public.emergency_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);