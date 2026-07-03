import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Card } from "@/components/app/ui";
import { toast } from "sonner";
import { Loader2, Send, Save, Calendar as CalIcon, Image as ImageIcon, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/composer")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined }),
  component: Composer,
});

const PLATFORMS = ["instagram", "facebook", "twitter", "linkedin", "youtube", "tiktok"] as const;

function Composer() {
  const { currentWorkspace, canEdit } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [targets, setTargets] = useState<string[]>([]);
  const [media, setMedia] = useState<{ id: string; url: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [postId, setPostId] = useState<string | undefined>(search.id);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("social_accounts").select("*").eq("workspace_id", wsId!).eq("is_active", true);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!postId || !wsId) return;
    (async () => {
      const { data } = await supabase.from("posts").select("*, post_targets(social_account_id), media_assets:media_assets!posts_media_asset_id_fkey(*)").eq("id", postId).maybeSingle();
      if (data) {
        setTitle(data.title || "");
        setBody(data.body || "");
        setScheduledAt(data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 16) : "");
        setRecurring((data.recurrence_pattern as typeof recurring) || "none");
      }
    })();
  }, [postId, wsId]);

  const upload = async (file: File) => {
    if (!wsId) return;
    const path = `${wsId}/${crypto.randomUUID()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("media").upload(path, file);
    if (upErr) { toast.error(upErr.message); return; }
    const { data: signed } = await supabase.storage.from("media").createSignedUrl(path, 3600);
    const { data: asset, error } = await supabase.from("media_assets").insert({
      workspace_id: wsId, storage_path: path, mime_type: file.type, size_bytes: file.size, filename: file.name,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setMedia((m) => [...m, { id: asset.id, url: signed?.signedUrl || "" }]);
  };

  const save = async (status: "draft" | "scheduled") => {
    if (!wsId || !canEdit) return;
    if (status === "scheduled" && !scheduledAt) { toast.error("Pick a schedule time"); return; }
    if (status === "scheduled" && targets.length === 0) { toast.error("Select at least one account"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      workspace_id: wsId,
      created_by: user!.id,
      title: title || null,
      body,
      status,
      scheduled_at: status === "scheduled" ? new Date(scheduledAt).toISOString() : null,
      is_recurring: recurring !== "none",
      recurrence_pattern: recurring === "none" ? null : recurring,
      media_asset_id: media[0]?.id || null,
    };
    let id = postId;
    if (id) {
      const { error } = await supabase.from("posts").update(payload).eq("id", id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("posts").insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      id = data.id;
      setPostId(id);
    }
    // upsert targets
    if (id) {
      await supabase.from("post_targets").delete().eq("post_id", id);
      if (targets.length) {
        await supabase.from("post_targets").insert(targets.map((accId) => ({ post_id: id!, social_account_id: accId })));
      }
    }
    toast.success(status === "scheduled" ? "Scheduled" : "Draft saved");
    setSaving(false);
    if (status === "scheduled") navigate({ to: "/app/queue" });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 max-w-6xl">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Composer</h1>
        <Card>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full bg-transparent outline-none text-lg font-medium mb-3" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="What do you want to share?" className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed" />
          {media.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {media.map((m) => (
                <div key={m.id} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
                  {m.url ? <img src={m.url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center bg-muted"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>}
                  <button onClick={() => setMedia((x) => x.filter((y) => y.id !== m.id))} className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <ImageIcon className="h-4 w-4" />
              <span>Add media</span>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            </label>
            <p className="text-xs text-muted-foreground">{body.length} chars</p>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <h3 className="font-semibold text-sm mb-3">Publish to</h3>
          {accounts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No accounts connected. <a href="/app/accounts" className="text-primary hover:underline">Connect one</a>.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={targets.includes(a.id)} onChange={(e) => setTargets((t) => e.target.checked ? [...t, a.id] : t.filter((x) => x !== a.id))} className="accent-primary" />
                  <span className="capitalize font-medium">{a.platform}</span>
                  <span className="text-muted-foreground truncate">{a.account_name}</span>
                </label>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">Supports: {PLATFORMS.join(", ")}</p>
        </Card>

        <Card>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><CalIcon className="h-4 w-4" /> Schedule</h3>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring" />
          <label className="mt-3 block text-xs font-medium">Repeat</label>
          <select value={recurring} onChange={(e) => setRecurring(e.target.value as typeof recurring)} className="mt-1 w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring">
            <option value="none">Do not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </Card>

        <div className="flex flex-col gap-2">
          <button disabled={saving || !canEdit} onClick={() => save("scheduled")} className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-soft)] hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Schedule
          </button>
          <button disabled={saving || !canEdit} onClick={() => save("draft")} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50 flex items-center justify-center gap-2">
            <Save className="h-4 w-4" /> Save as draft
          </button>
        </div>
      </div>
    </div>
  );
}
