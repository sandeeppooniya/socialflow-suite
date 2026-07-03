import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Card, EmptyState, Badge } from "@/components/app/ui";
import { toast } from "sonner";
import { Users2, Plus, Trash2, Instagram, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { useState } from "react";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "twitter", label: "X / Twitter", icon: Twitter },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "tiktok", label: "TikTok", icon: Users2 },
] as const;

export const Route = createFileRoute("/_authenticated/app/accounts")({ component: Accounts });

function Accounts() {
  const { currentWorkspace, canEdit } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const qc = useQueryClient();
  const [adding, setAdding] = useState<null | typeof PLATFORMS[number]["key"]>(null);
  const [name, setName] = useState("");

  const { data = [] } = useQuery({
    queryKey: ["accounts-all", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("social_accounts").select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsId || !adding) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("social_accounts").insert({
      workspace_id: wsId, platform: adding, account_name: name, connected_by: user!.id, is_active: true,
      // real OAuth tokens will be attached via Instagram OAuth flow for that platform
      access_token: null, refresh_token: null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(adding === "instagram" ? "Placeholder created. Complete Instagram OAuth from settings." : "Mock account added");
    setName(""); setAdding(null);
    qc.invalidateQueries({ queryKey: ["accounts-all", wsId] });
  };

  const disconnect = async (id: string) => {
    if (!confirm("Disconnect this account?")) return;
    await supabase.from("social_accounts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["accounts-all", wsId] });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Social accounts</h1>
        <p className="text-sm text-muted-foreground">Connect the channels you publish to. Instagram uses live publishing; other platforms are mocked for now.</p>
      </div>

      {canEdit && (
        <Card>
          <h3 className="font-semibold mb-3 text-sm">Connect a new account</h3>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button key={p.key} onClick={() => setAdding(p.key)} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted hover:border-primary/40 transition">
                <p.icon className="h-4 w-4" /> {p.label}
              </button>
            ))}
          </div>
          {adding && (
            <form onSubmit={addAccount} className="mt-4 pt-4 border-t border-border flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Account handle for <b className="capitalize">{adding}</b>:</span>
              <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="@handle" className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring flex-1 min-w-[200px]" />
              <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
              <button type="button" onClick={() => setAdding(null)} className="rounded-lg px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
            </form>
          )}
        </Card>
      )}

      {data.length === 0 ? (
        <Card><EmptyState icon={Users2} title="No accounts connected" description="Connect Instagram, Facebook and more to start scheduling." /></Card>
      ) : (
        <div className="grid gap-3">
          {data.map((a) => {
            const P = PLATFORMS.find((p) => p.key === a.platform) ?? PLATFORMS[0];
            return (
              <Card key={a.id} className="p-4 flex items-center gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><P.icon className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{a.account_name}</p>
                    <Badge variant={a.is_active ? "success" : "muted"}>{a.is_active ? "Active" : "Paused"}</Badge>
                    {a.platform !== "instagram" && <Badge variant="warning">mocked</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{a.platform}</p>
                </div>
                {canEdit && <button onClick={() => disconnect(a.id)} className="p-2 rounded-lg hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
