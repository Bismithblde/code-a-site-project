import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { StaggerGrid } from "@/components/animation/StaggerGrid";
import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { WaveDivider } from "@/components/animation/WaveDivider";
import type { Brand } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Mineral Water Brands — MineralWater",
  description:
    "Browse and compare mineral water brands by mineral content, taste, and price.",
};

export default async function BrandsPage() {
  const supabase = await createClient();
  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .order("name");

  const allBrands = (brands ?? []) as Brand[];
  const stillBrands = allBrands.filter((b) => b.type === "still");
  const sparklingBrands = allBrands.filter((b) => b.type === "sparkling");
  const bothBrands = allBrands.filter((b) => b.type === "both");

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 py-8">
        <ScrollReveal>
          <h1 className="text-4xl font-bold mb-2">Mineral Water Brands</h1>
          <p className="text-muted-foreground mb-8">
            Compare {allBrands.length} brands by mineral content, taste, and
            price.
          </p>
        </ScrollReveal>

        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allBrands.map((brand) => (
            <ProductCard key={brand.slug} brand={brand} showAffiliate />
          ))}
        </StaggerGrid>
      </section>

      <WaveDivider variant="gentle" />

      {/* Grouped by type */}
      {stillBrands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <ScrollReveal>
            <h2 className="text-2xl font-bold mb-6">Still Water</h2>
          </ScrollReveal>
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stillBrands.map((brand) => (
              <ProductCard key={brand.slug} brand={brand} showAffiliate />
            ))}
          </StaggerGrid>
        </section>
      )}

      {sparklingBrands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <ScrollReveal>
            <h2 className="text-2xl font-bold mb-6">Sparkling Water</h2>
          </ScrollReveal>
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sparklingBrands.map((brand) => (
              <ProductCard key={brand.slug} brand={brand} showAffiliate />
            ))}
          </StaggerGrid>
        </section>
      )}

      {bothBrands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <ScrollReveal>
            <h2 className="text-2xl font-bold mb-6">Still & Sparkling</h2>
          </ScrollReveal>
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bothBrands.map((brand) => (
              <ProductCard key={brand.slug} brand={brand} showAffiliate />
            ))}
          </StaggerGrid>
        </section>
      )}
    </>
  );
}
