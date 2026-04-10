import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { StaggerGrid } from "@/components/animation/StaggerGrid";
import { CountUp } from "@/components/animation/CountUp";
import { WaveDivider } from "@/components/animation/WaveDivider";
import { ParallaxLayer } from "@/components/animation/ParallaxLayer";
import { FloatingBubbles } from "@/components/animation/FloatingBubbles";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";
import type { Mineral, Brand } from "@/lib/types";
import type { Metadata } from "next";

interface MineralDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MineralDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: mineral } = await supabase
    .from("minerals")
    .select("name, benefits")
    .eq("slug", slug)
    .single();

  if (!mineral) {
    return { title: "Mineral Not Found" };
  }

  const description = `Learn about ${mineral.name} in mineral water. Benefits: ${(mineral.benefits as string[]).join(", ")}.`;

  return {
    title: `${mineral.name} in Mineral Water`,
    description,
    openGraph: {
      title: `${mineral.name} in Mineral Water — MineralWater`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${mineral.name} in Mineral Water — MineralWater`,
      description,
    },
  };
}

export default async function MineralDetailPage({
  params,
}: MineralDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: mineral, error } = await supabase
    .from("minerals")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !mineral) {
    notFound();
  }

  const m = mineral as Mineral;

  // Fetch brands sorted by this mineral's content (highest first)
  // The mineral slug corresponds to the column name on the brands table
  const mineralColumn = m.slug === "tds" ? "tds" : m.slug;
  const { data: brandsData } = await supabase
    .from("brands")
    .select("*")
    .order(mineralColumn, { ascending: false });

  const brands = (brandsData ?? []) as Brand[];
  const topBrands = brands.slice(0, 6);

  // Find highest and average values
  const values = brands.map(
    (b) => (b[mineralColumn as keyof Brand] as number) ?? 0
  );
  const highest = values.length > 0 ? Math.max(...values) : 0;
  const average =
    values.length > 0 ? values.reduce((a, c) => a + c, 0) / values.length : 0;

  return (
    <>
      {/* Parallax Hero */}
      <section className="relative min-h-[45vh] flex items-center justify-center overflow-hidden -mt-16">
        <ParallaxLayer speed={0.3} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep via-ocean-mid to-ocean-surface" />
        </ParallaxLayer>
        <FloatingBubbles count={10} />
        <div className="relative z-10 text-center px-4 pt-16">
          <ScrollReveal>
            <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 text-2xl font-bold text-white mb-6">
              {m.symbol}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {m.name}
            </h1>
            <p className="text-lg text-white/80">
              {m.unit} &middot;{" "}
              {m.daily_value > 0
                ? `Daily value: ${m.daily_value} ${m.unit}`
                : "No established daily value"}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider variant="gentle" />

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Highest in DB
              </p>
              <p className="text-2xl font-bold text-ocean-surface">
                <CountUp end={highest} decimals={1} suffix={` ${m.unit}`} />
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Average
              </p>
              <p className="text-2xl font-bold text-ocean-surface">
                <CountUp end={average} decimals={1} suffix={` ${m.unit}`} />
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Low Threshold
              </p>
              <p className="text-2xl font-bold text-mineral-low">
                <CountUp
                  end={m.low_threshold}
                  decimals={1}
                  suffix={` ${m.unit}`}
                />
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                High Threshold
              </p>
              <p className="text-2xl font-bold text-mineral-high">
                <CountUp
                  end={m.high_threshold}
                  decimals={1}
                  suffix={` ${m.unit}`}
                />
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Benefits */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        <ScrollReveal>
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6">Health Benefits</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {m.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-ocean-surface/20 flex items-center justify-center text-ocean-surface text-sm shrink-0">
                    +
                  </span>
                  <p className="text-muted-foreground pt-1">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      <WaveDivider variant="choppy" />

      {/* Top brands for this mineral */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-2">
            Highest {m.name} Content
          </h2>
          <p className="text-muted-foreground mb-8">
            Brands ranked by {m.name.toLowerCase()} concentration.
          </p>
        </ScrollReveal>

        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topBrands.map((brand) => (
            <ProductCard key={brand.slug} brand={brand} />
          ))}
        </StaggerGrid>

        {brands.length > 6 && (
          <div className="text-center mt-8">
            <Link
              href="/brands"
              className="inline-block px-6 py-3 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
            >
              View All {brands.length} Brands
            </Link>
          </div>
        )}
      </section>

      {/* All brands table */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6">
            All Brands by {m.name}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">
                    Brand
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">
                    {m.name} ({m.unit})
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold hidden sm:table-cell">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand, index) => {
                  const value = (brand[mineralColumn as keyof Brand] as number) ?? 0;
                  return (
                    <tr
                      key={brand.slug}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/brands/${brand.slug}`}
                          className="font-medium hover:text-ocean-surface transition-colors"
                        >
                          {brand.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {value}
                      </td>
                      <td className="py-3 px-4 text-center hidden sm:table-cell">
                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {brand.type}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </section>

      {/* Navigation */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <div className="flex justify-between">
          <Link
            href="/minerals"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← All Minerals
          </Link>
          <Link
            href={`/best/${m.slug}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Best for {m.name} →
          </Link>
        </div>
      </section>
    </>
  );
}
