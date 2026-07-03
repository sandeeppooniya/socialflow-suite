import { useEffect, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

const navGroups = ["Features", "Product", "Resources"] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all ${
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-lg"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-soft)]">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            SocialFlow
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {navGroups.map((label) => (
            <li key={label}>
              <button className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-primary-soft hover:text-primary">
                {label}
                <ChevronDown className="h-4 w-4" />
              </button>
            </li>
          ))}
          <li>
            <a
              href="#pricing"
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-primary-soft hover:text-primary"
            >
              Pricing
            </a>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition hover:text-primary sm:inline-block"
          >
            Log In
          </a>
          <a
            href="#"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:bg-primary-glow"
          >
            Sign Up Free
          </a>
        </div>
      </nav>
    </header>
  );
}
