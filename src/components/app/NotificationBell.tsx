import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { fmtRelative } from "@/lib/format";

export function NotificationBell() {
  const { currentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data = [] } = useQuery({
    queryKey: ["notifications", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!currentWorkspace) return;
    const ch = supabase
      .channel(`notif:${currentWorkspace.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `workspace_id=eq.${currentWorkspace.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["notifications", currentWorkspace.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentWorkspace, qc]);

  const unread = data.filter((n) => !n.read_at).length;

  const markAll = async () => {
    if (!currentWorkspace) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("workspace_id", currentWorkspace.id).is("read_at", null);
    qc.invalidateQueries({ queryKey: ["notifications", currentWorkspace.id] });
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded-lg hover:bg-muted transition" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-4 px-1 text-[10px] font-bold rounded-full bg-accent text-accent-foreground flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-xl border border-border bg-popover shadow-lg z-50">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && <button onClick={markAll} className="text-xs text-primary hover:underline">Mark all read</button>}
            </div>
            {data.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</p>}
            <div className="divide-y divide-border">
              {data.map((n) => (
                <div key={n.id} className={`p-3 ${!n.read_at ? "bg-primary-soft/40" : ""}`}>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{fmtRelative(n.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
