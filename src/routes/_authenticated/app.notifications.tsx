import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Card, EmptyState } from "@/components/app/ui";
import { fmtRelative } from "@/lib/format";
import { Bell } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/app/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const qc = useQueryClient();

  const { data = [] } = useQuery({
    queryKey: ["notifications-page", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (wsId && data.some((n) => !n.read_at)) {
      supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("workspace_id", wsId).is("read_at", null).then(() => qc.invalidateQueries());
    }
  }, [wsId, data, qc]);

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      {data.length === 0 ? (
        <Card><EmptyState icon={Bell} title="You're all caught up" description="We'll ping you when something important happens." /></Card>
      ) : (
        <div className="space-y-2">
          {data.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`h-2 w-2 mt-2 rounded-full ${n.read_at ? "bg-muted" : "bg-accent"}`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{fmtRelative(n.created_at)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
