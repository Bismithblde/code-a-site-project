import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET as getSamplesRoute } from "@/app/api/water/samples/route";
import { summarizeNearbySamples } from "./geo";
import { normalizeWaterSample } from "./normalize";
import { findNearestSamplesFromOrigin } from "./service";
import { resolveZipCodeOrigin } from "./zip";

function buildRow(overrides: Record<string, string> = {}) {
  return {
    "Sample Number": "32317",
    "Sample Date": "2015-01-03T00:00:00.000",
    "Sample Time": "8:23",
    "Sample Site": "77050",
    "Sample class": "Compliance",
    Location: "Queens Village",
    "Residual Free Chlorine (mg/L)": "0.53",
    "Turbidity (NTU)": "0.62",
    "Fluoride (mg/L)": "",
    "Coliform (Quanti-Tray) (MPN /100mL)": "<1",
    "E.coli(Quanti-Tray) (MPN/100mL)": "<1",
    ...overrides,
  };
}

function buildSample(
  sampleNumber: string,
  latitude: number | null,
  longitude: number | null,
  overrides: Record<string, string> = {},
) {
  const sample = normalizeWaterSample(
    buildRow({
      "Sample Number": sampleNumber,
      ...overrides,
    }),
    Number(sampleNumber),
  );

  sample.latitude = latitude;
  sample.longitude = longitude;
  return sample;
}

test("resolves a supported NYC ZIP code to centroid coordinates", () => {
  assert.deepEqual(resolveZipCodeOrigin("11356"), {
    zip: "11356",
    latitude: 40.7851,
    longitude: -73.846,
  });
});

test("sorts nearest samples by ascending distance and skips missing coordinates", () => {
  const nearest = buildSample("1", 40.7809, -73.8452);
  const farther = buildSample("2", 40.7300, -73.8000);
  const missing = buildSample("3", null, null);

  const results = findNearestSamplesFromOrigin(
    [farther, missing, nearest],
    40.7851,
    -73.8460,
    5,
  );

  assert.deepEqual(
    results.map((sample) => sample.sampleNumber),
    ["1", "2"],
  );
  assert.ok(results[0].distanceMiles < results[1].distanceMiles);
});

test("builds nearby summary from the worst statuses in the selected samples", () => {
  const reviewSample = buildSample("10", 40.7809, -73.8452, {
    "Residual Free Chlorine (mg/L)": "0.10",
  });
  const alertSample = buildSample("11", 40.7810, -73.8451, {
    "E.coli(Quanti-Tray) (MPN/100mL)": "1",
  });

  const ranked = findNearestSamplesFromOrigin(
    [reviewSample, alertSample],
    40.7851,
    -73.8460,
    5,
  );
  const summary = summarizeNearbySamples(ranked);

  assert.equal(summary.sampleCount, 2);
  assert.equal(summary.overall, "alert");
  assert.equal(summary.bacteria, "e_coli_detected");
  assert.equal(summary.disinfection, "low_review");
  assert.ok(summary.nearestDistanceMiles != null);
});

test("limits ZIP-style nearest searches to the requested count", () => {
  const samples = [
    buildSample("20", 40.7850, -73.8460),
    buildSample("21", 40.7840, -73.8450),
    buildSample("22", 40.7830, -73.8440),
  ];

  const result = findNearestSamplesFromOrigin(samples, 40.7851, -73.8460, 2);

  assert.equal(result.length, 2);
  assert.ok(result[0].distanceMiles <= result[1].distanceMiles);
});

test("returns a clear route error for an invalid ZIP code", async () => {
  const request = new NextRequest("http://localhost:3000/api/water/samples?zip=abcde");
  const response = await getSamplesRoute(request);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "ZIP code must be a valid 5-digit NYC ZIP code.");
});
