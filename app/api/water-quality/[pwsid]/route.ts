import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getWaterSystemDetail, fetchLeadAndCopper, fetchViolationDetails } from "@/lib/epa/client";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pwsid: string }> },
) {
  const { pwsid } = await params;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const { allowed, retryAfterMs } = rateLimit(`epa-detail:${ip}`, { limit: 30, windowMs: 60_000 });

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  if (!pwsid || !/^[A-Z0-9]{4,12}$/i.test(pwsid)) {
    return NextResponse.json({ error: "Invalid PWSID format." }, { status: 400 });
  }

  try {
    const system = await getWaterSystemDetail(pwsid);

    if (!system) {
      return NextResponse.json({ error: "Water system not found." }, { status: 404 });
    }

    const populationServed = system.PopulationServedCount ? parseInt(system.PopulationServedCount, 10) : null;
    const hasHealthViolation = system.HealthFlag === "Yes";
    const isSeriousViolator = system.SeriousViolator === "Yes";
    const hasCurrentViolation = system.CurrVioFlag === "1";

    let status: "good" | "watch" | "alert" = "good";
    if (isSeriousViolator || hasHealthViolation) status = "alert";
    else if (hasCurrentViolation || parseInt(system.QtrsWithVio ?? "0", 10) > 4) status = "watch";

    const result: Record<string, unknown> = {
      system: {
        pwsid: system.PWSId,
        name: system.PWSName,
        type: system.PWSTypeDesc,
        source: system.PrimarySourceDesc,
        populationServed,
        state: system.StateCode,
        citiesServed: system.CitiesServed,
        countiesServed: system.CountiesServed,
        owner: system.OwnerDesc,
        serviceArea: system.ServiceAreaTypeDesc,
        status,
        isSeriousViolator,
        hasHealthViolation,
        hasCurrentViolation,
        leadViolation: !!(system.PbViol && system.PbViol !== "0"),
        copperViolation: !!(system.CuViol && system.CuViol !== "0"),
        quartersWithViolations: parseInt(system.QtrsWithVio ?? "0", 10),
        rulesViolated3yr: parseInt(system.RulesVio3yr ?? "0", 10),
        contaminantsInCurrentViolation: system.SDWAContaminantsInCurViol?.split(",").filter(Boolean) ?? [],
        contaminantsInViolation3yr: system.SDWAContaminantsInViol3yr?.split(",").filter(Boolean) ?? [],
        violationCategories: system.ViolationCategories?.split(",").filter(Boolean) ?? [],
        complianceHistory: system.SDWA3yrComplQtrsHistory,
        detailUrl: system.DfrUrl,
      },
      timestamp: new Date().toISOString(),
    };

    // Fetch detailed data in parallel
    const [leadCopper, violations] = await Promise.allSettled([
      fetchLeadAndCopper(pwsid),
      fetchViolationDetails(pwsid),
    ]);

    if (leadCopper.status === "fulfilled" && leadCopper.value) {
      (result as Record<string, unknown>).leadAndCopper = leadCopper.value;
    }
    if (violations.status === "fulfilled") {
      (result as Record<string, unknown>).violations = violations.value;
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch water system details." },
      { status: 502 },
    );
  }
}
