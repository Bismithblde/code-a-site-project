import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { searchWaterSystems, type EchoWaterSystem } from "@/lib/epa/client";
import { type CoverageCoordinate } from "@/lib/epa/coverage-map";
import { resolveCoverageCoordinate } from "@/lib/epa/coverage-map.server";

export const dynamic = "force-dynamic";

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const debugFailures = new Map<
  string,
  {
    createdAt: string;
    query: { state: string | undefined; county: string | undefined; city: string | undefined };
    message: string;
    epa: { status: number | null; code: string | null; url: string | null; bodySnippet: string | null } | null;
  }
>();
const DEBUG_FAILURE_TTL_MS = 60 * 60 * 1000;

type EpaErrorLike = {
  status?: number | null;
  code?: string | null;
  url?: string | null;
  bodySnippet?: string | null;
};

function asEpaErrorLike(error: unknown): EpaErrorLike | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as EpaErrorLike;
  const hasKnownField =
    typeof candidate.status === "number" ||
    typeof candidate.code === "string" ||
    typeof candidate.url === "string" ||
    typeof candidate.bodySnippet === "string";
  return hasKnownField ? candidate : null;
}

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function setCache(key: string, data: unknown) {
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) { if (now > v.expiresAt) cache.delete(k); }
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function pruneDebugFailures() {
  const cutoff = Date.now() - DEBUG_FAILURE_TTL_MS;
  for (const [debugId, payload] of debugFailures) {
    const created = Date.parse(payload.createdAt);
    if (!Number.isFinite(created) || created < cutoff) {
      debugFailures.delete(debugId);
    }
  }

  while (debugFailures.size > 300) {
    const first = debugFailures.keys().next().value as string | undefined;
    if (!first) break;
    debugFailures.delete(first);
  }
}

function makeDebugId() {
  return `wq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Normalize ECHO data into a cleaner shape for the frontend */
function normalizeSystem(s: EchoWaterSystem, coordinate: CoverageCoordinate) {
  const populationServed = s.PopulationServedCount ? parseInt(s.PopulationServedCount, 10) : null;
  const qtrsWithVio = parseInt(s.QtrsWithVio ?? "0", 10);
  const rulesVio3yr = parseInt(s.RulesVio3yr ?? "0", 10);
  const hasHealthViolation = s.HealthFlag === "Yes";
  const isSeriousViolator = s.SeriousViolator === "Yes";
  const hasCurrentViolation = s.CurrVioFlag === "1";
  const leadViolation = s.PbViol && s.PbViol !== "0" && s.PbViol !== "";
  const copperViolation = s.CuViol && s.CuViol !== "0" && s.CuViol !== "";

  let status: "good" | "watch" | "alert" = "good";
  if (isSeriousViolator || hasHealthViolation) status = "alert";
  else if (hasCurrentViolation || qtrsWithVio > 4) status = "watch";

  return {
    pwsid: s.PWSId,
    name: s.PWSName,
    type: s.PWSTypeDesc,
    source: s.PrimarySourceDesc,
    populationServed,
    state: s.StateCode,
    citiesServed: s.CitiesServed,
    countiesServed: s.CountiesServed,
    owner: s.OwnerDesc,
    serviceArea: s.ServiceAreaTypeDesc,
    status,
    isSeriousViolator,
    hasHealthViolation,
    hasCurrentViolation,
    leadViolation: !!leadViolation,
    copperViolation: !!copperViolation,
    quartersWithViolations: qtrsWithVio,
    rulesViolated3yr: rulesVio3yr,
    contaminantsInCurrentViolation: s.SDWAContaminantsInCurViol?.split(",").filter(Boolean) ?? [],
    contaminantsInViolation3yr: s.SDWAContaminantsInViol3yr?.split(",").filter(Boolean) ?? [],
    violationCategories: s.ViolationCategories?.split(",").filter(Boolean) ?? [],
    complianceHistory: s.SDWA3yrComplQtrsHistory,
    detailUrl: s.DfrUrl,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    coordinateSource: coordinate.source,
    coordinateLabel: coordinate.label,
  };
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const { allowed, retryAfterMs } = rateLimit(`epa-search:${ip}`, { limit: 30, windowMs: 60_000 });

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
          "X-RateLimit-Reason": "app-rate-limit",
        },
      },
    );
  }

  const { searchParams } = request.nextUrl;
  const debugIdLookup = searchParams.get("debugId")?.trim();

  if (debugIdLookup) {
    pruneDebugFailures();
    const payload = debugFailures.get(debugIdLookup);
    if (!payload) {
      return NextResponse.json({ error: "Debug ID not found or expired.", debugId: debugIdLookup }, { status: 404 });
    }

    return NextResponse.json({ debugId: debugIdLookup, ...payload });
  }

  const state = searchParams.get("state")?.trim().toUpperCase();
  const county = searchParams.get("county")?.trim();
  const city = searchParams.get("city")?.trim();

  if (!state) {
    return NextResponse.json(
      { error: "Provide a ?state=NY query parameter. Optionally add &county=NEW+YORK or &city=BROOKLYN." },
      { status: 400 },
    );
  }

  if (!/^[A-Z]{2}$/.test(state)) {
    return NextResponse.json({ error: "State must be a 2-letter code (e.g. NY, CA)." }, { status: 400 });
  }

  const cacheKey = `${state}:${county ?? ""}:${city ?? ""}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    let fallbackApplied = false;
    let systems: EchoWaterSystem[];

    try {
      systems = await searchWaterSystems({ state, county: county ?? undefined, city: city ?? undefined, limit: 25 });
    } catch (error) {
      const epaError = asEpaErrorLike(error);
      const hasNarrowFilters = Boolean(county || city);
      const isUpstreamFilterFailure = Boolean(epaError && epaError.status && epaError.status >= 400 && epaError.status < 500);

      if (hasNarrowFilters && isUpstreamFilterFailure) {
        systems = await searchWaterSystems({ state, limit: 25 });
        fallbackApplied = true;
      } else {
        throw error;
      }
    }

    const sortedSystems = systems
      .map((system) => {
        const populationServed = system.PopulationServedCount ? parseInt(system.PopulationServedCount, 10) : null;
        const qtrsWithVio = parseInt(system.QtrsWithVio ?? "0", 10);
        const hasHealthViolation = system.HealthFlag === "Yes";
        const isSeriousViolator = system.SeriousViolator === "Yes";
        const hasCurrentViolation = system.CurrVioFlag === "1";

        let status: "good" | "watch" | "alert" = "good";
        if (isSeriousViolator || hasHealthViolation) status = "alert";
        else if (hasCurrentViolation || qtrsWithVio > 4) status = "watch";

        return {
          system,
          status,
          populationServed,
        };
      })
      .sort((left, right) => {
        const priority = { alert: 0, watch: 1, good: 2 };
        const diff = priority[left.status] - priority[right.status];
        if (diff !== 0) return diff;
        return (right.populationServed ?? 0) - (left.populationServed ?? 0);
      });

    const normalized: Array<ReturnType<typeof normalizeSystem>> = [];
    for (const [index, entry] of sortedSystems.entries()) {
      normalized.push(
        normalizeSystem(
          entry.system,
          await resolveCoverageCoordinate(entry.system, index, sortedSystems.length),
        ),
      );
    }

    const result = {
      systems: normalized,
      query: { state, county, city },
      fallbackApplied,
      totalSystems: normalized.length,
      timestamp: new Date().toISOString(),
    };

    setCache(cacheKey, result);

    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS", "Cache-Control": "public, s-maxage=86400" },
    });
  } catch (error) {
    const debugId = makeDebugId();
    const epaError = asEpaErrorLike(error);
    const debugPayload = {
      createdAt: new Date().toISOString(),
      query: { state, county, city },
      message: error instanceof Error ? error.message : "unknown error",
      epa: epaError
        ? {
            status: epaError.status ?? null,
            code: epaError.code ?? null,
            url: epaError.url ?? null,
            bodySnippet: epaError.bodySnippet ?? null,
          }
        : null,
    } as const;

    pruneDebugFailures();
    debugFailures.set(debugId, debugPayload);

    console.error("[water-quality search failed]", JSON.stringify({ debugId, ip, ...debugPayload }));

    if (epaError?.status === 429) {
      return NextResponse.json(
        {
          error: "EPA is rate limiting requests right now. Please retry in about a minute.",
          debugId,
        },
        { status: 503, headers: { "X-Debug-Id": debugId, "X-Upstream-Status": "429" } },
      );
    }

    if (epaError?.status === 403) {
      return NextResponse.json(
        {
          error: "EPA ECHO is currently denying requests from this environment (403). Please try again later.",
          debugId,
        },
        { status: 503, headers: { "X-Debug-Id": debugId, "X-Upstream-Status": "403" } },
      );
    }

    if (epaError?.code === "TIMEOUT") {
      return NextResponse.json(
        { error: "EPA lookup timed out. Please try again.", debugId },
        { status: 504, headers: { "X-Debug-Id": debugId } },
      );
    }

    const diagnostics =
      process.env.NODE_ENV === "production"
        ? undefined
        : {
            message: debugPayload.message,
            epa: debugPayload.epa,
          };

    return NextResponse.json(
      { error: "Failed to query EPA water quality data. Please try again.", debugId, diagnostics },
      { status: 502, headers: { "X-Debug-Id": debugId } },
    );
  }
}
