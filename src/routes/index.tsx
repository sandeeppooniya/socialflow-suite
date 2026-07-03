import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { Features, MoreFeatures } from "@/components/landing/Features";
import { RatingsStrip } from "@/components/landing/RatingsStrip";
import { Testimonials, QuoteStrip } from "@/components/landing/Testimonials";
import { RatingsSummary } from "@/components/landing/RatingsSummary";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <RatingsStrip />
        <MoreFeatures />
        <Testimonials />
        <QuoteStrip />
        <RatingsSummary />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
