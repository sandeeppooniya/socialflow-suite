import { ArrowRight, type LucideIcon } from "lucide-react";

export interface FeatureBlockProps {
  eyebrow: string;
  title: string;
  description: string;
  linkLabel: string;
  reverse?: boolean;
  icon: LucideIcon;
  bullets?: string[];
}

export function FeatureBlock({
  eyebrow,
  title,
  description,
  linkLabel,
  reverse,
  icon: Icon,
  bullets = [],
}: FeatureBlockProps) {
  return (
    <div
      className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
        reverse ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div>
        <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </span>
        <h3 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h3>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
        {bullets.length > 0 && (
          <ul className="mt-5 space-y-2 text-sm text-foreground/80">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {b}
              </li>
            ))}
          </ul>
        )}
        <a
          href="#"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:gap-2.5"
        >
          {linkLabel} <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="relative">
        <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-accent/15 blur-2xl" />
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary-soft to-background p-8 shadow-[var(--shadow-card)]">
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-soft)]">
                <Icon className="h-6 w-6" />
              </span>
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="h-2 w-2 rounded-full bg-primary/40" />
                <span className="h-2 w-2 rounded-full bg-primary/20" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-3 w-3/4 rounded-full bg-primary/20" />
              <div className="h-3 w-1/2 rounded-full bg-primary/15" />
              <div className="grid grid-cols-3 gap-2 pt-3">
                <div className="h-16 rounded-xl bg-background shadow-sm" />
                <div className="h-16 rounded-xl bg-background shadow-sm" />
                <div className="h-16 rounded-xl bg-accent/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
