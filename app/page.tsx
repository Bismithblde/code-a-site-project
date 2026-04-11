import { createClient } from "@/lib/supabase/server";
import { OceanHeroSection } from "@/components/hero/OceanHeroSection";
import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { StaggerGrid } from "@/components/animation/StaggerGrid";
import { WaveDivider } from "@/components/animation/WaveDivider";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";
import { Droplets, Heart, Shield, Zap, Brain, Bone } from "lucide-react";
import type { Brand } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();

  // Check auth status
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Fetch top-rated brands for "Top Picks"
  const { data: topBrands } = await supabase
    .from("brands")
    .select("*")
    .order("rating", { ascending: false })
    .limit(3);

  // Fetch minerals for quick links
  const { data: minerals } = await supabase
    .from("minerals")
    .select("slug, name, symbol, benefits")
    .order("name")
    .limit(6);

  return (
    <>
      {/* Ocean Hero — full viewport scroll experience */}
      <OceanHeroSection />

      <WaveDivider variant="gentle" />

      {/* ── Section 1: The problem you didn't know you had ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <ScrollReveal>
          <p className="text-sm font-medium text-ocean-surface text-center uppercase tracking-widest mb-4">
            What you don&apos;t see
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-5 leading-tight">
            You drink 2 liters a day.
            <br />
            <span className="text-muted-foreground">Do you know what&apos;s in it?</span>
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-16 text-base leading-relaxed">
            Two bottles of water can look identical on the shelf — but one might have
            82x more magnesium than the other. That invisible difference affects your sleep,
            your bones, your energy, and your heart. Every single day.
          </p>
        </ScrollReveal>

        {/* Shocking comparison */}
        <ScrollReveal delay={0.1}>
          <div className="glass-card p-8 mb-8">
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-ocean-surface">0</p>
                <p className="text-xs text-muted-foreground mt-1">mg/L magnesium</p>
                <p className="text-sm font-medium mt-2">Smartwater</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">vs</p>
                <div className="w-full h-px bg-border my-2" />
                <p className="text-xs text-muted-foreground">same price range</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-ocean-surface">108</p>
                <p className="text-xs text-muted-foreground mt-1">mg/L magnesium</p>
                <p className="text-sm font-medium mt-2">Gerolsteiner</p>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              That&apos;s 26% of your daily magnesium — from something you&apos;re already drinking.
            </p>
          </div>
        </ScrollReveal>

        <div className="text-center">
          <Link href="/compare" className="text-sm text-primary font-medium hover:underline">
            Compare any two brands →
          </Link>
        </div>
      </section>

      <WaveDivider variant="choppy" />

      {/* ── Section 2: What each mineral does — at a glance ── */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <ScrollReveal>
          <p className="text-sm font-medium text-ocean-surface text-center uppercase tracking-widest mb-4">
            Your water, working for you
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-5">
            Every Sip Can Do More
          </h2>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-14">
            The right minerals in your water quietly support your body all day long —
            if you know which ones to look for.
          </p>
        </ScrollReveal>

        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Each card: problem → mineral → benefit → brand range */}
          <Link href="/minerals/calcium" className="group">
            <div className="glass-card p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Bone className="size-7 text-ocean-surface mb-4" />
              <p className="text-lg sm:text-xl font-semibold text-foreground mb-2">Weak bones? Stiff joints?</p>
              <h3 className="text-xl font-bold mb-2 group-hover:text-ocean-surface transition-colors">Calcium</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Strengthens bones and teeth, supports nerve signaling and muscle contraction.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Range across brands</span>
                <span className="text-sm font-bold text-ocean-surface">0 – 348 mg/L</span>
              </div>
            </div>
          </Link>

          <Link href="/minerals/magnesium" className="group">
            <div className="glass-card p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Brain className="size-7 text-ocean-surface mb-4" />
              <p className="text-lg sm:text-xl font-semibold text-foreground mb-2">Poor sleep? Low energy?</p>
              <h3 className="text-xl font-bold mb-2 group-hover:text-ocean-surface transition-colors">Magnesium</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Regulates 300+ enzyme reactions. Improves sleep quality, reduces muscle cramps, boosts energy production.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Range across brands</span>
                <span className="text-sm font-bold text-ocean-surface">0 – 108 mg/L</span>
              </div>
            </div>
          </Link>

          <Link href="/minerals/sodium" className="group">
            <div className="glass-card p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Heart className="size-7 text-ocean-surface mb-4" />
              <p className="text-lg sm:text-xl font-semibold text-foreground mb-2">Watching blood pressure?</p>
              <h3 className="text-xl font-bold mb-2 group-hover:text-ocean-surface transition-colors">Sodium</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Essential for fluid balance and nerve function — but too much raises blood pressure. Some waters have 20x more than others.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Range across brands</span>
                <span className="text-sm font-bold text-ocean-surface">0 – 118 mg/L</span>
              </div>
            </div>
          </Link>

          <Link href="/minerals/bicarbonate" className="group">
            <div className="glass-card p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Zap className="size-7 text-ocean-surface mb-4" />
              <p className="text-lg sm:text-xl font-semibold text-foreground mb-2">Post-workout fatigue?</p>
              <h3 className="text-xl font-bold mb-2 group-hover:text-ocean-surface transition-colors">Bicarbonate</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Neutralizes lactic acid, aids digestion, and buffers your body&apos;s pH. Athletes drink bicarbonate-rich water for faster recovery.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Range across brands</span>
                <span className="text-sm font-bold text-ocean-surface">0 – 1,816 mg/L</span>
              </div>
            </div>
          </Link>

          <Link href="/minerals/silica" className="group">
            <div className="glass-card p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Droplets className="size-7 text-ocean-surface mb-4" />
              <p className="text-lg sm:text-xl font-semibold text-foreground mb-2">Dull skin? Brittle nails?</p>
              <h3 className="text-xl font-bold mb-2 group-hover:text-ocean-surface transition-colors">Silica</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Promotes skin elasticity, hair thickness, and nail strength. Fiji water is famous for its high silica — 93 mg/L.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Range across brands</span>
                <span className="text-sm font-bold text-ocean-surface">0 – 93 mg/L</span>
              </div>
            </div>
          </Link>

          <Link href="/minerals/potassium" className="group">
            <div className="glass-card p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Shield className="size-7 text-ocean-surface mb-4" />
              <p className="text-lg sm:text-xl font-semibold text-foreground mb-2">Muscle cramps? Irregular heartbeat?</p>
              <h3 className="text-xl font-bold mb-2 group-hover:text-ocean-surface transition-colors">Potassium</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Balances sodium, regulates heart rhythm, and prevents muscle cramps. Most people don&apos;t get enough daily potassium.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Range across brands</span>
                <span className="text-sm font-bold text-ocean-surface">0.3 – 11 mg/L</span>
              </div>
            </div>
          </Link>
        </StaggerGrid>

        <ScrollReveal delay={0.3}>
          <div className="text-center mt-12">
            <Link
              href="/minerals"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              See the full mineral guide →
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <WaveDivider variant="gentle" />

      {/* ── Section 2b: The tap water nudge ── */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <ScrollReveal>
          <div className="glass-card p-8 md:p-10 text-center">
            <Shield className="size-10 text-ocean-surface mx-auto mb-4" />
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Meanwhile, do you trust your tap?
            </h3>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
              Over 12,000 U.S. water systems have had violations in the last 3 years.
              Lead, copper, and treatment failures affect millions. Check yours in seconds.
            </p>
            <Link
              href="/tap-water"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all hover:scale-105"
            >
              Look Up Your Water System →
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <WaveDivider variant="gentle" />

      {/* ── Section 3: Essential Minerals ── */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Essential Minerals
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-14">
            Every mineral water has a unique profile. Learn what each mineral
            does for your body and which brands deliver the most.
          </p>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(minerals ?? []).map((mineral) => (
            <Link key={mineral.slug} href={`/minerals/${mineral.slug}`}>
              <div className="glass-card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="flex items-center gap-3 mb-3">
                  {mineral.symbol && (
                    <span className="w-10 h-10 rounded-full bg-ocean-surface/20 flex items-center justify-center text-sm font-bold text-ocean-surface">
                      {mineral.symbol}
                    </span>
                  )}
                  <h3 className="text-lg font-bold group-hover:text-ocean-surface transition-colors">
                    {mineral.name}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {mineral.benefits?.[0]
                    ? `${mineral.benefits[0]}${mineral.benefits[1] ? `, ${mineral.benefits[1].toLowerCase()}` : ""}`
                    : "Essential for your health"}
                </p>
              </div>
            </Link>
          ))}
        </StaggerGrid>
        <ScrollReveal delay={0.3}>
          <div className="text-center mt-10">
            <Link
              href="/minerals"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              Explore All Minerals →
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <WaveDivider variant="choppy" />

      {/* ── Section 4: Top Picks ── */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Top Picks
          </h2>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-14">
            Our highest-rated mineral water brands based on mineral content, taste, and value.
          </p>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(topBrands ?? []).map((brand) => (
            <ProductCard
              key={brand.slug}
              brand={brand as Brand}
              showAffiliate
            />
          ))}
        </StaggerGrid>
        <ScrollReveal delay={0.3}>
          <div className="text-center mt-10">
            <Link
              href="/brands"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              View All 15 Brands →
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <WaveDivider variant="deep" />

      {/* ── Section 5: CTA — auth-aware ── */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Track Your Hydration
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Log your daily water intake, set personalized goals, and get smart
            reminders. Know exactly what minerals you&apos;re drinking.
          </p>
          {isLoggedIn ? (
            <Link
              href="/tracker"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Go to Tracker
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Create Free Account
            </Link>
          )}
        </ScrollReveal>
      </section>
    </>
  );
}
