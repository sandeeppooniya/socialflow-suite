import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/workspace-context";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/format";

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, setWorkspaceId, loading } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }
    const { data: ws, error } = await supabase.from("workspaces").insert({ name: name.trim(), slug, owner_id: user.id }).select().single();
    if (error) { toast.error(error.message); setBusy(false); return; }
    await supabase.from("workspace_members").insert({ workspace_id: ws.id, user_id: user.id, role: "super_admin" });
    await qc.invalidateQueries({ queryKey: ["workspace-memberships"] });
    setWorkspaceId(ws.id);
    setName("");
    setCreating(false);
    setOpen(false);
    setBusy(false);
    toast.success("Workspace created");
  };

  if (loading) return <div className="h-9 w-40 animate-pulse rounded-lg bg-muted" />;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition min-w-0 max-w-[220px]"
      >
        <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-xs font-bold shrink-0">
          {currentWorkspace?.name?.[0]?.toUpperCase() ?? "W"}
        </span>
        <span className="truncate">{currentWorkspace?.name ?? "Select workspace"}</span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setCreating(false); }} />
          <div className="absolute left-0 mt-2 w-72 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg z-50 overflow-hidden">
            {!creating ? (
              <>
                <div className="p-1 max-h-72 overflow-auto">
                  {workspaces.map((w) => (
                    <button
                      key={w.workspace.id}
                      onClick={() => { setWorkspaceId(w.workspace.id); setOpen(false); }}
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted text-left"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-xs font-bold">
                        {w.workspace.name[0]?.toUpperCase()}
                      </span>
                      <span className="flex-1 truncate">{w.workspace.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{w.role.replace("_", " ")}</span>
                      {w.workspace.id === currentWorkspace?.id && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCreating(true)}
                  className={cn("w-full flex items-center gap-2 border-t border-border px-3 py-2 text-sm hover:bg-muted")}
                >
                  <Plus className="h-4 w-4" /> New workspace
                </button>
              </>
            ) : (
              <form onSubmit={onCreate} className="p-3 space-y-2">
                <label className="text-xs font-medium">Workspace name</label>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring" placeholder="Acme Inc." />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setCreating(false)} className="rounded-lg px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
                  <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium flex items-center gap-1 disabled:opacity-50">
                    {busy && <Loader2 className="h-3 w-3 animate-spin" />} Create
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
