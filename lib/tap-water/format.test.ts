import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFallbackNearbySummary,
  formatDistanceMiles,
  formatFilterRecommendationLabel,
  formatLeadRiskLabel,
  formatLeadValue,
  formatProbability,
  getSearchModeFromInput,
  shouldBuyFilter,
} from "./format";
import type { TapWaterSample } from "./types";

function buildSample(
  id: string,
  summary: TapWaterSample["summary"],
  leadValue: number | null,
  distanceMiles?: number,
): TapWaterSample {
  return {
    id,
    sampleNumber: id,
    sampleDate: "2024-01-01",
    sampleTime: null,
    sampledAt: "2024-01-01T08:00:00",
    dateReceived: "2024-01-02",
    zipCode: "11356",
    borough: "Queens",
    location: "Queens • 11356",
    latitude: null,
    longitude: null,
    leadFirstDraw: { raw: null, value: leadValue, comparator: null, parseError: null },
    leadFlushOneToTwo: { raw: null, value: null, comparator: null, parseError: null },
    leadFlushFive: { raw: null, value: null, comparator: null, parseError: null },
    copperFirstDraw: { raw: null, value: null, comparator: null, parseError: null },
    copperFlushOneToTwo: { raw: null, value: null, comparator: null, parseError: null },
    copperFlushFive: { raw: null, value: null, comparator: null, parseError: null },
    distanceMiles,
    summary,
    healthSummary: {
      status: "normal",
      reasons: [],
    },
  };
}

test("detects zip and location search modes", () => {
  assert.equal(getSearchModeFromInput("11356"), "zip");
  assert.equal(getSearchModeFromInput("Queens"), "location");
});

test("formats lead and distance values", () => {
  assert.equal(formatLeadValue(0.0123), "0.012 mg/L");
  assert.equal(formatLeadValue(null), "N/A");
  assert.equal(formatProbability(0.42), "42%");
  assert.equal(formatProbability(null), "N/A");
  assert.equal(formatDistanceMiles(1.26), "1.3 mi");
  assert.equal(formatDistanceMiles(null), "Distance unavailable");
});

test("formats lead labels and filter recommendation labels", () => {
  assert.equal(formatLeadRiskLabel("elevated"), "Elevated");
  assert.equal(formatFilterRecommendationLabel("strongly_recommended"), "Filter Strongly Recommended");
  assert.equal(shouldBuyFilter("recommended"), true);
  assert.equal(shouldBuyFilter("not_needed"), false);
});

test("builds fallback nearby summary from lead/filter severities", () => {
  const summary = buildFallbackNearbySummary([
    buildSample(
      "1",
      {
        leadRisk: "low",
        overall: "normal",
        filterRecommendation: "not_needed",
      },
      0.002,
      2.3,
    ),
    buildSample(
      "2",
      {
        leadRisk: "high",
        overall: "alert",
        filterRecommendation: "strongly_recommended",
      },
      0.022,
      1.2,
    ),
  ]);

  assert.equal(summary.sampleCount, 2);
  assert.equal(summary.overall, "alert");
  assert.equal(summary.leadRisk, "high");
  assert.equal(summary.filterRecommendation, "strongly_recommended");
  assert.equal(summary.nearestDistanceMiles, 1.2);
});
