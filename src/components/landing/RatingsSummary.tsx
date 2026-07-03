import { Star, ArrowRight } from "lucide-react";

const items = [
  { name: "Capterra", rating: "4.8" },
  { name: "G2", rating: "4.6" },
  { name: "GetApp", rating: "4.7" },
  { name: "SaaSworthy", rating: "4.6" },
];

export function RatingsSummary() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-br from-primary-soft via-background to-secondary/40 p-10 shadow-[var(--shadow-card)] lg:p-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((i) => (
            <div key={i.name} className="text-center">
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {i.name}
              </div>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className="text-3xl font-bold text-foreground">{i.rating}</span>
                <Star className="h-5 w-5 fill-accent text-accent" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-soft)] transition hover:bg-accent-hover"
          >
            Get Started For Free <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-xs text-muted-foreground">No credit card required</p>
        </div>
      </div>
    </section>
  );
}
