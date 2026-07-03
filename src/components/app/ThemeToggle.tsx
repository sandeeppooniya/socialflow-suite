import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, setTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [t, setT] = useState<Theme>("system");
  useEffect(() => { setT(getStoredTheme()); }, []);
  const cycle = () => {
    const next: Theme = t === "light" ? "dark" : t === "dark" ? "system" : "light";
    setT(next);
    setTheme(next);
    applyTheme(next);
  };
  const Icon = t === "dark" ? Moon : t === "light" ? Sun : Monitor;
  return (
    <button onClick={cycle} className="p-2 rounded-lg hover:bg-muted transition" aria-label={`Theme: ${t}`} title={`Theme: ${t}`}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
