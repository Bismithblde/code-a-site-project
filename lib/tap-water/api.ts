import { buildFallbackNearbySummary, getSearchModeFromInput } from "./format";
import type { TapWaterSearchResponse } from "./types";

type WaterApiSuccessResponse = {
  data: TapWaterSearchResponse["data"];
  meta: TapWaterSearchResponse["meta"];
  nearbySummary?: TapWaterSearchResponse["nearbySummary"];
  leadSummary?: TapWaterSearchResponse["leadSummary"];
  distribution?: TapWaterSearchResponse["distribution"];
  recentTests?: TapWaterSearchResponse["recentTests"];
  notes?: TapWaterSearchResponse["notes"];
};

type WaterApiErrorResponse = {
  error: string;
};

const DEFAULT_LIMIT = 5;

function buildSearchUrl(rawQuery: string, limit: number) {
  const trimmedQuery = rawQuery.trim();
  const mode = getSearchModeFromInput(trimmedQuery);
  const searchParams = new URLSearchParams();

  if (mode === "zip") {
    searchParams.set("zip", trimmedQuery);
    searchParams.set("limit", String(limit));
  } else {
    searchParams.set("location", trimmedQuery);
    searchParams.set("page", "1");
    searchParams.set("pageSize", String(limit));
    searchParams.set("sortBy", "sampleDate");
    searchParams.set("sortDir", "desc");
  }

  return `/api/water/samples?${searchParams.toString()}`;
}

function normalizeMeta(meta: Partial<TapWaterSearchResponse["meta"]>, count: number) {
  return {
    total: meta.total ?? count,
    page: meta.page ?? 1,
    pageSize: meta.pageSize ?? count,
    totalPages: meta.totalPages ?? (count > 0 ? 1 : 0),
    sortBy: meta.sortBy ?? "sampleDate",
    sortDir: meta.sortDir ?? "desc",
    zip: meta.zip,
    origin: meta.origin,
    count: meta.count ?? count,
  };
}

export async function searchTapWaterSamples(
  rawQuery: string,
  limit = DEFAULT_LIMIT,
): Promise<TapWaterSearchResponse> {
  const response = await fetch(buildSearchUrl(rawQuery, limit), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const body = (await response.json()) as WaterApiSuccessResponse | WaterApiErrorResponse;

  if (!response.ok) {
    const message =
      typeof (body as WaterApiErrorResponse).error === "string"
        ? (body as WaterApiErrorResponse).error
        : "Failed to fetch ZIP lead results.";
    throw new Error(message);
  }

  const successBody = body as WaterApiSuccessResponse;
  const data = Array.isArray(successBody.data) ? successBody.data : [];
  const meta = normalizeMeta(successBody.meta ?? {}, data.length);

  return {
    data,
    meta,
    nearbySummary: successBody.nearbySummary ?? buildFallbackNearbySummary(data),
    leadSummary: successBody.leadSummary,
    distribution: successBody.distribution,
    recentTests: successBody.recentTests ?? data,
    notes: successBody.notes,
  };
}
