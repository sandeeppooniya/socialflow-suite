import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: string;
};

export type WorkspaceMember = {
  workspace: Workspace;
  role: "super_admin" | "admin" | "editor" | "viewer";
};

type Ctx = {
  workspaces: WorkspaceMember[];
  currentWorkspace: Workspace | null;
  currentRole: WorkspaceMember["role"] | null;
  setWorkspaceId: (id: string) => void;
  loading: boolean;
  isAdmin: boolean;
  canEdit: boolean;
};

const WorkspaceContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "sf-workspace-id";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-memberships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("role, workspace:workspaces!inner(id, name, slug, owner_id, plan)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as WorkspaceMember[];
    },
  });

  const workspaces = data ?? [];

  useEffect(() => {
    if (!workspaces.length) return;
    if (!workspaceId || !workspaces.find((w) => w.workspace.id === workspaceId)) {
      setWorkspaceIdState(workspaces[0].workspace.id);
    }
  }, [workspaces, workspaceId]);

  const setWorkspaceId = (id: string) => {
    setWorkspaceIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
    qc.invalidateQueries();
  };

  const current = workspaces.find((w) => w.workspace.id === workspaceId) ?? workspaces[0] ?? null;

  const value = useMemo<Ctx>(
    () => ({
      workspaces,
      currentWorkspace: current?.workspace ?? null,
      currentRole: current?.role ?? null,
      setWorkspaceId,
      loading: isLoading,
      isAdmin: current?.role === "super_admin" || current?.role === "admin",
      canEdit: current ? current.role !== "viewer" : false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaces, current, isLoading],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
