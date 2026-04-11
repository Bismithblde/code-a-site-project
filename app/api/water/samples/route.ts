import { NextRequest } from "next/server";
import { WaterQualityValidationError } from "@/lib/water-quality/errors";
import { parseSampleFilters } from "@/lib/water-quality/http";
import {
  querySamples,
  querySamplesByZip,
  serializeSample,
} from "@/lib/water-quality/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const filters = parseSampleFilters(request.nextUrl.searchParams);

    if (filters.zip) {
      const result = await querySamplesByZip(filters);

      return Response.json({
        data: result.data.map(serializeSample),
        meta: result.meta,
        nearbySummary: result.nearbySummary,
        leadSummary: result.leadSummary,
        distribution: result.distribution,
        recentTests: result.recentTests.map(serializeSample),
        notes: result.notes,
        filters,
      });
    }

    const result = await querySamples(filters);

    return Response.json({
      data: result.data.map(serializeSample),
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        sortBy: result.sortBy,
        sortDir: result.sortDir,
        nearestMatches: result.nearestMatches,
      },
      filters,
    });
  } catch (error) {
    if (error instanceof WaterQualityValidationError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }

    const message =
      error instanceof Error ? error.message : "Failed to query water samples.";

    return Response.json({ error: message }, { status: 500 });
  }
}
