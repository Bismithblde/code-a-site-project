import { NUMERIC_FIELDS } from "./constants";
import type {
  HealthStatus,
  HealthSummary,
  NumericFieldKey,
  NumericFieldStats,
  SampleComputedSummary,
  SummaryResult,
  WaterSample,
} from "./types";

const EPA_LEAD_ACTION_LEVEL_MG_L = 0.015;
const LEAD_REVIEW_LEVEL_MG_L = 0.005;

function getNumericValue(sample: WaterSample, field: NumericFieldKey) {
  return sample[field].value;
}

function getMaxLeadValue(sample: WaterSample) {
  const leadValues = [
    sample.leadFirstDraw.value,
    sample.leadFlushOneToTwo.value,
    sample.leadFlushFive.value,
  ].filter((value): value is number => value != null);

  if (leadValues.length === 0) {
    return null;
  }

  return Math.max(...leadValues);
}

function getLeadRisk(sample: WaterSample): SampleComputedSummary["leadRisk"] {
  const maxLead = getMaxLeadValue(sample);

  if (maxLead == null) {
    return "unknown";
  }

  if (maxLead >= EPA_LEAD_ACTION_LEVEL_MG_L) {
    return "high";
  }

  if (maxLead >= LEAD_REVIEW_LEVEL_MG_L) {
    return "elevated";
  }

  return "low";
}

export function getComputedSummaryForSample(
  sample: WaterSample,
): SampleComputedSummary {
  const leadRisk = getLeadRisk(sample);

  if (leadRisk === "high") {
    return {
      leadRisk,
      overall: "alert",
      filterRecommendation: "strongly_recommended",
    };
  }

  if (leadRisk === "elevated") {
    return {
      leadRisk,
      overall: "review",
      filterRecommendation: "recommended",
    };
  }

  if (leadRisk === "low") {
    return {
      leadRisk,
      overall: "normal",
      filterRecommendation: "not_needed",
    };
  }

  return {
    leadRisk: "unknown",
    overall: "unknown",
    filterRecommendation: "unknown",
  };
}

export function getHealthSummaryForSample(sample: WaterSample): HealthSummary {
  const summary = getComputedSummaryForSample(sample);
  const reasons: string[] = [];

  const maxLead = getMaxLeadValue(sample);
  if (maxLead != null) {
    reasons.push(`Highest lead reading: ${maxLead.toFixed(3)} mg/L.`);
  } else {
    reasons.push("No usable lead reading was available for this sample.");
  }

  if (summary.filterRecommendation === "strongly_recommended") {
    reasons.push(
      "Lead is at or above the EPA 0.015 mg/L action level. Use a certified lead-removal filter.",
    );
    return { status: "alert", reasons };
  }

  if (summary.filterRecommendation === "recommended") {
    reasons.push(
      "Lead is elevated above the project review level. A certified lead-removal filter is recommended.",
    );
    return { status: "watch", reasons };
  }

  if (summary.filterRecommendation === "not_needed") {
    reasons.push(
      "Lead is low in this sample. A dedicated lead filter is optional based on your risk tolerance.",
    );
    return { status: "normal", reasons };
  }

  return {
    status: "unknown",
    reasons,
  };
}

function summarizeNumericField(
  samples: WaterSample[],
  field: NumericFieldKey,
): NumericFieldStats {
  const values = samples
    .map((sample) => sample[field].value)
    .filter((value): value is number => value != null);

  if (values.length === 0) {
    return {
      field,
      count: 0,
      min: null,
      max: null,
      average: null,
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    field,
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    average: total / values.length,
  };
}

export function summarizeSamples(
  allSamples: WaterSample[],
  filteredSamples: WaterSample[],
): SummaryResult {
  const sampleClasses = filteredSamples.reduce<Record<string, number>>(
    (accumulator, sample) => {
      const key = sample.borough ?? "Unknown";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  const statuses = filteredSamples.map(getHealthSummaryForSample);
  const counts: Record<HealthStatus, number> = {
    alert: 0,
    watch: 0,
    normal: 0,
    unknown: 0,
  };

  statuses.forEach((status) => {
    counts[status.status] += 1;
  });

  const orderedStatuses: HealthStatus[] = ["alert", "watch", "normal", "unknown"];
  const overallStatus =
    orderedStatuses.find((status) => counts[status] > 0) ?? "unknown";

  const datedSamples = filteredSamples
    .map((sample) => sample.sampleDate)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => left.localeCompare(right));

  return {
    totalCount: allSamples.length,
    filteredCount: filteredSamples.length,
    dateRange: {
      from: datedSamples[0] ?? null,
      to: datedSamples[datedSamples.length - 1] ?? null,
    },
    sampleClasses,
    numeric: NUMERIC_FIELDS.map((field) => summarizeNumericField(filteredSamples, field)),
    health: {
      overallStatus,
      counts,
    },
  };
}
