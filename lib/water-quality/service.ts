import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, NUMERIC_FIELDS } from "./constants";
import { WaterQualityValidationError } from "./errors";
import { findNearestTextMatches } from "./match";
import { normalizeText } from "./normalize";
import {
  getComputedSummaryForSample,
  getHealthSummaryForSample,
  summarizeSamples,
} from "./summary";
import { normalizeZipCode } from "./zip";
import type {
  NearbyQueryResult,
  NumericFieldKey,
  NearestMatch,
  QueryResult,
  SortField,
  SummaryResult,
  WaterSample,
  WaterSampleFilters,
} from "./types";

async function loadWaterDataset() {
  const { getWaterDataset } = await import("./repository");
  return getWaterDataset();
}

function coercePage(value: number | undefined) {
  if (!value || Number.isNaN(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function coercePageSize(value: number | undefined) {
  if (!value || Number.isNaN(value) || value < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(value), MAX_PAGE_SIZE);
}

function coerceLimit(value: number | undefined) {
  if (!value || Number.isNaN(value) || value < 1) {
    return 5;
  }

  return Math.min(Math.floor(value), 100);
}

function toTimestamp(sample: WaterSample) {
  const source = sample.sampledAt ?? sample.sampleDate;
  if (!source) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = Date.parse(source);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function getRecencyWeights(samples: WaterSample[]) {
  if (samples.length === 0) {
    return [];
  }

  const ranked = samples
    .map((sample, index) => ({ sample, index, timestamp: toTimestamp(sample) }))
    .sort(
      (left, right) =>
        left.timestamp - right.timestamp ||
        left.index - right.index,
    );

  const weights = new Array<number>(samples.length).fill(1);
  ranked.forEach((item, rank) => {
    weights[item.index] = rank + 1;
  });

  return weights;
}

function weightedAverage(
  values: Array<number | null>,
  weights: number[],
) {
  let totalWeight = 0;
  let totalValue = 0;

  values.forEach((value, index) => {
    if (value == null) {
      return;
    }
    const weight = weights[index] ?? 1;
    totalWeight += weight;
    totalValue += value * weight;
  });

  if (totalWeight === 0) {
    return null;
  }

  return totalValue / totalWeight;
}

function toProbabilityDistribution(samples: WaterSample[], weights: number[]) {
  const totals = {
    low: 0,
    elevated: 0,
    high: 0,
    unknown: 0,
  };

  let totalWeight = 0;

  samples.forEach((sample, index) => {
    const weight = weights[index] ?? 1;
    const risk = getComputedSummaryForSample(sample).leadRisk;
    totals[risk] += weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) {
    return totals;
  }

  return {
    low: totals.low / totalWeight,
    elevated: totals.elevated / totalWeight,
    high: totals.high / totalWeight,
    unknown: totals.unknown / totalWeight,
  };
}

export function buildProbabilitySummary(samples: WaterSample[]) {
  if (samples.length === 0) {
    return {
      sampleCount: 0,
      nearestDistanceMiles: null,
      overall: "unknown" as const,
      leadRisk: "unknown" as const,
      filterRecommendation: "unknown" as const,
      averageLeadFirstDrawMgL: null,
      averageLeadFlushOneToTwoMgL: null,
      averageLeadFlushFiveMgL: null,
      leadRiskDistribution: {
        low: 0,
        elevated: 0,
        high: 0,
        unknown: 0,
      },
    };
  }

  const weights = getRecencyWeights(samples);
  const distribution = toProbabilityDistribution(samples, weights);
  const expectedSeverity =
    distribution.low * 1 +
    distribution.elevated * 2 +
    distribution.high * 3;
  const elevatedOrHigher = distribution.elevated + distribution.high;

  let filterRecommendation: "not_needed" | "recommended" | "strongly_recommended" | "unknown" =
    "not_needed";
  let overall: "normal" | "review" | "alert" | "unknown" = "normal";

  if (distribution.high >= 0.2 || expectedSeverity >= 2.3) {
    filterRecommendation = "strongly_recommended";
    overall = "alert";
  } else if (elevatedOrHigher >= 0.35 || expectedSeverity >= 1.5) {
    filterRecommendation = "recommended";
    overall = "review";
  } else if (distribution.low === 0 && distribution.unknown > 0) {
    filterRecommendation = "unknown";
    overall = "unknown";
  }

  const leadRisk =
    distribution.high >= distribution.elevated &&
    distribution.high >= distribution.low
      ? "high"
      : distribution.elevated >= distribution.low
        ? "elevated"
        : distribution.low > 0
          ? "low"
          : "unknown";

  return {
    sampleCount: samples.length,
    nearestDistanceMiles: null,
    overall,
    leadRisk,
    filterRecommendation,
    averageLeadFirstDrawMgL: weightedAverage(
      samples.map((sample) => sample.leadFirstDraw.value),
      weights,
    ),
    averageLeadFlushOneToTwoMgL: weightedAverage(
      samples.map((sample) => sample.leadFlushOneToTwo.value),
      weights,
    ),
    averageLeadFlushFiveMgL: weightedAverage(
      samples.map((sample) => sample.leadFlushFive.value),
      weights,
    ),
    leadRiskDistribution: distribution,
  };
}

function compareNullableStrings(left: string | null, right: string | null) {
  return (left ?? "").localeCompare(right ?? "");
}

function compareNullableNumbers(left: number | null, right: number | null) {
  if (left == null && right == null) {
    return 0;
  }
  if (left == null) {
    return 1;
  }
  if (right == null) {
    return -1;
  }
  return left - right;
}

export function sortSamples(
  samples: WaterSample[],
  sortBy: SortField,
  sortDir: "asc" | "desc",
) {
  const direction = sortDir === "asc" ? 1 : -1;

  return [...samples].sort((left, right) => {
    let comparison = 0;

    if (NUMERIC_FIELDS.includes(sortBy as NumericFieldKey)) {
      comparison = compareNullableNumbers(
        left[sortBy as NumericFieldKey].value,
        right[sortBy as NumericFieldKey].value,
      );
    } else {
      switch (sortBy) {
        case "sampleDate":
          comparison = compareNullableStrings(left.sampleDate, right.sampleDate);
          break;
        case "zipCode":
          comparison = compareNullableStrings(left.zipCode, right.zipCode);
          break;
        case "borough":
          comparison = compareNullableStrings(left.borough, right.borough);
          break;
        case "sampleNumber":
        default:
          comparison = compareNullableStrings(left.sampleNumber, right.sampleNumber);
          break;
      }
    }

    if (comparison !== 0) {
      return comparison * direction;
    }

    return (left.sampleNumber ?? left.id).localeCompare(right.sampleNumber ?? right.id) * direction;
  });
}

function applyDateRange(samples: WaterSample[], dateFrom?: string, dateTo?: string) {
  return samples.filter((sample) => {
    if (dateFrom && sample.sampleDate && sample.sampleDate < dateFrom) {
      return false;
    }

    if (dateTo && sample.sampleDate && sample.sampleDate > dateTo) {
      return false;
    }

    if ((dateFrom || dateTo) && !sample.sampleDate) {
      return false;
    }

    return true;
  });
}

function applyContaminantFilters(
  samples: WaterSample[],
  contaminants: WaterSampleFilters["contaminants"],
) {
  if (!contaminants) {
    return samples;
  }

  return samples.filter((sample) =>
    Object.entries(contaminants).every(([field, range]) => {
      if (!range) {
        return true;
      }

      const value = sample[field as NumericFieldKey].value;
      if (value == null) {
        return false;
      }

      if (range.min != null && value < range.min) {
        return false;
      }

      if (range.max != null && value > range.max) {
        return false;
      }

      return true;
    }),
  );
}

function buildNearestMatches(
  query: Pick<WaterSampleFilters, "zipCode" | "borough" | "locationText">,
  samples: WaterSample[],
) {
  const matches: NearestMatch[] = [];

  if (query.zipCode) {
    matches.push(
      ...findNearestTextMatches(
        query.zipCode,
        samples.map((sample) => sample.zipCode).filter(Boolean) as string[],
        "zipCode",
      ),
    );
  }

  if (query.borough) {
    matches.push(
      ...findNearestTextMatches(
        query.borough,
        samples.map((sample) => sample.borough).filter(Boolean) as string[],
        "borough",
      ),
    );
  }

  if (query.locationText) {
    matches.push(
      ...findNearestTextMatches(
        query.locationText,
        samples.map((sample) => sample.location).filter(Boolean) as string[],
        "location",
      ),
    );
  }

  return matches.slice(0, 5);
}

function filterSamples(
  samples: WaterSample[],
  filters: Pick<
    WaterSampleFilters,
    "zipCode" | "borough" | "locationText" | "dateFrom" | "dateTo" | "contaminants"
  >,
) {
  let filtered = samples;
  const nearestMatches: NearestMatch[] = [];

  if (filters.zipCode) {
    const normalizedZip = normalizeText(filters.zipCode);
    filtered = filtered.filter((sample) => sample.zipCodeNormalized === normalizedZip);
  }

  if (filters.borough) {
    const normalizedBorough = normalizeText(filters.borough);
    filtered = filtered.filter((sample) => sample.boroughNormalized === normalizedBorough);
  }

  if (filters.locationText) {
    const normalizedLocation = normalizeText(filters.locationText);
    filtered = filtered.filter(
      (sample) =>
        sample.locationNormalized.includes(normalizedLocation) ||
        sample.boroughNormalized.includes(normalizedLocation) ||
        sample.zipCodeNormalized.includes(normalizedLocation),
    );
  }

  filtered = applyDateRange(filtered, filters.dateFrom, filters.dateTo);
  filtered = applyContaminantFilters(filtered, filters.contaminants);

  if (filtered.length === 0) {
    nearestMatches.push(...buildNearestMatches(filters, samples));
  }

  return { filtered, nearestMatches };
}

export async function getSampleByNumber(sampleNumber: string) {
  const dataset = await loadWaterDataset();
  return dataset.bySampleNumber.get(sampleNumber) ?? null;
}

export async function querySamples(
  filters: WaterSampleFilters,
): Promise<QueryResult<WaterSample>> {
  const dataset = await loadWaterDataset();
  const page = coercePage(filters.page);
  const pageSize = coercePageSize(filters.pageSize);
  const sortBy = filters.sortBy ?? "sampleDate";
  const sortDir = filters.sortDir ?? "desc";
  const { filtered, nearestMatches } = filterSamples(dataset.records, filters);

  const sorted = sortSamples(filtered, sortBy, sortDir);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = sorted.slice(start, start + pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    sortBy,
    sortDir,
    nearestMatches: nearestMatches.slice(0, 5),
  };
}

export async function querySamplesByZip(
  filters: WaterSampleFilters,
): Promise<NearbyQueryResult> {
  const zip = normalizeZipCode(filters.zip);

  if (!zip || !/^\d{5}$/.test(zip)) {
    throw new WaterQualityValidationError(
      "ZIP code must be a valid 5-digit NYC ZIP code.",
    );
  }

  const dataset = await loadWaterDataset();
  const matching = dataset.records.filter((sample) => sample.zipCode === zip);
  const sorted = sortSamples(matching, "sampleDate", "desc");
  const limited = sorted.slice(0, coerceLimit(filters.limit));
  const summarized = limited.map((sample) => ({ ...sample }));

  /*
   * Previous ZIP nearest path (kept for restore):
   * const origin = resolveZipCodeOrigin(filters.zip);
   * const nearestSamples = findNearestSamplesFromOrigin(
   *   dataset.records,
   *   origin.latitude,
   *   origin.longitude,
   *   filters.limit,
   * );
   */

  const nearbySummary = buildProbabilitySummary(matching);

  return {
    data: summarized,
    meta: {
      zip,
      count: summarized.length,
      total: matching.length,
      page: 1,
      pageSize: summarized.length,
      totalPages: summarized.length > 0 ? 1 : 0,
      sortBy: "sampleDate",
      sortDir: "desc",
      nearestMatches: [],
    },
    nearbySummary: {
      ...nearbySummary,
      sampleCount: matching.length,
    },
  };
}

export async function getRecentSamples(limit = 10) {
  const dataset = await loadWaterDataset();
  return sortSamples(dataset.records, "sampleDate", "desc").slice(0, limit);
}

export async function getSummary(filters: WaterSampleFilters): Promise<SummaryResult> {
  const dataset = await loadWaterDataset();
  const { filtered } = filterSamples(dataset.records, filters);
  return summarizeSamples(dataset.records, filtered);
}

export function serializeSample(sample: WaterSample) {
  return {
    ...sample,
    summary: getComputedSummaryForSample(sample),
    healthSummary: getHealthSummaryForSample(sample),
  };
}
