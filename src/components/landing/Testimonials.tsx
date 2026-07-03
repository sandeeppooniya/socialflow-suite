import { useState } from "react";
import { ArrowRight } from "lucide-react";

const tabs = ["Business", "Consultant", "Agency", "Counsellor"] as const;
type Tab = (typeof tabs)[number];

const data: Record<Tab, { quote: string; name: string; title: string; initials: string }[]> = {
  Business: [
    { quote: "SocialFlow cut our scheduling time from 8 hours a week to under 30 minutes. The analytics finally connect to revenue.", name: "Priya Rao", title: "Head of Marketing, Nomad Coffee", initials: "PR" },
    { quote: "We migrated from three tools to one and our team is genuinely happier. Approvals used to take days.", name: "Marcus Feld", title: "COO, Brightline Studio", initials: "MF" },
    { quote: "The reliability alone is worth the switch — posts just go out, period.", name: "Sana Ibrahim", title: "Brand Lead, Peakwear", initials: "SI" },
  ],
  Consultant: [
    { quote: "As a solo consultant I look ten people deep. Branded reports close deals for me before the second call.", name: "Devon Ash", title: "Independent Marketing Consultant", initials: "DA" },
    { quote: "I run 12 client calendars from one screen. It'd be impossible without SocialFlow's workspaces.", name: "Elena Voss", title: "Fractional CMO", initials: "EV" },
    { quote: "The DM automations pay for the whole subscription in the first week of every launch.", name: "Ren Takahashi", title: "Growth Consultant", initials: "RT" },
  ],
  Agency: [
    { quote: "Onboarding a new client used to be a project. Now it's a template — permissions, brand kit, calendar, done.", name: "Aisha Bello", title: "Founder, Northlight Agency", initials: "AB" },
    { quote: "The white-label reports look like we built them ourselves. Our retention jumped noticeably.", name: "Jonas Weber", title: "Partner, Studio Kinetik", initials: "JW" },
    { quote: "Client approval loops finally have a home that isn't email.", name: "Camila Reyes", title: "Ops Director, Sable & Co.", initials: "CR" },
  ],
  Counsellor: [
    { quote: "I share mental-health content across five platforms and SocialFlow keeps the tone consistent everywhere.", name: "Dr. Helena Cho", title: "Licensed Counsellor", initials: "HC" },
    { quote: "The DM automations gently route people to the right resource without me being online 24/7.", name: "Tomás Hernández", title: "Family Therapist", initials: "TH" },
    { quote: "Scheduling ahead means I can be present with clients — not scrambling for a Tuesday post.", name: "Naomi Grant", title: "Wellness Counsellor", initials: "NG" },
  ],
};

export function Testimonials() {
  const [active, setActive] = useState<Tab>("Business");
  const cards = data[active];

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Loved worldwide
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Teams of every shape run on SocialFlow
        </h2>
        <p className="mt-3 text-muted-foreground">
          Hear from the businesses, consultants, agencies and counsellors who ship
          more content with less chaos.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              active === t
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                : "bg-secondary text-foreground/70 hover:bg-primary-soft hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <article
            key={c.name}
            className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
          >
            <p className="text-foreground/90">"{c.quote}"</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-semibold text-primary-foreground">
                {c.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">{c.name}</div>
                <div className="truncate text-xs text-muted-foreground">{c.title}</div>
              </div>
              <a href="#" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:gap-1.5">
                Case study <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function QuoteStrip() {
  const items = [
    { quote: "The calmest tool in our stack.", name: "Riya Patel", role: "Social Lead, Kindred" },
    { quote: "Our approval process finally makes sense.", name: "Chris Nolan", role: "Creative Director" },
    { quote: "Reports our clients actually open.", name: "Ana Silva", role: "Founder, Silva Social" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((q) => (
          <div key={q.name} className="rounded-2xl border border-border bg-primary-soft/40 p-6">
            <p className="text-lg font-medium text-foreground">"{q.quote}"</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {q.name} · {q.role}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
