import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calendar,
  Inbox,
  PenSquare,
  Images,
  Users2,
  BarChart3,
  Bell,
  Settings,
  Shield,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/format";
import { useWorkspace } from "@/lib/workspace-context";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/composer", label: "Composer", icon: PenSquare },
  { to: "/app/calendar", label: "Calendar", icon: Calendar },
  { to: "/app/queue", label: "Queue", icon: Inbox },
  { to: "/app/library", label: "Content Library", icon: Images },
  { to: "/app/accounts", label: "Social Accounts", icon: Users2 },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
] as const;

const adminNav = [
  { to: "/app/admin", label: "Workspace Admin", icon: Shield },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isAdmin } = useWorkspace();
  const location = useLocation();
  const pathname = location.pathname;

  const linkClass = (to: string, exact?: boolean) => {
    const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
    return cn(
      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
    );
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/app" className="flex items-center gap-2" onClick={onClose}>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-semibold">SocialFlow</span>
          </Link>
          <button className="lg:hidden p-1" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} onClick={onClose} className={linkClass(item.to, item.exact)}>
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3 text-xs uppercase tracking-wider text-sidebar-foreground/50">Admin</div>
              {adminNav.map((item) => (
                <Link key={item.to} to={item.to} onClick={onClose} className={linkClass(item.to)}>
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              ))}
            </>
          )}
          {!isAdmin && (
            <Link to="/app/settings" onClick={onClose} className={linkClass("/app/settings")}>
              <Settings className="h-4 w-4" /> Settings
            </Link>
          )}
        </nav>
      </aside>
    </>
  );
}

export function AppShell({ children, title, actions }: { children: ReactNode; title?: string; actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMenu={() => setOpen(true)} title={title} actions={actions} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full">{children}</main>
      </div>
    </div>
  );
}

import { Topbar } from "./Topbar";
