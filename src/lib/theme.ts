// Dark mode: adds/removes `dark` class on <html>. Persists in localStorage.
export type Theme = "light" | "dark" | "system";

const KEY = "sf-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(KEY) as Theme) || "system";
}

export function resolveTheme(t: Theme): "light" | "dark" {
  if (t !== "system") return t;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(t);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function setTheme(t: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, t);
  applyTheme(t);
}

// Inline script to run before hydration (avoids flash).
export const themeInitScript = `
try {
  var t = localStorage.getItem('${KEY}') || 'system';
  var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) document.documentElement.classList.add('dark');
} catch (e) {}
`;
