import test from "node:test";
import assert from "node:assert/strict";
import {
  getComputedSummaryForSample,
  getHealthSummaryForSample,
} from "./summary";
import { normalizeWaterSample } from "./normalize";
import { sortSamples } from "./service";

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

test("normalizes lead-at-the-tap row with ZIP and dates", () => {
  const sample = normalizeWaterSample(buildRow(), 2);

  assert.equal(sample.sampleNumber, "15123522");
  assert.equal(sample.zipCode, "11356");
  assert.equal(sample.borough, "Queens");
  assert.equal(sample.sampleDate, "2016-02-04");
  assert.equal(sample.dateReceived, "2016-02-05");
  assert.equal(sample.sampledAt, "2016-02-04");
});

test("high lead sample maps to alert and strong filter recommendation", () => {
  const sample = normalizeWaterSample(
    buildRow({
      "Lead First Draw (mg/L)": "0.021",
    }),
    2,
  );

  const computed = getComputedSummaryForSample(sample);
  const health = getHealthSummaryForSample(sample);

  assert.equal(computed.leadRisk, "high");
  assert.equal(computed.overall, "alert");
  assert.equal(computed.filterRecommendation, "strongly_recommended");
  assert.equal(health.status, "alert");
});

test("elevated lead sample maps to review and filter recommended", () => {
  const sample = normalizeWaterSample(
    buildRow({
      "Lead First Draw (mg/L)": "0.009",
    }),
    2,
  );

  const computed = getComputedSummaryForSample(sample);
  const health = getHealthSummaryForSample(sample);

  assert.equal(computed.leadRisk, "elevated");
  assert.equal(computed.overall, "review");
  assert.equal(computed.filterRecommendation, "recommended");
  assert.equal(health.status, "watch");
});

test("low lead sample maps to normal with no filter recommendation", () => {
  const sample = normalizeWaterSample(
    buildRow({
      "Lead First Draw (mg/L)": "0.001",
      "Lead 1-2 Minute Flush (mg/L)": "0.000",
    }),
    2,
  );

  const computed = getComputedSummaryForSample(sample);
  const health = getHealthSummaryForSample(sample);

  assert.equal(computed.leadRisk, "low");
  assert.equal(computed.overall, "normal");
  assert.equal(computed.filterRecommendation, "not_needed");
  assert.equal(health.status, "normal");
});

test("missing lead values maps to unknown", () => {
  const sample = normalizeWaterSample(
    buildRow({
      "Lead First Draw (mg/L)": "",
      "Lead 1-2 Minute Flush (mg/L)": "",
      "Lead 5 Minute Flush (mg/L)": "",
    }),
    2,
  );

  const computed = getComputedSummaryForSample(sample);
  const health = getHealthSummaryForSample(sample);

  assert.equal(computed.leadRisk, "unknown");
  assert.equal(computed.overall, "unknown");
  assert.equal(health.status, "unknown");
});

test("sorts by sampleDate descending", () => {
  const older = normalizeWaterSample(
    buildRow({
      "Kit ID": "100",
      "Date Collected": "01/03/2016",
    }),
    2,
  );
  const newer = normalizeWaterSample(
    buildRow({
      "Kit ID": "101",
      "Date Collected": "10/31/2019",
    }),
    3,
  );

  const sorted = sortSamples([older, newer], "sampleDate", "desc");
  assert.deepEqual(
    sorted.map((sample) => sample.sampleNumber),
    ["101", "100"],
  );
});
