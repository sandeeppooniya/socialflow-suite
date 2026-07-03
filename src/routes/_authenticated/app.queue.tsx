import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Card, Badge, EmptyState } from "@/components/app/ui";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { Clock, FileText, CheckCircle2, AlertCircle, Play, Trash2, Inbox } from "lucide-react";

const STATUSES = ["all", "draft", "scheduled", "published", "failed"] as const;
type Status = (typeof STATUSES)[number];

export const Route = createFileRoute("/_authenticated/app/queue")({ component: Queue });

function Queue() {
  const { currentWorkspace, canEdit } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [status, setStatus] = useState<Status>("scheduled");
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["posts", wsId, status],
    enabled: !!wsId,
    queryFn: async () => {
      let q = supabase.from("posts").select("*").eq("workspace_id", wsId!).order("scheduled_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q.limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["posts"] }); }
  };

  const publishNow = async (id: string) => {
    const { error } = await supabase.from("posts").update({ scheduled_at: new Date().toISOString(), status: "scheduled" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Queued for immediate publish"); qc.invalidateQueries({ queryKey: ["posts"] }); }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Queue</h1>
        <p className="text-sm text-muted-foreground">Manage everything that's in the pipeline.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition capitalize ${status === s ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{s}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : data.length === 0 ? (
        <Card><EmptyState icon={Inbox} title="Nothing here" description="Posts you create will appear in this queue." action={canEdit && <Link to="/app/composer" className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">Create a post</Link>} /></Card>
      ) : (
        <div className="grid gap-3">
          {data.map((p) => {
            const StatusIcon = p.status === "draft" ? FileText : p.status === "scheduled" ? Clock : p.status === "published" ? CheckCircle2 : AlertCircle;
            const variant: "default" | "success" | "danger" | "muted" = p.status === "published" ? "success" : p.status === "failed" ? "danger" : p.status === "draft" ? "muted" : "default";
            return (
              <Card key={p.id} className="p-4 flex items-center gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary shrink-0"><StatusIcon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{p.title || p.body?.slice(0, 80) || "Untitled"}</p>
                    <Badge variant={variant}>{p.status}</Badge>
                    {p.is_recurring && <Badge variant="muted">recurring</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.scheduled_at ? fmtDate(p.scheduled_at) : `Created ${fmtDate(p.created_at)}`}</p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    {p.status === "draft" && <button onClick={() => publishNow(p.id)} className="p-2 rounded-lg hover:bg-muted" title="Publish now"><Play className="h-4 w-4" /></button>}
                    <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-muted text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
