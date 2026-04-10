"use client";

import { useState, useMemo } from "react";
import { CountUp } from "@/components/animation/CountUp";
import type { Brand } from "@/lib/types";

interface CompareSelectorProps {
  brands: Brand[];
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

export function CompareSelector({ brands }: CompareSelectorProps) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const selectedBrands = useMemo(
    () =>
      selectedSlugs
        .map((slug) => brands.find((b) => b.slug === slug))
        .filter(Boolean) as Brand[],
    [selectedSlugs, brands]
  );

  function toggleBrand(slug: string) {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= 4) return prev; // max 4
      return [...prev, slug];
    });
  }

  function getHighest(key: string): number {
    if (selectedBrands.length === 0) return 0;
    return Math.max(
      ...selectedBrands.map((b) => (b[key as keyof Brand] as number) ?? 0)
    );
  }

  return (
    <div>
      {/* Brand selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-3">
          Select brands to compare (up to 4):
        </label>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => {
            const isSelected = selectedSlugs.includes(brand.slug);
            return (
              <button
                key={brand.slug}
                onClick={() => toggleBrand(brand.slug)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "glass-card hover:shadow-md"
                } ${
                  !isSelected && selectedSlugs.length >= 4
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={!isSelected && selectedSlugs.length >= 4}
              >
                {brand.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      {selectedBrands.length >= 2 && (
        <div className="glass-card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-sm font-semibold">
                  Mineral
                </th>
                {selectedBrands.map((brand) => (
                  <th
                    key={brand.slug}
                    className="text-center py-4 px-4 text-sm font-semibold"
                  >
                    <a
                      href={`/brands/${brand.slug}`}
                      className="hover:text-ocean-surface transition-colors"
                    >
                      {brand.name}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Origin row */}
              <tr className="border-b border-border/50 bg-secondary/20">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  Origin
                </td>
                {selectedBrands.map((brand) => (
                  <td
                    key={brand.slug}
                    className="py-3 px-4 text-center"
                  >
                    {brand.origin}
                  </td>
                ))}
              </tr>
              {/* Type row */}
              <tr className="border-b border-border/50 bg-secondary/20">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  Type
                </td>
                {selectedBrands.map((brand) => (
                  <td
                    key={brand.slug}
                    className="py-3 px-4 text-center capitalize"
                  >
                    {brand.type}
                  </td>
                ))}
              </tr>
              {/* Rating row */}
              <tr className="border-b border-border/50 bg-secondary/20">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  Rating
                </td>
                {selectedBrands.map((brand) => (
                  <td
                    key={brand.slug}
                    className="py-3 px-4 text-center font-semibold"
                  >
                    {brand.rating.toFixed(1)} ★
                  </td>
                ))}
              </tr>
              {/* Price row */}
              <tr className="border-b border-border/50 bg-secondary/20">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  Price Range
                </td>
                {selectedBrands.map((brand) => (
                  <td
                    key={brand.slug}
                    className="py-3 px-4 text-center"
                  >
                    {brand.price_range}
                  </td>
                ))}
              </tr>
              {/* Mineral rows */}
              {mineralFields.map((field) => {
                const highest = getHighest(field.key);
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
                    {selectedBrands.map((brand) => {
                      const value =
                        (brand[field.key as keyof Brand] as number) ?? 0;
                      const isHighest = value === highest && highest > 0;
                      return (
                        <td
                          key={brand.slug}
                          className={`py-3 px-4 text-center font-mono ${
                            isHighest
                              ? "font-bold text-ocean-surface"
                              : ""
                          }`}
                        >
                          <CountUp
                            end={value}
                            decimals={field.key === "ph" ? 1 : value < 1 ? 2 : 1}
                          />
                          {field.unit && (
                            <span className="text-xs text-muted-foreground ml-1">
                              {field.unit}
                            </span>
                          )}
                          {isHighest && (
                            <span className="ml-1 text-xs text-ocean-surface">
                              highest
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedBrands.length === 1 && (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Select at least one more brand to start comparing.
        </div>
      )}

      {selectedBrands.length === 0 && (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Select two or more brands above to see a side-by-side comparison.
        </div>
      )}

      {/* Visual bar comparison */}
      {selectedBrands.length >= 2 && (
        <div className="mt-8 space-y-6">
          <h3 className="text-xl font-bold">Visual Comparison</h3>
          {mineralFields
            .filter((f) => f.key !== "ph")
            .map((field) => {
              const maxVal = Math.max(
                ...selectedBrands.map(
                  (b) => (b[field.key as keyof Brand] as number) ?? 0
                ),
                1
              );
              return (
                <div key={field.key}>
                  <p className="text-sm font-medium mb-2">
                    {field.label} ({field.unit})
                  </p>
                  <div className="space-y-2">
                    {selectedBrands.map((brand) => {
                      const value =
                        (brand[field.key as keyof Brand] as number) ?? 0;
                      const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
                      return (
                        <div key={brand.slug} className="flex items-center gap-3">
                          <span className="text-sm w-28 truncate text-right">
                            {brand.name}
                          </span>
                          <div className="flex-1 bg-secondary/50 rounded-full h-5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-ocean-surface to-ocean-foam rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            >
                              {pct > 15 && (
                                <span className="text-xs text-white font-medium">
                                  {value}
                                </span>
                              )}
                            </div>
                          </div>
                          {pct <= 15 && (
                            <span className="text-xs text-muted-foreground w-12">
                              {value}
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
      )}
    </div>
  );
}
