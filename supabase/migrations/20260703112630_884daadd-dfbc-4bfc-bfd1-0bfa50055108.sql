
REVOKE ALL ON FUNCTION public.is_workspace_member(uuid,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_workspace_role(uuid,uuid,public.app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid,uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(uuid,uuid,public.app_role[]) TO authenticated, service_role;
