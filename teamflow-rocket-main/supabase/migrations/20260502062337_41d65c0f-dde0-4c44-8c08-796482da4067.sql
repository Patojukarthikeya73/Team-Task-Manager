
-- Trigger-only functions: revoke direct execute
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
