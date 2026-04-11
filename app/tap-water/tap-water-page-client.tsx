"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTapWaterSearch } from "@/lib/hooks/use-tap-water-search";
import {
  formatFilterRecommendationLabel,
  formatLeadValue,
  formatSampleDate,
} from "@/lib/tap-water/format";
import type { TapWaterSample } from "@/lib/tap-water/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type TapWaterSearchController = ReturnType<typeof useTapWaterSearch>;

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "0%";
  }

  return `${value.toFixed(1)}%`;
}

function getFilterTone(
  value: "not_needed" | "recommended" | "strongly_recommended" | "unknown",
) {
  switch (value) {
    case "not_needed":
      return {
        badge: "secondary" as const,
        panel: "border-emerald-500/30 bg-emerald-500/10",
        title: "Lead risk appears low in this ZIP",
      };
    case "recommended":
      return {
        badge: "outline" as const,
        panel: "border-amber-500/30 bg-amber-500/10",
        title: "Lead can show up in some homes in this ZIP",
      };
    case "strongly_recommended":
      return {
        badge: "destructive" as const,
        panel: "border-destructive/40 bg-destructive/10",
        title: "Lead risk is elevated in this ZIP",
      };
    default:
      return {
        badge: "outline" as const,
        panel: "border-border bg-muted/30",
        title: "Lead recommendation is unavailable for this ZIP",
      };
  }
}

function RecentTestCard({ sample }: { sample: TapWaterSample }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {sample.zipCode ? `ZIP ${sample.zipCode}` : "ZIP unavailable"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatSampleDate(sample)}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SummaryField
          label="First Draw Lead"
          value={formatLeadValue(sample.leadFirstDraw.value)}
        />
        <SummaryField
          label="1-2 Min Flush Lead"
          value={formatLeadValue(sample.leadFlushOneToTwo.value)}
        />
        <SummaryField
          label="5 Min Flush Lead"
          value={formatLeadValue(sample.leadFlushFive.value)}
        />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-44 w-full rounded-xl" />
    </div>
  );
}

export function TapWaterPageClient({
  controller,
}: {
  controller?: TapWaterSearchController;
}) {
  const defaultController = useTapWaterSearch({ limit: 5 });
  const { state, setQuery, submitSearch } = controller ?? defaultController;
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLoading = state.phase === "loading";
  const filterRecommendation =
    state.nearbySummary?.filterRecommendation ?? "unknown";
  const filterTone = getFilterTone(filterRecommendation);
  const distributionData = state.distribution
    ? [
        {
          name: "ZIP distribution",
          notDetected: state.distribution.notDetected.percent,
          detected: state.distribution.detected.percent,
          elevated: state.distribution.elevated.percent,
        },
      ]
    : [];
  const totalSlides = 3;
  const nextSlide = () =>
    setCurrentSlide((previous) => (previous + 1) % totalSlides);
  const previousSlide = () =>
    setCurrentSlide((previous) => (previous - 1 + totalSlides) % totalSlides);

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submitSearch();
    },
    [submitSearch],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 bg-white px-4 py-6 text-slate-900">
      <header className="text-center">
        <h1 className="text-3xl font-bold">Tap Water Quality Lookup</h1>
      </header>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Search ZIP Lead Results</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
            <Input
              value={state.query}
              placeholder="Enter ZIP code"
              onValueChange={setQuery}
              aria-invalid={state.phase === "validation_error"}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="mr-1 size-4" />
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </form>
          {state.errorMessage && (
            <p
              className={`mt-2 text-sm ${
                state.phase === "validation_error"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {state.errorMessage}
            </p>
          )}
        </CardContent>
      </Card>

      {state.phase === "idle" ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">
              Enter a ZIP code to load your lead risk summary and charts.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? <LoadingState /> : null}

      {state.phase === "error" ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load ZIP lead results</CardTitle>
            <CardDescription>Check your input and try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => submitSearch()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {(state.phase === "success" || state.phase === "empty") &&
      state.leadSummary &&
      state.distribution ? (
        <Card className="bg-white">
          <CardContent className="space-y-4 pt-8">
            <div className="relative min-h-[18rem] overflow-hidden">
              <div
                className={`absolute inset-0 flex w-full flex-col items-center justify-center space-y-4 px-2 text-center transition-all duration-300 ease-out ${
                  currentSlide === 0
                    ? "translate-y-0 opacity-100"
                    : "translate-y-1 opacity-0 pointer-events-none"
                }`}
              >
                <p className="font-['Nunito','Fredoka','ui-rounded','system-ui','sans-serif'] text-[2.025rem] font-black leading-tight tracking-tight md:text-[2.7rem]">
                  {`We tested ${state.leadSummary.sampleCount} samples. ${formatPercent(state.leadSummary.percentDetected)} have lead. Median first draw: ${formatLeadValue(state.leadSummary.medianFirstDraw)}.`}
                </p>
              </div>
              <div
                className={`absolute inset-0 flex w-full flex-col items-center justify-center space-y-4 px-2 text-center transition-all duration-300 ease-out ${
                  currentSlide === 1
                    ? "translate-y-0 opacity-100"
                    : "translate-y-1 opacity-0 pointer-events-none"
                }`}
              >
                <div>
                  <Badge variant={filterTone.badge}>
                    {formatFilterRecommendationLabel(filterRecommendation)}
                  </Badge>
                </div>
                <p className="font-['Nunito','Fredoka','ui-rounded','system-ui','sans-serif'] text-[2.025rem] font-black leading-tight tracking-tight md:text-[2.7rem]">
                  {filterRecommendation === "not_needed"
                    ? "You do not need a filter."
                    : filterRecommendation === "recommended"
                      ? "Use a lead-certified filter."
                      : filterRecommendation === "strongly_recommended"
                        ? "Use a lead-certified filter now."
                        : "Filter guidance unavailable."}
                </p>
              </div>
              <div
                className={`absolute inset-0 flex w-full flex-col items-center justify-center space-y-4 px-2 text-center transition-all duration-300 ease-out ${
                  currentSlide === 2
                    ? "translate-y-0 opacity-100"
                    : "translate-y-1 opacity-0 pointer-events-none"
                }`}
              >
                <p className="font-['Nunito','Fredoka','ui-rounded','system-ui','sans-serif'] text-[2.025rem] font-black tracking-tight md:text-[2.7rem]">
                  Lead Distribution
                </p>
                <div className="h-44 w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={280}
                    minHeight={140}
                  >
                    <BarChart
                      data={distributionData}
                      layout="vertical"
                      margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis type="category" dataKey="name" width={0} hide />
                      <Tooltip
                        formatter={(value, name) => {
                          const numericValue =
                            typeof value === "number"
                              ? value
                              : Number(value ?? 0);
                          return [
                            `${numericValue.toFixed(1)}%`,
                            String(name ?? ""),
                          ];
                        }}
                        labelFormatter={() => "First draw test share"}
                      />
                      <Bar
                        dataKey="notDetected"
                        stackId="risk"
                        fill="#10b981"
                        name="Not detected"
                      />
                      <Bar
                        dataKey="detected"
                        stackId="risk"
                        fill="#f59e0b"
                        name="Detected"
                      />
                      <Bar
                        dataKey="elevated"
                        stackId="risk"
                        fill="#ef4444"
                        name="Elevated"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={previousSlide}
                aria-label="Previous summary page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to summary page ${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    currentSlide === index ? "bg-slate-900" : "bg-slate-300"
                  }`}
                />
              ))}
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={nextSlide}
                aria-label="Next summary page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {state.phase === "empty" ? (
        <Card className="bg-white">
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">
              No lead-at-the-tap samples were found for this ZIP code yet.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {state.phase === "success" ? (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
            <CardDescription>
              Expand only if you want the individual records behind the summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <details className="rounded-lg border border-border p-3">
              <summary className="cursor-pointer font-medium">
                Recent Tests
              </summary>
              {state.recentTests.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {state.recentTests.map((sample) => (
                    <RecentTestCard key={sample.id} sample={sample} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No individual sample rows were returned for this ZIP.
                </p>
              )}
            </details>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
