import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { StaggerGrid } from "@/components/animation/StaggerGrid";
import { WaveDivider } from "@/components/animation/WaveDivider";
import { ParallaxLayer } from "@/components/animation/ParallaxLayer";
import { FloatingBubbles } from "@/components/animation/FloatingBubbles";
import { CountUp } from "@/components/animation/CountUp";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — MineralWater",
  description:
    "MineralWater is the internet's most comprehensive mineral water resource. Compare brands, track hydration, and learn about the minerals in your water.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden -mt-16">
        <ParallaxLayer speed={0.3} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep via-ocean-mid to-ocean-surface" />
        </ParallaxLayer>
        <FloatingBubbles count={12} />
        <div className="relative z-10 text-center px-4 pt-16 max-w-3xl mx-auto">
          <ScrollReveal>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              About MineralWater
            </h1>
            <p className="text-lg text-white/80">
              The internet&apos;s most comprehensive mineral water resource
            </p>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider variant="gentle" />

      {/* Mission */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <ScrollReveal>
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We believe everyone deserves to know what&apos;s in their water.
              MineralWater was created to bring transparency to the mineral water
              industry by providing accurate, data-driven comparisons of brands
              worldwide.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Whether you&apos;re an athlete optimizing electrolyte intake, someone
              with specific dietary needs, or simply curious about what
              makes your favorite water taste the way it does — we built this
              resource for you.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 text-center">
            <p className="text-3xl font-bold text-ocean-surface">
              <CountUp end={10} suffix="+" />
            </p>
            <p className="text-sm text-muted-foreground mt-1">Brands Analyzed</p>
          </div>
          <div className="glass-card p-6 text-center">
            <p className="text-3xl font-bold text-ocean-surface">
              <CountUp end={9} />
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Minerals Tracked
            </p>
          </div>
          <div className="glass-card p-6 text-center">
            <p className="text-3xl font-bold text-ocean-surface">
              <CountUp end={100} suffix="%" />
            </p>
            <p className="text-sm text-muted-foreground mt-1">Free to Use</p>
          </div>
          <div className="glass-card p-6 text-center">
            <p className="text-3xl font-bold text-ocean-surface">
              <CountUp end={0} />
            </p>
            <p className="text-sm text-muted-foreground mt-1">Ads or Paywalls</p>
          </div>
        </StaggerGrid>
      </section>

      <WaveDivider variant="choppy" />

      {/* What we offer */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-8 text-center">What We Offer</h2>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-2">Brand Database</h3>
            <p className="text-sm text-muted-foreground">
              Detailed mineral profiles for popular mineral water brands
              worldwide. Every number comes from official brand data or
              independent lab analysis.
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-2">Comparison Tools</h3>
            <p className="text-sm text-muted-foreground">
              Side-by-side comparisons of up to four brands at once. Visual
              charts and detailed tables make differences easy to spot.
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-2">Hydration Tracker</h3>
            <p className="text-sm text-muted-foreground">
              Log your daily water intake, set personalized goals based on your
              weight and activity level, and track your hydration trends over
              time.
            </p>
          </div>
        </StaggerGrid>
      </section>

      {/* Data sources */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <ScrollReveal>
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-4">Our Data</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All mineral content data comes from official brand websites, bottle
              labels, and published water quality reports. We cross-reference
              multiple sources to ensure accuracy.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Mineral water composition can vary slightly between batches and
              sources. The values we report represent typical compositions as
              stated by the brands themselves.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <WaveDivider variant="deep" />

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-12 text-center">
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-muted-foreground mb-6">
            Start comparing brands or create a free account to track your
            hydration.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/brands"
              className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
            >
              Explore Brands
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
            >
              Create Account
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
