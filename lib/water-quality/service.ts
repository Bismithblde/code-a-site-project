import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  NUMERIC_FIELDS,
} from "./constants";
import {
  calculateDistanceMiles,
  hasCoordinates,
  roundDistanceMiles,
  summarizeNearbySamples,
} from "./geo";
import { findNearestTextMatches } from "./match";
import { normalizeText } from "./normalize";
import {
  getComputedSummaryForSample,
  getHealthSummaryForSample,
  summarizeSamples,
} from "./summary";
import { resolveZipCodeOrigin } from "./zip";
import type {
  NearbyQueryResult,
  NearbyWaterSample,
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

function coerceNearestLimit(value: number | undefined) {
  if (!value || Number.isNaN(value) || value < 1) {
    return 5;
  }

  return Math.min(Math.floor(value), 25);
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
        case "sampleSite":
          comparison = compareNullableStrings(left.sampleSite, right.sampleSite);
          break;
        case "location":
          comparison = compareNullableStrings(left.location, right.location);
          break;
        case "sampleClass":
          comparison = compareNullableStrings(left.sampleClass, right.sampleClass);
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

    return (left.sampleNumber ?? left.id).localeCompare(
      right.sampleNumber ?? right.id,
    ) * direction;
  });
}

function applyDateRange(
  samples: WaterSample[],
  dateFrom?: string,
  dateTo?: string,
) {
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
  query: Pick<WaterSampleFilters, "sampleSite" | "locationText">,
  samples: WaterSample[],
) {
  const matches: NearestMatch[] = [];

  if (query.sampleSite) {
    matches.push(
      ...findNearestTextMatches(
        query.sampleSite,
        samples.map((sample) => sample.sampleSite).filter(Boolean) as string[],
        "sampleSite",
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
    "sampleSite" | "locationText" | "sampleClass" | "dateFrom" | "dateTo" | "contaminants"
  >,
) {
  let filtered = samples;
  const nearestMatches: NearestMatch[] = [];

  if (filters.sampleSite) {
    const normalizedSite = normalizeText(filters.sampleSite);
    filtered = filtered.filter(
      (sample) => sample.sampleSiteNormalized === normalizedSite,
    );

    if (filtered.length === 0) {
      nearestMatches.push(
        ...findNearestTextMatches(
          filters.sampleSite,
          samples.map((sample) => sample.sampleSite).filter(Boolean) as string[],
          "sampleSite",
        ),
      );
    }
  }

  if (filters.locationText) {
    const normalizedLocation = normalizeText(filters.locationText);
    filtered = filtered.filter((sample) =>
      sample.locationNormalized.includes(normalizedLocation),
    );

    if (filtered.length === 0) {
      nearestMatches.push(
        ...findNearestTextMatches(
          filters.locationText,
          samples.map((sample) => sample.location).filter(Boolean) as string[],
          "location",
        ),
      );
    }
  }

  if (filters.sampleClass) {
    const normalizedClass = normalizeText(filters.sampleClass);
    filtered = filtered.filter(
      (sample) => sample.sampleClassNormalized === normalizedClass,
    );
  }

  filtered = applyDateRange(filtered, filters.dateFrom, filters.dateTo);
  filtered = applyContaminantFilters(filtered, filters.contaminants);

  if (filtered.length === 0 && nearestMatches.length === 0) {
    nearestMatches.push(...buildNearestMatches(filters, samples));
  }

  return { filtered, nearestMatches };
}

export async function getSampleByNumber(sampleNumber: string) {
  const dataset = await loadWaterDataset();
  return dataset.bySampleNumber.get(sampleNumber) ?? null;
}

export function findNearestSamplesFromOrigin(
  samples: WaterSample[],
  latitude: number,
  longitude: number,
  limit = 5,
) {
  const origin = { latitude, longitude };
  const nearestLimit = coerceNearestLimit(limit);

  return samples
    .filter(hasCoordinates)
    .map<NearbyWaterSample>((sample) => ({
      ...sample,
      distanceMiles: calculateDistanceMiles(origin, sample),
    }))
    .sort(
      (left, right) =>
        left.distanceMiles - right.distanceMiles ||
        (left.sampleNumber ?? left.id).localeCompare(right.sampleNumber ?? right.id),
    )
    .slice(0, nearestLimit);
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
  const origin = resolveZipCodeOrigin(filters.zip);
  const dataset = await loadWaterDataset();
  const nearestSamples = findNearestSamplesFromOrigin(
    dataset.records,
    origin.latitude,
    origin.longitude,
    filters.limit,
  );

  return {
    data: nearestSamples,
    meta: {
      zip: origin.zip,
      origin: {
        latitude: origin.latitude,
        longitude: origin.longitude,
      },
      count: nearestSamples.length,
      total: nearestSamples.length,
      page: 1,
      pageSize: nearestSamples.length,
      totalPages: nearestSamples.length > 0 ? 1 : 0,
      sortBy: "distanceMiles",
      sortDir: "asc",
      nearestMatches: [],
    },
    nearbySummary: summarizeNearbySamples(nearestSamples),
  };
}

export async function getRecentSamples(limit = 10) {
  const dataset = await loadWaterDataset();
  return sortSamples(dataset.records, "sampleDate", "desc").slice(0, limit);
}

export async function getSummary(
  filters: WaterSampleFilters,
): Promise<SummaryResult> {
  const dataset = await loadWaterDataset();
  const { filtered } = filterSamples(dataset.records, filters);

  return summarizeSamples(dataset.records, filtered);
}

export function serializeSample(sample: WaterSample | NearbyWaterSample) {
  return {
    ...sample,
    distanceMiles:
      "distanceMiles" in sample ? roundDistanceMiles(sample.distanceMiles) : undefined,
    summary: getComputedSummaryForSample(sample),
    healthSummary: getHealthSummaryForSample(sample),
  };
}
