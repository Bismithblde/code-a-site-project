import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { ParallaxLayer } from "@/components/animation/ParallaxLayer";
import { CountUp } from "@/components/animation/CountUp";
import { WaveDivider } from "@/components/animation/WaveDivider";
import { FloatingBubbles } from "@/components/animation/FloatingBubbles";
import Link from "next/link";
import { AffiliateButton } from "@/components/AffiliateButton";
import { JsonLd } from "@/components/JsonLd";
import type { Brand } from "@/lib/types";
import type { Metadata } from "next";

interface BrandDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BrandDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: brand } = await supabase
    .from("brands")
    .select("name, origin, tasting_notes")
    .eq("slug", slug)
    .single();

  if (!brand) {
    return { title: "Brand Not Found" };
  }

  const description = `${brand.name} from ${brand.origin}. ${brand.tasting_notes}`;

  return {
    title: `${brand.name} Mineral Water`,
    description,
    openGraph: {
      title: `${brand.name} Mineral Water — MineralWater`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${brand.name} Mineral Water — MineralWater`,
      description,
    },
  };
}

const mineralFields = [
  { key: "calcium", label: "Calcium", symbol: "Ca", unit: "mg/L" },
  { key: "magnesium", label: "Magnesium", symbol: "Mg", unit: "mg/L" },
  { key: "sodium", label: "Sodium", symbol: "Na", unit: "mg/L" },
  { key: "potassium", label: "Potassium", symbol: "K", unit: "mg/L" },
  { key: "bicarbonate", label: "Bicarbonate", symbol: "HCO3", unit: "mg/L" },
  { key: "sulfate", label: "Sulfate", symbol: "SO4", unit: "mg/L" },
  { key: "chloride", label: "Chloride", symbol: "Cl", unit: "mg/L" },
  { key: "silica", label: "Silica", symbol: "SiO2", unit: "mg/L" },
  { key: "fluoride", label: "Fluoride", symbol: "F", unit: "mg/L" },
] as const;

function getMineralLevel(value: number, key: string): string {
  const thresholds: Record<string, { low: number; high: number }> = {
    calcium: { low: 20, high: 150 },
    magnesium: { low: 10, high: 50 },
    sodium: { low: 10, high: 200 },
    potassium: { low: 1, high: 10 },
    bicarbonate: { low: 50, high: 600 },
    sulfate: { low: 10, high: 200 },
    chloride: { low: 5, high: 100 },
    silica: { low: 5, high: 50 },
    fluoride: { low: 0.1, high: 1 },
  };
  const t = thresholds[key];
  if (!t) return "mid";
  if (value <= t.low) return "low";
  if (value >= t.high) return "high";
  return "mid";
}

function getLevelColor(level: string): string {
  switch (level) {
    case "low":
      return "bg-mineral-low text-foreground";
    case "high":
      return "bg-mineral-high text-white";
    default:
      return "bg-mineral-mid text-white";
  }
}

export default async function BrandDetailPage({
  params,
}: BrandDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: brand, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !brand) {
    notFound();
  }

  const b = brand as Brand;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mineralwater.com";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${b.name} Mineral Water`,
          description: b.tasting_notes,
          brand: {
            "@type": "Brand",
            name: b.name,
          },
          url: `${siteUrl}/brands/${b.slug}`,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: b.rating.toFixed(1),
            bestRating: "5",
            worstRating: "1",
            ratingCount: "1",
          },
          offers: {
            "@type": "Offer",
            url: `${siteUrl}/go/${b.slug}`,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "TDS",
              value: `${b.tds} mg/L`,
            },
            {
              "@type": "PropertyValue",
              name: "pH",
              value: b.ph.toString(),
            },
            {
              "@type": "PropertyValue",
              name: "Origin",
              value: b.origin,
            },
          ],
        }}
      />

      {/* Parallax Hero Header */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden -mt-16">
        <ParallaxLayer speed={0.3} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep via-ocean-mid to-ocean-surface" />
        </ParallaxLayer>
        <FloatingBubbles count={12} />
        <div className="relative z-10 text-center px-4 pt-16">
          <ScrollReveal>
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm text-white mb-4">
              {b.type} &middot; {b.origin}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {b.name}
            </h1>
            <div className="flex items-center justify-center gap-4 text-white/80">
              <span className="text-lg">{b.rating.toFixed(1)} ★</span>
              <span>&middot;</span>
              <span className="text-lg">{b.price_range}</span>
              <span>&middot;</span>
              <span className="text-lg">TDS {b.tds} mg/L</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider variant="gentle" />

      {/* Key Stats with CountUp */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Calcium
              </p>
              <p className="text-3xl font-bold text-ocean-surface">
                <CountUp end={b.calcium} decimals={1} suffix=" mg/L" />
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Magnesium
              </p>
              <p className="text-3xl font-bold text-ocean-surface">
                <CountUp end={b.magnesium} decimals={1} suffix=" mg/L" />
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                TDS
              </p>
              <p className="text-3xl font-bold text-ocean-surface">
                <CountUp end={b.tds} suffix=" mg/L" />
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                pH Level
              </p>
              <p className="text-3xl font-bold text-ocean-surface">
                <CountUp end={b.ph} decimals={1} />
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Tasting Notes */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        <ScrollReveal>
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-4">Tasting Notes</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {b.tasting_notes}
            </p>
          </div>
        </ScrollReveal>
      </section>

      <WaveDivider variant="choppy" />

      {/* Full Mineral Composition Table */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-8">Mineral Composition</h2>
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 text-sm font-semibold">
                    Mineral
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold">
                    Symbol
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold">
                    Amount
                  </th>
                  <th className="text-center py-4 px-6 text-sm font-semibold">
                    Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {mineralFields.map((field) => {
                  const value = b[field.key as keyof Brand] as number;
                  const level = getMineralLevel(value, field.key);
                  return (
                    <tr
                      key={field.key}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 px-6">
                        <Link
                          href={`/minerals/${field.key}`}
                          className="font-medium hover:text-ocean-surface transition-colors"
                        >
                          {field.label}
                        </Link>
                      </td>
                      <td className="py-3 px-6 text-muted-foreground">
                        {field.symbol}
                      </td>
                      <td className="py-3 px-6 text-right font-mono">
                        {value} {field.unit}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getLevelColor(level)}`}
                        >
                          {level}
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

      <WaveDivider variant="deep" />

      {/* Affiliate CTA */}
      <section className="max-w-3xl mx-auto px-4 py-12 text-center">
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-4">
            Ready to try {b.name}?
          </h2>
          <p className="text-muted-foreground mb-6">
            Available on Amazon with free shipping for Prime members.
          </p>
          <AffiliateButton brandSlug={b.slug} priceRange={b.price_range} />
          <p className="text-xs text-muted-foreground mt-3">
            As an Amazon Associate we earn from qualifying purchases.
          </p>
        </ScrollReveal>
      </section>

      {/* Navigation */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <div className="flex justify-between">
          <Link
            href="/brands"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← All Brands
          </Link>
          <Link
            href={`/compare?brands=${b.slug}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Compare this brand →
          </Link>
        </div>
      </section>
    </>
  );
}
