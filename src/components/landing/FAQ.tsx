import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "How much time will SocialFlow actually save me?",
    a: "Most teams reclaim between 6 and 12 hours per week. Bulk scheduling, saved templates and AI-generated captions collapse the repetitive parts of the workflow, while automated approvals cut the back-and-forth with clients and stakeholders.",
  },
  {
    q: "Which platforms can I publish to?",
    a: "SocialFlow supports Instagram, Facebook, LinkedIn, X (Twitter), TikTok, YouTube Shorts, Pinterest, Threads and Google Business Profile — with native features like carousels, reels, first comments and location tags.",
  },
  {
    q: "How do client feedback and approvals work?",
    a: "Invite clients to their own workspace with view-only or approver access. They can comment inline on drafts, request tweaks, and approve posts from a shareable link — no login required if you prefer.",
  },
  {
    q: "What happens if a post fails to publish?",
    a: "Our retry engine auto-heals most failures — expired tokens are refreshed, rate limits are respected and requeued, and network hiccups are retried transparently. If something needs you, you'll get an immediate alert.",
  },
  {
    q: "Do you offer a unified inbox for comments and DMs?",
    a: "Yes. Every reply, mention and DM across your connected accounts flows into a single inbox with assignments, internal notes, keyword rules and automation triggers.",
  },
  {
    q: "Can I white-label the analytics reports?",
    a: "On Agency plans you can add your logo, colors, custom domain and cover pages. Send reports as branded PDFs or interactive links your clients can revisit anytime.",
  },
  {
    q: "Does scheduling posts reduce reach?",
    a: "No. Platforms have publicly confirmed that natively-published scheduled posts are treated the same as manually-posted ones. What actually matters is posting consistently — which is exactly what SocialFlow makes easier.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          FAQ
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="mt-10 space-y-3">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-base font-semibold text-foreground">{item.q}</span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
              {isOpen && (
                <div className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
