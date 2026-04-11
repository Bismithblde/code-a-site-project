"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { Brand } from "@/lib/types";

type SortOption = "name" | "rating" | "price-low" | "price-high" | "tds" | "calcium" | "magnesium" | "ph";
type TypeFilter = "still" | "sparkling" | "both";
type MineralKey =
  | "calcium"
  | "magnesium"
  | "sodium"
  | "potassium"
  | "bicarbonate"
  | "sulfate"
  | "silica";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "name", label: "Name (A-Z)" },
  { value: "rating", label: "Rating (High-Low)" },
  { value: "price-low", label: "Price (Low-High)" },
  { value: "price-high", label: "Price (High-Low)" },
  { value: "tds", label: "TDS (High-Low)" },
  { value: "calcium", label: "Calcium (High-Low)" },
  { value: "magnesium", label: "Magnesium (High-Low)" },
  { value: "ph", label: "pH (High-Low)" },
];

const typeFilters: { value: TypeFilter; label: string }[] = [
  { value: "still", label: "Still" },
  { value: "sparkling", label: "Sparkling" },
  { value: "both", label: "Still & Sparkling" },
];

const mineralOptions: { key: MineralKey; label: string }[] = [
  { key: "calcium", label: "Calcium" },
  { key: "magnesium", label: "Magnesium" },
  { key: "sodium", label: "Sodium" },
  { key: "potassium", label: "Potassium" },
  { key: "bicarbonate", label: "Bicarbonate" },
  { key: "sulfate", label: "Sulfate" },
  { key: "silica", label: "Silica" },
];

const priceMap: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3 };

function sortBrands(brands: Brand[], sort: SortOption): Brand[] {
  const sorted = [...brands];
  switch (sort) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "price-low":
      return sorted.sort((a, b) => (priceMap[a.price_range] ?? 2) - (priceMap[b.price_range] ?? 2));
    case "price-high":
      return sorted.sort((a, b) => (priceMap[b.price_range] ?? 2) - (priceMap[a.price_range] ?? 2));
    case "tds":
      return sorted.sort((a, b) => b.tds - a.tds);
    case "calcium":
      return sorted.sort((a, b) => b.calcium - a.calcium);
    case "magnesium":
      return sorted.sort((a, b) => b.magnesium - a.magnesium);
    case "ph":
      return sorted.sort((a, b) => b.ph - a.ph);
    default:
      return sorted;
  }
}

function rankByMineralKnapsack(brands: Brand[], selectedMinerals: MineralKey[]): Brand[] {
  if (selectedMinerals.length === 0) {
    return brands;
  }

  const maxByMineral = selectedMinerals.reduce<Record<MineralKey, number>>(
    (acc, mineral) => {
      acc[mineral] = Math.max(...brands.map((brand) => brand[mineral]), 1);
      return acc;
    },
    {
      calcium: 1,
      magnesium: 1,
      sodium: 1,
      potassium: 1,
      bicarbonate: 1,
      sulfate: 1,
      silica: 1,
    }
  );

  return [...brands].sort((a, b) => {
    const scoreA = selectedMinerals.reduce((total, mineral) => total + a[mineral] / maxByMineral[mineral], 0);
    const scoreB = selectedMinerals.reduce((total, mineral) => total + b[mineral] / maxByMineral[mineral], 0);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    return b.rating - a.rating;
  });
}

export function BrandFilters({ brands }: { brands: Brand[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("rating");
  const [selectedTypes, setSelectedTypes] = useState<TypeFilter[]>([]);
  const [typeAccordionOpen, setTypeAccordionOpen] = useState(false);
  const [selectedMinerals, setSelectedMinerals] = useState<MineralKey[]>([]);
  const [mineralAccordionOpen, setMineralAccordionOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = brands;

    if (selectedTypes.length > 0) {
      result = result.filter((b) => selectedTypes.includes(b.type as TypeFilter));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.origin.toLowerCase().includes(q) ||
          b.tasting_notes.toLowerCase().includes(q)
      );
    }

    if (selectedMinerals.length > 0) {
      return rankByMineralKnapsack(result, selectedMinerals);
    }

    return sortBrands(result, sort);
  }, [brands, search, sort, selectedTypes, selectedMinerals]);

  const selectedTypeLabel =
    selectedTypes.length === 0
      ? "All types"
      : selectedTypes.length === 1
        ? typeFilters.find((t) => t.value === selectedTypes[0])?.label ?? "1 selected"
        : `${selectedTypes.length} selected`;

  const selectedMineralLabel =
    selectedMinerals.length === 0
      ? "Search by mineral content"
      : selectedMinerals.length === 1
        ? mineralOptions.find((m) => m.key === selectedMinerals[0])?.label ?? "1 selected"
        : `${selectedMinerals.length} minerals selected`;

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brands..."
                className="h-14 w-full rounded-2xl border border-border bg-background pl-12 pr-4 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setTypeAccordionOpen((open) => !open)}
                className="inline-flex h-14 min-w-44 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground"
                aria-expanded={typeAccordionOpen}
                aria-controls="type-accordion"
              >
                <span>{selectedTypeLabel}</span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${typeAccordionOpen ? "rotate-180" : ""}`} />
              </button>
              {typeAccordionOpen && (
                <div
                  id="type-accordion"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-56 rounded-2xl border border-border bg-background p-3 shadow-lg"
                >
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Water type</p>
                  <div className="space-y-2">
                    {typeFilters.map((t) => {
                      const checked = selectedTypes.includes(t.value);
                      return (
                        <label key={t.value} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedTypes((prev) =>
                                prev.includes(t.value) ? prev.filter((value) => value !== t.value) : [...prev, t.value]
                              );
                            }}
                            className="size-4 rounded border-border accent-primary"
                          />
                          {t.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setMineralAccordionOpen((open) => !open)}
                className="inline-flex h-14 min-w-64 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground"
                aria-expanded={mineralAccordionOpen}
                aria-controls="mineral-accordion"
              >
                <span className="truncate">{selectedMineralLabel}</span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${mineralAccordionOpen ? "rotate-180" : ""}`} />
              </button>
              {mineralAccordionOpen && (
                <div
                  id="mineral-accordion"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-72 rounded-2xl border border-border bg-background p-3 shadow-lg"
                >
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Search by mineral content
                  </p>
                  <p className="mb-3 text-xs text-muted-foreground">Choose up to 3 minerals</p>
                  <div className="space-y-2">
                    {mineralOptions.map((mineral) => {
                      const checked = selectedMinerals.includes(mineral.key);
                      return (
                        <label key={mineral.key} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedMinerals((prev) => {
                                if (prev.includes(mineral.key)) {
                                  return prev.filter((value) => value !== mineral.key);
                                }
                                if (prev.length >= 3) {
                                  return prev;
                                }
                                return [...prev, mineral.key];
                              });
                            }}
                            className="size-4 rounded border-border accent-primary"
                          />
                          {mineral.label}
                        </label>
                      );
                    })}
                  </div>
                  {selectedMinerals.length >= 3 ? (
                    <p className="mt-3 text-xs text-muted-foreground">Maximum 3 minerals selected</p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="relative hidden sm:block">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                disabled={selectedMinerals.length > 0}
                className="h-14 min-w-52 appearance-none rounded-2xl border border-border bg-background pl-4 pr-10 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="mt-3 sm:hidden">
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                disabled={selectedMinerals.length > 0}
                className="h-10 w-full appearance-none rounded-xl border border-border bg-background pl-3 pr-8 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    Sort: {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            {filtered.length} brand{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
            {selectedTypes.length > 0 && ` | ${selectedTypes.join(", ")}`}
            {selectedMinerals.length > 0
              ? ` | ${selectedMinerals.join(", ")}`
              : ` | ${sortOptions.find((o) => o.value === sort)?.label}`}
          </p>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((brand) => (
            <ProductCard key={brand.slug} brand={brand} showAffiliate />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-lg text-muted-foreground">No brands found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedTypes([]);
              setSelectedMinerals([]);
              setSort("rating");
            }}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
