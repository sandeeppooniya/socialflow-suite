import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace-context";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState } from "@/components/app/ui";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <WorkspaceProvider>
      <Gate />
    </WorkspaceProvider>
  );
}

function Gate() {
  const { workspaces, loading, currentWorkspace } = useWorkspace();
  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-background"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
  }
  if (!workspaces.length) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-md w-full">
          <EmptyState
            icon={Sparkles}
            title="Setting up your workspace…"
            description="If this persists, try reloading the page."
          />
        </div>
      </div>
    );
  }
  if (!currentWorkspace) return null;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
