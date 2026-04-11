"use client";

import { useCallback } from "react";
import { Search } from "lucide-react";
import { useTapWaterSearch } from "@/lib/hooks/use-tap-water-search";
import { formatLeadValue, formatSampleDate } from "@/lib/tap-water/format";
import type { TapWaterSample } from "@/lib/tap-water/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type TapWaterSearchController = ReturnType<typeof useTapWaterSearch>;

function SummaryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
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

function formatCountPercent(value: { count: number; percent: number }) {
  return `${value.count} (${formatPercent(value.percent)})`;
}

function RecentTestCard({ sample }: { sample: TapWaterSample }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {sample.zipCode ? `ZIP ${sample.zipCode}` : "ZIP unavailable"}
        </CardTitle>
        <CardDescription>
          {sample.borough ?? "NYC"} • {formatSampleDate(sample)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryField label="First Draw Lead" value={formatLeadValue(sample.leadFirstDraw.value)} />
        <SummaryField
          label="1-2 Min Flush Lead"
          value={formatLeadValue(sample.leadFlushOneToTwo.value)}
        />
        <SummaryField label="5 Min Flush Lead" value={formatLeadValue(sample.leadFlushFive.value)} />
        <SummaryField label="First Draw Copper" value={formatLeadValue(sample.copperFirstDraw.value)} />
        <SummaryField
          label="1-2 Min Flush Copper"
          value={formatLeadValue(sample.copperFlushOneToTwo.value)}
        />
        <SummaryField label="5 Min Flush Copper" value={formatLeadValue(sample.copperFlushFive.value)} />
      </CardContent>
    </Card>
  );
}

function DistributionBar({
  label,
  value,
}: {
  label: string;
  value: { count: number; percent: number };
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{formatCountPercent(value)}</span>
      </div>
      <div className="h-2 w-full rounded bg-muted">
        <div className="h-full rounded bg-primary" style={{ width: `${Math.min(value.percent, 100)}%` }} />
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
  const isLoading = state.phase === "loading";

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submitSearch();
    },
    [submitSearch],
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">NYC Home Lead Results by ZIP</h1>
        <p className="max-w-3xl text-muted-foreground">
          Search by ZIP code to see aggregated lead-at-the-tap results across homes. Lead levels can
          vary across homes in the same ZIP.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search ZIP Lead Results</CardTitle>
          <CardDescription>
            Enter a 5-digit NYC ZIP code like <span className="font-medium">11356</span>.
          </CardDescription>
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
                state.phase === "validation_error" ? "text-destructive" : "text-muted-foreground"
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
              Enter a ZIP code to see aggregated lead results and distribution across homes.
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

      {(state.phase === "success" || state.phase === "empty") && state.leadSummary ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Overview</CardTitle>
            <CardDescription>
              {state.meta?.zip ? `ZIP ${state.meta.zip}` : "ZIP"} • Lead results vary across homes in this ZIP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryField label="Total Tests" value={String(state.leadSummary.sampleCount)} />
              <SummaryField
                label="Most Recent Test Date"
                value={state.leadSummary.mostRecentTestDate ?? "N/A"}
              />
              <SummaryField
                label="Median First Draw Lead"
                value={formatLeadValue(state.leadSummary.medianFirstDraw)}
              />
              <SummaryField
                label="Maximum First Draw Lead"
                value={formatLeadValue(state.leadSummary.maxFirstDraw)}
              />
              <SummaryField
                label="Percent Detected (> 0)"
                value={formatPercent(state.leadSummary.percentDetected)}
              />
              <SummaryField
                label="Percent Elevated (>= 0.015 mg/L)"
                value={formatPercent(state.leadSummary.percentElevated)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {state.notes ??
                "First draw reflects water that sat in pipes, flushed values may better reflect deeper plumbing/system conditions, and results vary by home."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {(state.phase === "success" || state.phase === "empty") && state.distribution ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribution</CardTitle>
            <CardDescription>Counts and percentages across first-draw lead results.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DistributionBar label="Not detected" value={state.distribution.notDetected} />
            <DistributionBar label="Detected" value={state.distribution.detected} />
            <DistributionBar label="Elevated" value={state.distribution.elevated} />
          </CardContent>
        </Card>
      ) : null}

      {state.phase === "empty" ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">
              No lead-at-the-tap samples were found for this ZIP code yet.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {state.phase === "success" ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Recent Tests</h2>
          <div className="space-y-3">
            {state.recentTests.map((sample) => (
              <RecentTestCard key={sample.id} sample={sample} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
