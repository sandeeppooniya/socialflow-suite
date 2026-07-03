import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return { user, profile: data };
    },
  });

  const initials = (profile?.profile?.full_name || profile?.user?.email || "?").slice(0, 2).toUpperCase();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90">
        {initials}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium truncate">{profile?.profile?.full_name || "Account"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.user?.email}</p>
            </div>
            <button onClick={() => { setOpen(false); navigate({ to: "/app/settings" }); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
              <User className="h-4 w-4" /> Profile & settings
            </button>
            <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
