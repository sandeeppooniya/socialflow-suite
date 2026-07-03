import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Card, Badge } from "@/components/app/ui";
import { fmtDate, fmtRelative } from "@/lib/format";
import { PenSquare, Calendar, Users2, BarChart3, CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data: stats } = useQuery({
    queryKey: ["dash-stats", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const q = (status: string) => supabase.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId!).eq("status", status);
      const [d, s, p, f, acc] = await Promise.all([
        q("draft"), q("scheduled"), q("published"), q("failed"),
        supabase.from("social_accounts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId!).eq("is_active", true),
      ]);
      return { draft: d.count ?? 0, scheduled: s.count ?? 0, published: p.count ?? 0, failed: f.count ?? 0, accounts: acc.count ?? 0 };
    },
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ["dash-upcoming", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("id, title, body, status, scheduled_at").eq("workspace_id", wsId!).eq("status", "scheduled").order("scheduled_at", { ascending: true }).limit(5);
      return data ?? [];
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["dash-activity", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("activity_logs").select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back 👋</h1>
          <p className="text-sm text-muted-foreground">Here's what's happening in {currentWorkspace?.name}.</p>
        </div>
        <Link to="/app/composer" className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] hover:bg-primary/90 flex items-center gap-2">
          <PenSquare className="h-4 w-4" /> Create post
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Drafts" value={stats?.draft ?? 0} tone="muted" />
        <StatCard icon={Clock} label="Scheduled" value={stats?.scheduled ?? 0} tone="default" />
        <StatCard icon={CheckCircle2} label="Published" value={stats?.published ?? 0} tone="success" />
        <StatCard icon={AlertCircle} label="Failed" value={stats?.failed ?? 0} tone="danger" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming posts</h2>
            <Link to="/app/queue" className="text-xs text-primary hover:underline">View queue →</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nothing scheduled. <Link to="/app/composer" className="text-primary hover:underline">Compose a post</Link>.</p>
          ) : (
            <div className="divide-y divide-border">
              {upcoming.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.title || p.body?.slice(0, 60) || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(p.scheduled_at)}</p>
                  </div>
                  <Badge>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-medium">{a.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{fmtRelative(a.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <QuickLink to="/app/calendar" icon={Calendar} title="Calendar" desc="Plan your week" />
        <QuickLink to="/app/accounts" icon={Users2} title="Connect accounts" desc={`${stats?.accounts ?? 0} connected`} />
        <QuickLink to="/app/analytics" icon={BarChart3} title="Analytics" desc="See what's working" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: "default" | "success" | "danger" | "muted" }) {
  const toneMap = { default: "bg-primary-soft text-primary", success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", danger: "bg-red-500/10 text-red-600 dark:text-red-400", muted: "bg-muted text-muted-foreground" };
  return (
    <Card className="p-5">
      <div className={`inline-grid h-10 w-10 place-items-center rounded-xl ${toneMap[tone]}`}><Icon className="h-5 w-5" /></div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function QuickLink({ to, icon: Icon, title, desc }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to as "/app"} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-[var(--shadow-card)] transition group">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary group-hover:scale-105 transition"><Icon className="h-5 w-5" /></div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}
