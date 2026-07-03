import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Card, Badge, EmptyState } from "@/components/app/ui";
import { fmtRelative } from "@/lib/format";
import { toast } from "sonner";
import { Shield, Trash2, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/admin")({ component: Admin });

const ROLES = ["super_admin", "admin", "editor", "viewer"] as const;

function Admin() {
  const { currentWorkspace, isAdmin, currentRole } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const qc = useQueryClient();
  const [tab, setTab] = useState<"members" | "activity" | "posts">("members");

  if (!isAdmin) {
    return <Card><EmptyState icon={Shield} title="Admin only" description="You need admin access to view this page." /></Card>;
  }

  const { data: members = [] } = useQuery({
    queryKey: ["members", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("workspace_members").select("*, profiles!workspace_members_user_id_fkey(id, full_name, avatar_url)").eq("workspace_id", wsId!);
      return data ?? [];
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["admin-activity", wsId],
    enabled: !!wsId && tab === "activity",
    queryFn: async () => {
      const { data } = await supabase.from("activity_logs").select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ["admin-posts", wsId],
    enabled: !!wsId && tab === "posts",
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("id, title, body, status, scheduled_at, created_by").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const changeRole = async (id: string, role: typeof ROLES[number]) => {
    const { error } = await supabase.from("workspace_members").update({ role }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["members", wsId] }); }
  };

  const removeMember = async (id: string) => {
    if (!confirm("Remove this member?")) return;
    const { error } = await supabase.from("workspace_members").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["members", wsId] }); }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workspace admin</h1>
        <p className="text-sm text-muted-foreground">Manage members, posts, and audit activity.</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["members","activity","posts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      {tab === "members" && (
        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserPlus className="h-4 w-4" />
              To invite a user, share your workspace link — they can sign up and you'll add them here once they appear.
            </div>
          </Card>
          {members.map((m) => {
            type P = { full_name?: string | null; avatar_url?: string | null } | null;
            const p = (m as unknown as { profiles: P }).profiles;
            return (
              <Card key={m.id} className="p-4 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {(p?.full_name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{p?.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">Joined {fmtRelative(m.created_at)}</p>
                </div>
                <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value as typeof ROLES[number])} disabled={currentRole !== "super_admin"} className="rounded-lg border border-input bg-background px-2 py-1 text-sm">
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace("_"," ")}</option>)}
                </select>
                {currentRole === "super_admin" && (
                  <button onClick={() => removeMember(m.id)} className="p-2 rounded-lg hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "activity" && (
        <Card>
          {activity.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p> : (
            <ul className="divide-y divide-border">
              {activity.map((a) => (
                <li key={a.id} className="py-3">
                  <p className="text-sm font-medium">{a.action.replace(/_/g, " ")} {a.target_type && <span className="text-muted-foreground">· {a.target_type}</span>}</p>
                  <p className="text-xs text-muted-foreground">{fmtRelative(a.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "posts" && (
        <div className="space-y-2">
          {allPosts.length === 0 ? <Card><EmptyState icon={Shield} title="No posts yet" /></Card> : allPosts.map((p) => (
            <Card key={p.id} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.title || p.body?.slice(0, 60) || "Untitled"}</p>
                <p className="text-xs text-muted-foreground">{p.scheduled_at ? fmtRelative(p.scheduled_at) : "no schedule"}</p>
              </div>
              <Badge>{p.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
