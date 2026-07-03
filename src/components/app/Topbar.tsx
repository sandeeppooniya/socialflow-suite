import { Menu } from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import type { ReactNode } from "react";

export function Topbar({ onMenu, title, actions }: { onMenu: () => void; title?: string; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4 sm:px-6 lg:px-8">
      <button className="lg:hidden p-2 -ml-2" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <WorkspaceSwitcher />
      {title && <h1 className="hidden md:block text-sm font-semibold text-foreground/80 truncate">{title}</h1>}
      <div className="ml-auto flex items-center gap-1">
        {actions}
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
