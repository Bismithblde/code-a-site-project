"use client";

import { useCallback, useMemo } from "react";
import { Search } from "lucide-react";
import { useTapWaterSearch } from "@/lib/hooks/use-tap-water-search";
import {
  formatDistanceMiles,
  formatFilterRecommendationLabel,
  formatLeadRiskLabel,
  formatLeadValue,
  formatProbability,
  formatSampleDate,
  formatStatusLabel,
  getStatusBadgeVariant,
  shouldBuyFilter,
} from "@/lib/tap-water/format";
import type { TapWaterSample } from "@/lib/tap-water/types";
import { Badge } from "@/components/ui/badge";
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

function SampleCard({ sample }: { sample: TapWaterSample }) {
  const overallStatus = sample.summary.overall;
  const reasons = sample.healthSummary.reasons ?? [];
  const keyReasons = reasons.slice(0, 2);
  const maxLead = [sample.leadFirstDraw.value, sample.leadFlushOneToTwo.value, sample.leadFlushFive.value]
    .filter((value): value is number => value != null)
    .sort((left, right) => right - left)[0] ?? null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {sample.zipCode ? `ZIP ${sample.zipCode}` : sample.location ?? "Unknown location"}
            </CardTitle>
            <CardDescription>
              {sample.borough ?? "NYC"} • Sample {sample.sampleNumber ?? "N/A"} •{" "}
              {formatSampleDate(sample)}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getStatusBadgeVariant(overallStatus)}>
              {formatStatusLabel(overallStatus)}
            </Badge>
            <Badge variant="outline">{formatDistanceMiles(sample.distanceMiles)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SummaryField label="Lead Risk" value={formatLeadRiskLabel(sample.summary.leadRisk)} />
          <SummaryField label="Highest Lead" value={formatLeadValue(maxLead)} />
          <SummaryField
            label="Filter Decision"
            value={formatFilterRecommendationLabel(sample.summary.filterRecommendation)}
          />
        </div>
        {keyReasons.length > 0 ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {keyReasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No health reasons were provided.</p>
        )}
        {reasons.length > 2 ? (
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer select-none text-foreground">
              Show all reasons
            </summary>
            <ul className="mt-2 space-y-1">
              {reasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </CardContent>
    </Card>
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

  const summary = state.nearbySummary;
  const sortedSamples = useMemo(() => state.data, [state.data]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">NYC Tap Water Lookup</h1>
        <p className="max-w-3xl text-muted-foreground">
          Search by ZIP code for lead-at-the-tap samples and a quick recommendation on
          whether you should buy a certified lead-removal filter.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Nearby Samples</CardTitle>
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
              Enter a ZIP code to see lead results and a filter recommendation.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? <LoadingState /> : null}

      {state.phase === "error" ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load nearby samples</CardTitle>
            <CardDescription>
              Check your input and try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => submitSearch()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {(state.phase === "success" || state.phase === "empty") && summary ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Nearby Summary</CardTitle>
                <CardDescription>
                  {state.meta?.zip
                    ? `ZIP ${state.meta.zip} • ${summary.sampleCount} nearby sample${
                        summary.sampleCount === 1 ? "" : "s"
                      }`
                    : `${summary.sampleCount} matching sample${
                        summary.sampleCount === 1 ? "" : "s"
                      }`}
                </CardDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(summary.overall)}>
                Overall: {formatStatusLabel(summary.overall)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryField
              label="Lead Risk"
              value={formatLeadRiskLabel(summary.leadRisk)}
            />
            <SummaryField
              label="Should Buy Filter"
              value={shouldBuyFilter(summary.filterRecommendation) ? "Yes" : "No"}
            />
            <SummaryField
              label="Recommendation"
              value={formatFilterRecommendationLabel(summary.filterRecommendation)}
            />
            <SummaryField
              label="Avg Lead (First Draw)"
              value={formatLeadValue(summary.averageLeadFirstDrawMgL ?? null)}
            />
            <SummaryField
              label="High-Risk Probability"
              value={formatProbability(summary.leadRiskDistribution?.high)}
            />
            <SummaryField
              label="Nearest Distance"
              value={formatDistanceMiles(summary.nearestDistanceMiles)}
            />
            <SummaryField
              label="Sample Count"
              value={String(summary.sampleCount)}
            />
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
          <h2 className="text-xl font-semibold">Nearby Samples</h2>
          <div className="space-y-3">
            {sortedSamples.map((sample) => (
              <SampleCard key={sample.id} sample={sample} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
