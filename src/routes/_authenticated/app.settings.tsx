import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Card } from "@/components/app/ui";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/settings")({ component: Settings });

function Settings() {
  const { currentWorkspace, currentRole } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [tab, setTab] = useState<"profile" | "workspace">("profile");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [wsName, setWsName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-me"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return { user, profile: data };
    },
  });

  useEffect(() => {
    if (profile?.profile) { setFullName(profile.profile.full_name || ""); setAvatarUrl(profile.profile.avatar_url || ""); }
  }, [profile]);
  useEffect(() => { if (currentWorkspace) setWsName(currentWorkspace.name); }, [currentWorkspace]);

  const saveProfile = async () => {
    if (!profile?.user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, avatar_url: avatarUrl || null }).eq("id", profile.user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  const saveWorkspace = async () => {
    if (!wsId) return;
    setSaving(true);
    const { error } = await supabase.from("workspaces").update({ name: wsName }).eq("id", wsId);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Workspace saved");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="flex gap-1 border-b border-border">
        <TabBtn active={tab === "profile"} onClick={() => setTab("profile")}>Profile</TabBtn>
        <TabBtn active={tab === "workspace"} onClick={() => setTab("workspace")}>Workspace</TabBtn>
      </div>

      {tab === "profile" && (
        <Card className="space-y-4">
          <Field label="Email"><input disabled value={profile?.user?.email ?? ""} className="input opacity-70" /></Field>
          <Field label="Full name"><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" /></Field>
          <Field label="Avatar URL"><input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="input" placeholder="https://..." /></Field>
          <div className="pt-2">
            <button disabled={saving} onClick={saveProfile} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
            </button>
          </div>
        </Card>
      )}

      {tab === "workspace" && (
        <Card className="space-y-4">
          <Field label="Workspace name">
            <input value={wsName} onChange={(e) => setWsName(e.target.value)} disabled={currentRole !== "super_admin" && currentRole !== "admin"} className="input" />
          </Field>
          <Field label="Your role"><input disabled value={currentRole ?? ""} className="input opacity-70 capitalize" /></Field>
          {(currentRole === "super_admin" || currentRole === "admin") && (
            <div className="pt-2">
              <button disabled={saving} onClick={saveWorkspace} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save workspace
              </button>
            </div>
          )}
        </Card>
      )}

      <style>{`.input{width:100%;border:1px solid var(--color-input);background:var(--color-background);color:var(--color-foreground);border-radius:0.75rem;padding:0.625rem 0.75rem;font-size:0.875rem;outline:none;transition:border-color .15s, box-shadow .15s}.input:focus{border-color:var(--color-ring);box-shadow:0 0 0 3px color-mix(in oklab,var(--color-ring) 25%,transparent)}`}</style>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{children}</button>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-foreground/80">{label}</span>{children}</label>;
}
