import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET as getSamplesRoute } from "@/app/api/water/samples/route";
import { summarizeNearbySamples } from "./geo";
import { normalizeWaterSample } from "./normalize";
import { buildProbabilitySummary } from "./service";
import { assertValidZipCode } from "./zip";

function buildRow(overrides: Record<string, string> = {}) {
  return {
    "Kit ID": "15123522",
    Borough: "Queens",
    Zipcode: "11356",
    "Date Collected": "02/04/2016",
    "Date Recieved": "02/05/2016 12:00:00 AM",
    "Lead First Draw (mg/L)": "0.003",
    "Lead 1-2 Minute Flush (mg/L)": "0.001",
    "Lead 5 Minute Flush (mg/L)": "",
    "Copper First Draw (mg/L)": "0.099",
    "Copper 1-2 Minute Flush (mg/L)": "",
    "Copper 5 minute Flush (mg/L)": "",
    ...overrides,
  };
}

test("accepts valid 5-digit ZIP values", () => {
  assert.equal(assertValidZipCode("11356"), "11356");
});

test("builds nearby lead summary from highest-risk sample", () => {
  const low = normalizeWaterSample(
    buildRow({
      "Kit ID": "1",
      "Lead First Draw (mg/L)": "0.002",
    }),
    2,
  );
  const high = normalizeWaterSample(
    buildRow({
      "Kit ID": "2",
      "Lead First Draw (mg/L)": "0.021",
    }),
    3,
  );

  const summary = summarizeNearbySamples([low, high]);
  assert.equal(summary.sampleCount, 2);
  assert.equal(summary.leadRisk, "high");
  assert.equal(summary.overall, "alert");
  assert.equal(summary.filterRecommendation, "strongly_recommended");
});

test("recency-weighted distribution favors the newer high-risk sample", () => {
  const olderLow = normalizeWaterSample(
    buildRow({
      "Kit ID": "11",
      "Date Collected": "01/01/2016",
      "Lead First Draw (mg/L)": "0.001",
    }),
    10,
  );
  const newerHigh = normalizeWaterSample(
    buildRow({
      "Kit ID": "12",
      "Date Collected": "01/01/2017",
      "Lead First Draw (mg/L)": "0.030",
    }),
    11,
  );

  const summary = buildProbabilitySummary([olderLow, newerHigh]);
  assert.ok((summary.leadRiskDistribution?.high ?? 0) > (summary.leadRiskDistribution?.low ?? 0));
  assert.equal(summary.filterRecommendation, "strongly_recommended");
  assert.equal(summary.overall, "alert");
});

test("invalid ZIP input returns clear route error", async () => {
  const request = new NextRequest("http://localhost:3000/api/water/samples?zip=abcde");
  const response = await getSamplesRoute(request);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "ZIP code must be a valid 5-digit NYC ZIP code.");
});
