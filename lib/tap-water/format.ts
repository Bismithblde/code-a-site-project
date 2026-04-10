import type {
  TapWaterFilterRecommendation,
  TapWaterLeadRisk,
  TapWaterNearbySummary,
  TapWaterSample,
  TapWaterSearchMode,
  TapWaterStatus,
} from "./types";

function formatTitleCase(value: string) {
  return value
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export function getStatusBadgeVariant(status: TapWaterStatus) {
  switch (status) {
    case "alert":
      return "destructive" as const;
    case "review":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export function formatStatusLabel(status: TapWaterStatus | string) {
  if (status === "review") {
    return "Review";
  }

  if (status === "normal") {
    return "Normal";
  }

  if (status === "alert") {
    return "Alert";
  }

  if (status === "unknown") {
    return "Unknown";
  }

  return formatTitleCase(status);
}

export function formatLeadRiskLabel(value: TapWaterLeadRisk | "unknown") {
  switch (value) {
    case "low":
      return "Low";
    case "elevated":
      return "Elevated";
    case "high":
      return "High";
    default:
      return "Unknown";
  }
}

export function formatFilterRecommendationLabel(value: TapWaterFilterRecommendation) {
  switch (value) {
    case "not_needed":
      return "Filter Not Needed";
    case "recommended":
      return "Filter Recommended";
    case "strongly_recommended":
      return "Filter Strongly Recommended";
    default:
      return "Recommendation Unavailable";
  }
}

export function shouldBuyFilter(value: TapWaterFilterRecommendation) {
  return value === "recommended" || value === "strongly_recommended";
}

export function formatDistanceMiles(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "Distance unavailable";
  }

  return `${value.toFixed(1)} mi`;
}

export function formatLeadValue(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value.toFixed(3)} mg/L`;
}

export function formatProbability(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "N/A";
  }

  return `${(value * 100).toFixed(0)}%`;
}

export function formatSampleDate(sample: TapWaterSample) {
  const source = sample.sampledAt ?? sample.sampleDate;

  if (!source) {
    return "Date unavailable";
  }

  const date = new Date(source);

  if (Number.isNaN(date.getTime())) {
    return sample.sampleDate ?? "Date unavailable";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function maxBySeverity<T extends string>(
  values: T[],
  severityMap: Record<T, number>,
  fallback: T,
) {
  if (values.length === 0) {
    return fallback;
  }

  let current = values[0] ?? fallback;

  for (const value of values) {
    if (severityMap[value] > severityMap[current]) {
      current = value;
    }
  }

  return current;
}

export function buildFallbackNearbySummary(samples: TapWaterSample[]): TapWaterNearbySummary {
  if (samples.length === 0) {
    return {
      sampleCount: 0,
      nearestDistanceMiles: null,
      overall: "unknown",
      leadRisk: "unknown",
      filterRecommendation: "unknown",
    };
  }

  const overall = maxBySeverity(
    samples.map((sample) => sample.summary.overall),
    { unknown: 0, normal: 1, review: 2, alert: 3 },
    "unknown",
  );

  const leadRisk = maxBySeverity(
    samples.map((sample) => sample.summary.leadRisk),
    { unknown: 0, low: 1, elevated: 2, high: 3 },
    "unknown",
  );

  const filterRecommendation = maxBySeverity(
    samples.map((sample) => sample.summary.filterRecommendation),
    { unknown: 0, not_needed: 1, recommended: 2, strongly_recommended: 3 },
    "unknown",
  );

  const nearestDistance = samples
    .map((sample) => sample.distanceMiles)
    .filter((value): value is number => value != null)
    .sort((left, right) => left - right)[0] ?? null;

  return {
    sampleCount: samples.length,
    nearestDistanceMiles: nearestDistance,
    overall,
    leadRisk,
    filterRecommendation,
  };
}

export function getSearchModeFromInput(value: string): TapWaterSearchMode {
  return /^\d{5}$/.test(value.trim()) ? "zip" : "location";
}
