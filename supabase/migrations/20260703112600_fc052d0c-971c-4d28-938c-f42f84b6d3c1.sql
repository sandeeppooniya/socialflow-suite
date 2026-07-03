
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','editor','viewer');
CREATE TYPE public.post_status AS ENUM ('draft','scheduled','publishing','published','failed');
CREATE TYPE public.social_platform AS ENUM ('instagram','x','linkedin','facebook','tiktok');
CREATE TYPE public.account_status AS ENUM ('active','expired','revoked','error');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ WORKSPACES ============
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ws_members_user ON public.workspace_members(user_id);
CREATE INDEX idx_ws_members_ws ON public.workspace_members(workspace_id);

-- security definer helpers to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_workspace_member(_ws UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _ws AND user_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(_ws UUID, _user UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _ws AND user_id = _user AND role = ANY(_roles));
$$;

-- workspaces policies
CREATE POLICY "ws select for members" ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_workspace_member(id, auth.uid()));
CREATE POLICY "ws insert own" ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "ws update admin" ON public.workspaces FOR UPDATE TO authenticated
  USING (public.has_workspace_role(id, auth.uid(), ARRAY['super_admin','admin']::public.app_role[]))
  WITH CHECK (public.has_workspace_role(id, auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));
CREATE POLICY "ws delete owner" ON public.workspaces FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- members policies
CREATE POLICY "members select same ws" ON public.workspace_members FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members admin manage" ON public.workspace_members FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['super_admin','admin']::public.app_role[]))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

-- ============ SOCIAL ACCOUNTS ============
CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform public.social_platform NOT NULL,
  handle TEXT NOT NULL,
  external_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status public.account_status NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  connected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, platform, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_social_ws ON public.social_accounts(workspace_id);
CREATE POLICY "social read members" ON public.social_accounts FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "social manage editors" ON public.social_accounts FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]));

-- ============ MEDIA ============
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  mime TEXT,
  width INT,
  height INT,
  size_bytes BIGINT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_media_ws ON public.media_assets(workspace_id);
CREATE POLICY "media read members" ON public.media_assets FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "media write editors" ON public.media_assets FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]));

-- storage RLS: only members can rw objects in the media bucket under workspaces/{id}/
CREATE POLICY "media bucket read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'workspaces'
    AND public.is_workspace_member(((storage.foldername(name))[2])::uuid, auth.uid())
  );
CREATE POLICY "media bucket write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'workspaces'
    AND public.has_workspace_role(((storage.foldername(name))[2])::uuid, auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[])
  );
CREATE POLICY "media bucket delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'workspaces'
    AND public.has_workspace_role(((storage.foldername(name))[2])::uuid, auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[])
  );

-- ============ POSTS ============
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.post_status NOT NULL DEFAULT 'draft',
  caption TEXT NOT NULL DEFAULT '',
  media_ids UUID[] NOT NULL DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  recurrence JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_posts_ws_sched ON public.posts(workspace_id, scheduled_at);
CREATE INDEX idx_posts_ws_status ON public.posts(workspace_id, status);
CREATE POLICY "posts read members" ON public.posts FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "posts write editors" ON public.posts FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]));

CREATE TABLE public.post_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  platform_post_id TEXT,
  status public.post_status NOT NULL DEFAULT 'scheduled',
  error TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_targets TO authenticated;
GRANT ALL ON public.post_targets TO service_role;
ALTER TABLE public.post_targets ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_targets_post ON public.post_targets(post_id);
CREATE POLICY "targets follow post" ON public.post_targets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.is_workspace_member(p.workspace_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.has_workspace_role(p.workspace_id, auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[])));

-- ============ QUEUES ============
CREATE TABLE public.post_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_queues TO authenticated;
GRANT ALL ON public.post_queues TO service_role;
ALTER TABLE public.post_queues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queues members" ON public.post_queues FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "queues editors" ON public.post_queues FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notif_user_read ON public.notifications(user_id, read_at);
CREATE POLICY "notif own" ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ ACTIVITY LOG ============
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activity_ws_time ON public.activity_logs(workspace_id, created_at DESC);
CREATE POLICY "activity read members" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "activity insert members" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND auth.uid() = actor_id);

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER t_ws_upd BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER t_social_upd BEFORE UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER t_posts_upd BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ============ New user bootstrap ============
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_ws_id UUID;
  base_slug TEXT;
  final_slug TEXT;
  suffix INT := 0;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;

  base_slug := lower(regexp_replace(coalesce(split_part(NEW.email,'@',1),'workspace'),'[^a-z0-9]+','-','g'));
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.workspaces WHERE slug = final_slug) LOOP
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix;
  END LOOP;

  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name','My') || '''s Workspace', final_slug, NEW.id)
  RETURNING id INTO new_ws_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_ws_id, NEW.id, 'super_admin');

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
