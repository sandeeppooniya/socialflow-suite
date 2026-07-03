import { Star, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";

const logos = ["Northwind", "Acme Co.", "Globex", "Umbrella", "Initech", "Hooli"];

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundImage: "var(--gradient-hero)" }}
    >
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 shadow-sm backdrop-blur">
                <div className="flex text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="font-medium text-foreground">4.8 · G2</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 shadow-sm backdrop-blur">
                <div className="flex text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="font-medium text-foreground">Loved by 100K+ brands</span>
              </div>
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              The Complete{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Social Media Management
              </span>{" "}
              Tool
            </h1>

            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Schedule posts, unlock rich analytics, collaborate with your team and
              spin up AI-powered content — all from one calm, powerful dashboard.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-soft)] transition hover:bg-accent-hover"
              >
                Get Started For Free
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/60 px-6 py-3.5 text-sm font-semibold text-primary backdrop-blur transition hover:bg-primary-soft"
              >
                Book a Demo
              </a>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No credit card required · Free 14-day trial
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/25 to-accent/25 blur-2xl" />
            <img
              src={heroImage}
              alt="SocialFlow dashboard preview"
              width={1280}
              height={960}
              className="relative rounded-3xl shadow-[var(--shadow-soft)] ring-1 ring-border"
            />
          </div>
        </div>

        <div className="mt-20">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Trusted by 100,000+ brands worldwide
          </p>
          <div className="mt-6 grid grid-cols-2 gap-6 opacity-60 sm:grid-cols-3 lg:grid-cols-6">
            {logos.map((name) => (
              <div
                key={name}
                className="grid h-10 place-items-center rounded-lg text-sm font-semibold tracking-wide text-muted-foreground grayscale"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
