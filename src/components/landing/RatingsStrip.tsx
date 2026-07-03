import { Star } from "lucide-react";

const badges = [
  { name: "G2", rating: "4.6", label: "High Performer 2026" },
  { name: "Capterra", rating: "4.8", label: "Best Value" },
  { name: "GetApp", rating: "4.7", label: "Category Leaders" },
  { name: "SaaSworthy", rating: "4.6", label: "Fastest Growing" },
];

export function RatingsStrip() {
  return (
    <section className="bg-secondary/50">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {badges.map((b) => (
          <div
            key={b.name}
            className="flex items-center gap-4 rounded-2xl bg-background p-5 shadow-[var(--shadow-card)]"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
              {b.name[0]}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">{b.name}</div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <div className="flex text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-medium text-foreground">{b.rating}</span>
              </div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{b.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
