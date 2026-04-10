import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { CountUp } from "@/components/animation/CountUp";
import { WaveDivider } from "@/components/animation/WaveDivider";
import { ParallaxLayer } from "@/components/animation/ParallaxLayer";
import { FloatingBubbles } from "@/components/animation/FloatingBubbles";
import Link from "next/link";
import type { Brand } from "@/lib/types";
import type { Metadata } from "next";

interface CompareDetailPageProps {
  params: Promise<{ slug: string }>;
}

function parseSlugs(slug: string): [string, string] | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return null;
  return [parts[0], parts[1]];
}

export async function generateMetadata({
  params,
}: CompareDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlugs(slug);
  if (!parsed) return { title: "Comparison Not Found" };

  const supabase = await createClient();
  const [{ data: a }, { data: b }] = await Promise.all([
    supabase.from("brands").select("name").eq("slug", parsed[0]).single(),
    supabase.from("brands").select("name").eq("slug", parsed[1]).single(),
  ]);

  if (!a || !b) return { title: "Comparison Not Found" };

  return {
    title: `${a.name} vs ${b.name} — MineralWater`,
    description: `Side-by-side comparison of ${a.name} and ${b.name} mineral water. Compare mineral content, pH, TDS, and more.`,
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
  { key: "tds", label: "TDS", symbol: "TDS", unit: "mg/L" },
  { key: "ph", label: "pH", symbol: "pH", unit: "" },
] as const;

export default async function CompareDetailPage({
  params,
}: CompareDetailPageProps) {
  const { slug } = await params;
  const parsed = parseSlugs(slug);
  if (!parsed) notFound();

  const supabase = await createClient();
  const [{ data: brandA, error: errA }, { data: brandB, error: errB }] =
    await Promise.all([
      supabase.from("brands").select("*").eq("slug", parsed[0]).single(),
      supabase.from("brands").select("*").eq("slug", parsed[1]).single(),
    ]);

  if (errA || errB || !brandA || !brandB) notFound();

  const a = brandA as Brand;
  const b = brandB as Brand;

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden -mt-16">
        <ParallaxLayer speed={0.3} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep via-ocean-mid to-ocean-surface" />
        </ParallaxLayer>
        <FloatingBubbles count={10} />
        <div className="relative z-10 text-center px-4 pt-16">
          <ScrollReveal>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              {a.name} vs {b.name}
            </h1>
            <p className="text-lg text-white/80">
              Side-by-side mineral water comparison
            </p>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider variant="gentle" />

      {/* Overview cards */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[a, b].map((brand) => (
              <div key={brand.slug} className="glass-card p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    {brand.type}
                  </span>
                  <span className="text-sm font-semibold text-ocean-surface">
                    {brand.rating.toFixed(1)} ★
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-1">{brand.name}</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  {brand.origin} &middot; {brand.price_range}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {brand.tasting_notes}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Comparison table */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6">Mineral Comparison</h2>
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-semibold">
                    Mineral
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold">
                    <Link
                      href={`/brands/${a.slug}`}
                      className="hover:text-ocean-surface transition-colors"
                    >
                      {a.name}
                    </Link>
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold">
                    <Link
                      href={`/brands/${b.slug}`}
                      className="hover:text-ocean-surface transition-colors"
                    >
                      {b.name}
                    </Link>
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold">
                    Winner
                  </th>
                </tr>
              </thead>
              <tbody>
                {mineralFields.map((field) => {
                  const valA =
                    (a[field.key as keyof Brand] as number) ?? 0;
                  const valB =
                    (b[field.key as keyof Brand] as number) ?? 0;
                  // For pH, closer to 7 is more neutral but higher isn't necessarily better
                  // For other minerals, higher is typically what people look for
                  const winner =
                    field.key === "ph"
                      ? null
                      : valA > valB
                        ? a.name
                        : valB > valA
                          ? b.name
                          : null;

                  return (
                    <tr
                      key={field.key}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium">{field.label}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({field.symbol})
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-center font-mono ${
                          winner === a.name ? "font-bold text-ocean-surface" : ""
                        }`}
                      >
                        <CountUp
                          end={valA}
                          decimals={field.key === "ph" ? 1 : valA < 1 ? 2 : 1}
                        />
                        {field.unit && (
                          <span className="text-xs text-muted-foreground ml-1">
                            {field.unit}
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3 px-4 text-center font-mono ${
                          winner === b.name ? "font-bold text-ocean-surface" : ""
                        }`}
                      >
                        <CountUp
                          end={valB}
                          decimals={field.key === "ph" ? 1 : valB < 1 ? 2 : 1}
                        />
                        {field.unit && (
                          <span className="text-xs text-muted-foreground ml-1">
                            {field.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        {winner ? (
                          <span className="text-ocean-surface font-medium">
                            {winner}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </section>

      <WaveDivider variant="choppy" />

      {/* Visual bar comparison */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-8">Visual Breakdown</h2>
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <div className="space-y-6">
            {mineralFields
              .filter((f) => f.key !== "ph")
              .map((field) => {
                const valA =
                  (a[field.key as keyof Brand] as number) ?? 0;
                const valB =
                  (b[field.key as keyof Brand] as number) ?? 0;
                const maxVal = Math.max(valA, valB, 1);

                return (
                  <div key={field.key}>
                    <p className="text-sm font-medium mb-2">
                      {field.label} ({field.unit})
                    </p>
                    <div className="space-y-2">
                      {[
                        { brand: a, val: valA },
                        { brand: b, val: valB },
                      ].map(({ brand, val }) => {
                        const pct =
                          maxVal > 0 ? (val / maxVal) * 100 : 0;
                        return (
                          <div
                            key={brand.slug}
                            className="flex items-center gap-3"
                          >
                            <span className="text-sm w-28 truncate text-right">
                              {brand.name}
                            </span>
                            <div className="flex-1 bg-secondary/50 rounded-full h-5 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-ocean-surface to-ocean-foam rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                                style={{
                                  width: `${Math.max(pct, 2)}%`,
                                }}
                              >
                                {pct > 15 && (
                                  <span className="text-xs text-white font-medium">
                                    {val}
                                  </span>
                                )}
                              </div>
                            </div>
                            {pct <= 15 && (
                              <span className="text-xs text-muted-foreground w-12">
                                {val}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollReveal>
      </section>

      {/* Navigation */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <div className="flex justify-between">
          <Link
            href="/compare"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Compare More
          </Link>
          <Link
            href="/brands"
            className="text-sm font-medium text-primary hover:underline"
          >
            All Brands →
          </Link>
        </div>
      </section>
    </>
  );
}
