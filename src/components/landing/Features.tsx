import { Users, ShieldCheck, Rocket, MessagesSquare, BarChart3, Instagram } from "lucide-react";
import { FeatureBlock } from "./FeatureBlock";

export function Features() {
  return (
    <section className="mx-auto max-w-7xl space-y-24 px-4 py-24 sm:px-6 lg:px-8">
      <FeatureBlock
        eyebrow="For Agencies"
        title="Manage Multiple Clients from One Workspace"
        description="Give every client their own dedicated space, permissions, and calendar — no more juggling logins or losing context between accounts."
        linkLabel="Explore workspaces"
        icon={Users}
        bullets={[
          "Unlimited workspaces on Agency plans",
          "Role-based access for teams and clients",
          "Consolidated billing and reporting",
        ]}
      />
      <FeatureBlock
        reverse
        eyebrow="Reliability"
        title="Industry's Highest Post Success Rate"
        description="Our smart retry engine automatically fixes broken posts, refreshed tokens and rate limits — so your content ships on time, every time."
        linkLabel="See our uptime report"
        icon={ShieldCheck}
        bullets={[
          "99.98% delivery success across networks",
          "Auto-heals expired connections",
          "Real-time alerts if something needs you",
        ]}
      />
      <FeatureBlock
        eyebrow="Growth"
        title="Boost Top Posts Into Ads in One Click"
        description="Spot your best-performing content and promote it as a paid campaign without ever leaving SocialFlow. No spreadsheets, no ad manager gymnastics."
        linkLabel="Learn about Boost"
        icon={Rocket}
        bullets={[
          "Automatic top-post detection",
          "Budget presets tuned to your goals",
          "Meta and LinkedIn campaigns supported",
        ]}
      />
    </section>
  );
}

export function MoreFeatures() {
  return (
    <section className="mx-auto max-w-7xl space-y-24 px-4 py-24 sm:px-6 lg:px-8">
      <FeatureBlock
        reverse
        eyebrow="Collaboration"
        title="Collaborate with Your Team and Clients"
        description="A shared visual calendar, approval flows and threaded feedback keep everyone aligned — from copywriters to CMOs."
        linkLabel="Tour the workflow"
        icon={MessagesSquare}
        bullets={["Multi-step approvals", "Inline comments on drafts", "Client-friendly review links"]}
      />
      <FeatureBlock
        eyebrow="Analytics"
        title="Meaningful Analytics, Not Vanity Metrics"
        description="White-labeled reports and AI-powered insights tell you what to post next — not just what happened last week."
        linkLabel="See sample report"
        icon={BarChart3}
        bullets={["Cross-network dashboards", "AI 'what to post next' suggestions", "Export as PDF or branded link"]}
      />
      <FeatureBlock
        reverse
        eyebrow="Automation"
        title="Instagram DM Automation That Converts"
        description="Turn comments and story replies into qualified leads with keyword-triggered DMs that feel human, not robotic."
        linkLabel="Try DM automations"
        icon={Instagram}
        bullets={["Keyword and story-reply triggers", "Lead capture into your CRM", "Human-in-the-loop handoff"]}
      />
    </section>
  );
}
