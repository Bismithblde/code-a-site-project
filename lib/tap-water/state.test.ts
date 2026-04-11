import assert from "node:assert/strict";
import test from "node:test";
import { initialTapWaterState, tapWaterReducer } from "./state";

test("updates query and clears validation state", () => {
  const withValidationError = {
    ...initialTapWaterState,
    phase: "validation_error" as const,
    errorMessage: "ZIP code must be exactly 5 digits.",
  };

  const next = tapWaterReducer(withValidationError, {
    type: "queryChanged",
    query: "11356",
  });

  assert.equal(next.query, "11356");
  assert.equal(next.phase, "idle");
  assert.equal(next.errorMessage, null);
});

test("transitions through loading -> success", () => {
  const loading = tapWaterReducer(initialTapWaterState, {
    type: "searchStarted",
    query: "11356",
  });

  assert.equal(loading.phase, "loading");
  assert.equal(loading.submittedQuery, "11356");

  const success = tapWaterReducer(loading, {
    type: "searchSucceeded",
    query: "11356",
    data: [
      {
        id: "sample-1",
        sampleNumber: "1",
        sampleDate: "2024-01-01",
        sampleTime: null,
        sampledAt: "2024-01-01T08:00:00",
        dateReceived: "2024-01-02",
        zipCode: "11356",
        borough: "Queens",
        location: "Queens • 11356",
        latitude: null,
        longitude: null,
        leadFirstDraw: { raw: "0.018", value: 0.018, comparator: "eq", parseError: null },
        leadFlushOneToTwo: { raw: "0.004", value: 0.004, comparator: "eq", parseError: null },
        leadFlushFive: { raw: null, value: null, comparator: null, parseError: null },
        copperFirstDraw: { raw: "0.15", value: 0.15, comparator: "eq", parseError: null },
        copperFlushOneToTwo: { raw: null, value: null, comparator: null, parseError: null },
        copperFlushFive: { raw: null, value: null, comparator: null, parseError: null },
        summary: {
          leadRisk: "high",
          overall: "alert",
          filterRecommendation: "strongly_recommended",
        },
        healthSummary: {
          status: "alert",
          reasons: ["Lead is at or above the EPA 0.015 mg/L action level."],
        },
      },
    ],
    meta: {
      zip: "11356",
      count: 1,
      total: 1,
      page: 1,
      pageSize: 1,
      totalPages: 1,
      sortBy: "sampleDate",
      sortDir: "desc",
    },
    nearbySummary: {
      sampleCount: 1,
      nearestDistanceMiles: null,
      overall: "alert",
      leadRisk: "high",
      filterRecommendation: "strongly_recommended",
      leadRiskDistribution: {
        low: 0,
        elevated: 0,
        high: 1,
        unknown: 0,
      },
    },
  });

  assert.equal(success.phase, "success");
  assert.equal(success.data.length, 1);
  assert.equal(success.meta?.zip, "11356");
});

test("records failed request state", () => {
  const failed = tapWaterReducer(initialTapWaterState, {
    type: "searchFailed",
    query: "11356",
    message: "Failed to fetch nearby tap water samples.",
  });

  assert.equal(failed.phase, "error");
  assert.equal(failed.errorMessage, "Failed to fetch nearby tap water samples.");
});
