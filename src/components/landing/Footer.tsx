import { Facebook, Instagram, Linkedin, Youtube, Twitter, Sparkles, Apple, Play, Chrome } from "lucide-react";

const cols = [
  {
    title: "Company",
    items: ["About", "How it Works", "Contact", "Knowledge Base", "Affiliate Program"],
  },
  {
    title: "Features",
    items: ["Scheduling", "Analytics", "Unified Inbox", "AI Assistant", "Approvals", "DM Automation"],
  },
  {
    title: "Comparisons",
    items: ["vs Buffer", "vs Hootsuite", "vs Later", "vs Sprout Social", "vs RecurPost"],
  },
  {
    title: "Scheduling",
    items: [
      "Facebook Scheduler",
      "Instagram Scheduler",
      "LinkedIn Scheduler",
      "X (Twitter) Scheduler",
      "TikTok Scheduler",
      "Pinterest Scheduler",
    ],
  },
];

const socials = [
  { icon: Facebook, label: "Facebook" },
  { icon: Twitter, label: "X" },
  { icon: Youtube, label: "YouTube" },
  { icon: Instagram, label: "Instagram" },
  { icon: Linkedin, label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/10 text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold">SocialFlow</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-primary-foreground/70">
              The calm social media command center for teams that want to ship
              consistent, on-brand content across every channel.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#" className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-2 text-xs font-medium">
                <Apple className="h-4 w-4" /> App Store
              </a>
              <a href="#" className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-2 text-xs font-medium">
                <Play className="h-4 w-4" /> Google Play
              </a>
              <a href="#" className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-2 text-xs font-medium">
                <Chrome className="h-4 w-4" /> Chrome Extension
              </a>
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/60">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {c.items.map((i) => (
                  <li key={i}>
                    <a
                      href="#"
                      className="text-sm text-primary-foreground/80 transition hover:text-primary-foreground"
                    >
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-8 sm:flex-row">
          <p className="text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} SocialFlow, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socials.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/10 transition hover:bg-primary-foreground/20"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-primary-foreground/60">
            <a href="#" className="hover:text-primary-foreground">Terms</a>
            <a href="#" className="hover:text-primary-foreground">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
