import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Card } from "@/components/app/ui";
import { BarChart3 } from "lucide-react";

type Row = { id: string; status: string; published_at: string | null; created_at: string };

export const Route = createFileRoute("/_authenticated/app/analytics")({ component: Analytics });

function Analytics() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data = [] } = useQuery<Row[]>({
    queryKey: ["analytics-posts", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data } = await supabase.from("posts").select("id, status, published_at, created_at").eq("workspace_id", wsId!).gte("created_at", since.toISOString()).limit(500);
      return (data ?? []) as Row[];
    },
  });

  const { data: targets = [] } = useQuery<{ social_account_id: string; social_accounts: { platform: string } | null }[]>({
    queryKey: ["analytics-targets", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data } = await supabase
        .from("post_targets")
        .select("social_account_id, social_accounts!inner(platform, workspace_id)")
        .gte("created_at", since.toISOString());
      // filter to this workspace via inner join relation
      return (data ?? []).filter((t) => (t.social_accounts as unknown as { workspace_id: string })?.workspace_id === wsId) as never;
    },
  });

  const summary = useMemo(() => {
    const total = data.length;
    const published = data.filter((p) => p.status === "published").length;
    const scheduled = data.filter((p) => p.status === "scheduled").length;
    const failed = data.filter((p) => p.status === "failed").length;
    const byPlat: Record<string, number> = {};
    targets.forEach((t) => { const pl = t.social_accounts?.platform; if (pl) byPlat[pl] = (byPlat[pl] ?? 0) + 1; });
    const days = new Array(30).fill(0);
    data.forEach((p) => {
      const d = p.published_at || p.created_at;
      if (!d) return;
      const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
      if (diff >= 0 && diff < 30) days[29 - diff] += 1;
    });
    const max = Math.max(...days, 1);
    return { total, published, scheduled, failed, byPlat, days, max };
  }, [data, targets]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Last 30 days.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Total posts" value={summary.total} />
        <Metric label="Published" value={summary.published} />
        <Metric label="Scheduled" value={summary.scheduled} />
        <Metric label="Failed" value={summary.failed} />
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4"><BarChart3 className="h-4 w-4 text-primary" /><h3 className="font-semibold">Activity (30 days)</h3></div>
        <div className="flex items-end gap-1 h-40">
          {summary.days.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div className="w-full rounded-t bg-gradient-to-t from-primary to-primary-glow" style={{ height: `${(v / summary.max) * 100}%`, minHeight: v ? "4px" : "1px" }} title={`${v} posts`} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">By platform</h3>
        {Object.keys(summary.byPlat).length === 0 ? (
          <p className="text-sm text-muted-foreground">No published targets yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(summary.byPlat).sort((a, b) => b[1] - a[1]).map(([plat, count]) => {
              const totalT = Object.values(summary.byPlat).reduce((a, b) => a + b, 0);
              return (
                <div key={plat}>
                  <div className="flex items-center justify-between text-sm mb-1"><span className="capitalize font-medium">{plat}</span><span className="text-muted-foreground">{count}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(count / totalT) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card className="p-5"><p className="text-3xl font-semibold">{value}</p><p className="text-xs text-muted-foreground mt-1">{label}</p></Card>;
}
