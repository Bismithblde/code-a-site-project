import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET as getSamplesRoute } from "@/app/api/water/samples/route";
import {
  buildZipLeadQueryResult,
  computeLeadDistribution,
  computeLeadStats,
  getRecentTests,
} from "./service";
import { normalizeWaterSample } from "./normalize";
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

test("valid ZIP query builds lead summary, distribution, and recent tests", () => {
  const records = [
    normalizeWaterSample(buildRow({ "Kit ID": "1", "Date Collected": "01/01/2024", "Lead First Draw (mg/L)": "0.001" }), 2),
    normalizeWaterSample(buildRow({ "Kit ID": "2", "Date Collected": "01/03/2024", "Lead First Draw (mg/L)": "0.016" }), 3),
    normalizeWaterSample(buildRow({ "Kit ID": "3", "Date Collected": "01/02/2024", "Lead First Draw (mg/L)": "0.000" }), 4),
  ];
  const result = buildZipLeadQueryResult("11356", records, 2);

  assert.equal(result.meta.zip, "11356");
  assert.equal(result.meta.count, 2);
  assert.equal(result.meta.total, 3);
  assert.equal(result.leadSummary.sampleCount, 3);
  assert.equal(result.distribution.elevated.count, 1);
  assert.equal(result.recentTests.length, 2);
  assert.equal(result.recentTests[0]?.sampleNumber, "2");
  assert.ok(typeof result.notes === "string");
});

test("empty ZIP query still returns aggregate shape", () => {
  const result = buildZipLeadQueryResult("00000", [], 5);

  assert.equal(result.meta.zip, "00000");
  assert.equal(result.meta.total, 0);
  assert.equal(result.meta.count, 0);
  assert.equal(result.leadSummary.sampleCount, 0);
  assert.equal(result.distribution.notDetected.count, 0);
  assert.equal(result.recentTests.length, 0);
});

test("computeLeadStats returns median, max, and percentages", () => {
  const records = [
    normalizeWaterSample(buildRow({ "Kit ID": "1", "Date Collected": "01/01/2024", "Lead First Draw (mg/L)": "0.000" }), 2),
    normalizeWaterSample(buildRow({ "Kit ID": "2", "Date Collected": "01/03/2024", "Lead First Draw (mg/L)": "0.006" }), 3),
    normalizeWaterSample(buildRow({ "Kit ID": "3", "Date Collected": "01/02/2024", "Lead First Draw (mg/L)": "0.020" }), 4),
    normalizeWaterSample(buildRow({ "Kit ID": "4", "Date Collected": "01/04/2024", "Lead First Draw (mg/L)": "bad-value" }), 5),
  ];

  const summary = computeLeadStats(records);
  assert.equal(summary.sampleCount, 4);
  assert.equal(summary.mostRecentTestDate, "2024-01-04");
  assert.equal(summary.medianFirstDraw, 0.006);
  assert.equal(summary.maxFirstDraw, 0.02);
  assert.equal(summary.percentDetected, 50);
  assert.equal(summary.percentElevated, 25);
});

test("computeLeadDistribution groups buckets and handles invalid values", () => {
  const records = [
    normalizeWaterSample(buildRow({ "Kit ID": "10", "Lead First Draw (mg/L)": "0.000" }), 10),
    normalizeWaterSample(buildRow({ "Kit ID": "11", "Lead First Draw (mg/L)": "0.001" }), 11),
    normalizeWaterSample(buildRow({ "Kit ID": "12", "Lead First Draw (mg/L)": "0.015" }), 12),
    normalizeWaterSample(buildRow({ "Kit ID": "13", "Lead First Draw (mg/L)": "N/A" }), 13),
  ];

  const distribution = computeLeadDistribution(records);
  assert.equal(distribution.notDetected.count, 2);
  assert.equal(distribution.detected.count, 1);
  assert.equal(distribution.elevated.count, 1);
  assert.equal(distribution.notDetected.percent, 50);
  assert.equal(distribution.detected.percent, 25);
  assert.equal(distribution.elevated.percent, 25);
});

test("getRecentTests returns newest records first", () => {
  const oldest = normalizeWaterSample(
    buildRow({
      "Kit ID": "100",
      "Date Collected": "01/01/2020",
    }),
    20,
  );
  const newest = normalizeWaterSample(
    buildRow({
      "Kit ID": "101",
      "Date Collected": "01/01/2022",
    }),
    21,
  );
  const middle = normalizeWaterSample(
    buildRow({
      "Kit ID": "102",
      "Date Collected": "01/01/2021",
    }),
    22,
  );

  const recent = getRecentTests([middle, oldest, newest], 2);
  assert.deepEqual(
    recent.map((sample) => sample.sampleNumber),
    ["101", "102"],
  );
});

test("invalid ZIP input returns clear route error", async () => {
  const request = new NextRequest("http://localhost:3000/api/water/samples?zip=abcde");
  const response = await getSamplesRoute(request);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "ZIP code must be a valid 5-digit NYC ZIP code.");
});
