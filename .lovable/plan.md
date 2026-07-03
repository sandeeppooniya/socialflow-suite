
# SocialFlow — Production upgrade plan

Landing page (`/`) is preserved. Everything below is added under an authenticated app shell at `/app/*`, with an admin area at `/app/admin/*`.

## 1. Backend (Lovable Cloud) — schema

New tables (all in `public`, RLS on, grants + policies included):

- `profiles` (id → auth.users, full_name, avatar_url, timezone, created_at)
- `app_role` enum: `super_admin`, `admin`, `editor`, `viewer`
- `workspaces` (id, name, slug, owner_id, plan, created_at)
- `workspace_members` (workspace_id, user_id, role app_role, unique)
- `has_role(_user, _workspace, _role)` security-definer helper (no RLS recursion)
- `social_accounts` (id, workspace_id, platform, handle, external_id, access_token, refresh_token, token_expires_at, status, meta jsonb)
- `media_assets` (id, workspace_id, uploader_id, storage_path, mime, width, height, size_bytes, tags[])
- `posts` (id, workspace_id, author_id, status: draft|scheduled|publishing|published|failed, caption, media_ids uuid[], scheduled_at, published_at, timezone, recurrence jsonb, error, created_at)
- `post_targets` (id, post_id, social_account_id, platform_post_id, status, error)
- `post_queues` (id, workspace_id, name, slots jsonb) — recurring time-slot templates
- `notifications` (id, user_id, workspace_id, kind, payload jsonb, read_at, created_at)
- `activity_logs` (id, workspace_id, actor_id, action, target_type, target_id, meta jsonb, created_at)

Indexes on all FKs, `posts(workspace_id, scheduled_at)`, `notifications(user_id, read_at)`, `activity_logs(workspace_id, created_at desc)`.

Storage bucket `media` (private) with RLS keyed on `workspace_members`.

Trigger: on `auth.users` insert → create `profiles` row + a personal workspace + owner membership.

## 2. Auth

- Email + password and Google (via Lovable-managed Google broker).
- `/auth` public route (sign in / sign up / forgot / reset-password).
- Managed `_authenticated` gate protects `/app/*`.
- Session-aware navbar; sign-out hygiene per stack rules.

## 3. App shell (`/app`)

- Responsive sidebar + top bar, workspace switcher, notification bell, avatar menu.
- Dark mode via `class` on `<html>`, toggle persisted in `localStorage`, honors `prefers-color-scheme` on first load. Semantic tokens extended with `.dark` values.
- Routes:
  - `/app` dashboard (KPIs, upcoming posts, recent activity)
  - `/app/calendar` month/week calendar with drag-and-drop to reschedule (uses `@dnd-kit`)
  - `/app/queue` list of scheduled posts grouped by day, quick reorder
  - `/app/composer` create/edit post (caption, media picker, platform picker, schedule/recur)
  - `/app/library` media grid + upload (drag-drop, progress)
  - `/app/accounts` connected social accounts (connect / disconnect / reauth)
  - `/app/analytics` charts: posts published, per-platform breakdown, best time (Recharts)
  - `/app/notifications` full inbox
  - `/app/settings/profile`, `/app/settings/workspace`, `/app/settings/members`
  - `/app/admin` workspace-admin: members, roles, activity logs, all posts

## 4. Scheduler

- `createServerFn` mutations: create/update/delete post, change status, reschedule.
- Recurrence stored as `{ freq, interval, byweekday[], time, endsAt }`; next-occurrence computed server-side.
- **Publisher**: `POST /api/public/cron/publish-due` (HMAC-signed with `CRON_SECRET`). Picks posts where `status='scheduled' AND scheduled_at <= now()`, marks `publishing`, calls per-platform publisher, writes `post_targets`, sets `published`/`failed`, creates notification + activity log, and enqueues next recurrence occurrence. User configures pg_cron or external scheduler to hit it (URL + secret shown in Settings → Automations).
- Instagram publisher: real. Others (X, LinkedIn, TikTok, Facebook): stubbed with a clear "not connected" path — easy to wire later.

## 5. Instagram integration

Instagram Graph API requires a Meta Developer app + Instagram Business account linked to a Facebook Page. I will:
- Add OAuth start/callback server routes (`/api/public/oauth/instagram/{start,callback}`).
- Store long-lived tokens on `social_accounts`.
- Publish flow: upload media container → publish container → save `platform_post_id`.
- Ask you for `META_APP_ID`, `META_APP_SECRET` via `add_secret` when you're ready; until then the Accounts page shows "Set up Instagram" with clear instructions.

## 6. Analytics

- Server fn aggregates from `posts` + `post_targets`: totals by status, per-platform, per-day (last 30 days), success rate.
- Recharts area + bar charts, KPI cards.
- (Real engagement metrics require per-platform API pulls — out of scope this pass; noted in UI.)

## 7. Notifications & activity

- Notifications generated on publish success/failure, member added, account reauth needed.
- Realtime via `supabase.channel('notifications')` for the current user.
- Bell dropdown + `/app/notifications` inbox with mark-read.
- Activity logs page (admin) with filter by actor/action/date.

## 8. Admin dashboard (workspace-admin)

Gated by `has_role(auth.uid(), workspace_id, 'admin' | 'super_admin')`. Members management (invite by email, change role, remove), all workspace posts, activity log.

## 9. Security

- RLS on every table, all scoped through `workspace_members`.
- Explicit `GRANT`s on each new public table.
- Roles in `workspace_members`, never on profiles.
- `has_role()` `SECURITY DEFINER` to avoid recursion.
- Server functions for anything touching tokens; `requireSupabaseAuth` middleware.
- Storage RLS: only members can read/write objects under `workspaces/{id}/…`.
- Input validation with Zod on every server fn.

## 10. Tech notes

- Preserves existing landing page and design tokens; extends dark-mode tokens.
- New deps: `@dnd-kit/core`, `@dnd-kit/sortable`, `date-fns`, `recharts`, `zod` (if not already), `zustand` (light UI state).
- All new code TypeScript, functional components, Tailwind + shadcn.

## Execution order (this turn)

1. Enable Cloud + configure Google auth.
2. Run migration (schema + policies + trigger + storage bucket).
3. Auth routes + `_authenticated` shell + dark mode.
4. Workspace context + switcher.
5. Composer + library + accounts + queue + calendar + dashboard + analytics + notifications + admin + settings.
6. Cron publisher route + Instagram OAuth scaffold (secrets requested only when you're ready to test live).
7. Verify build.

Given the surface area, expect some pages to land as first-cut polished-but-lean and iterate from there. Landing page stays intact.

---

**Confirm this plan and I'll execute it in the next turn.** If you'd rather I split into 2–3 turns (foundation → scheduler → admin/analytics) for tighter review, say so.
