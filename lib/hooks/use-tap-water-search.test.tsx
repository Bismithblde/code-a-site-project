import assert from "node:assert/strict";
import test from "node:test";
import { act, renderHook, waitFor } from "@testing-library/react";
import { setupDomEnvironment } from "@/lib/test/setup-dom";
import { useTapWaterSearch } from "./use-tap-water-search";

test("rejects invalid short ZIP input before request", async () => {
  const teardown = setupDomEnvironment();

  try {
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      throw new Error("should not reach fetch");
    }) as typeof fetch;

    const { result } = renderHook(() => useTapWaterSearch());

    act(() => {
      result.current.setQuery("1135");
    });

    await act(async () => {
      await result.current.submitSearch();
    });

    assert.equal(called, false);
    assert.equal(result.current.state.phase, "validation_error");
  } finally {
    teardown();
  }
});

test("loads successful ZIP search response", async () => {
  const teardown = setupDomEnvironment();

  try {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
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
              leadFirstDraw: { raw: "0.016", value: 0.016, comparator: "eq", parseError: null },
              leadFlushOneToTwo: { raw: "0.004", value: 0.004, comparator: "eq", parseError: null },
              leadFlushFive: { raw: null, value: null, comparator: null, parseError: null },
              copperFirstDraw: { raw: "0.17", value: 0.17, comparator: "eq", parseError: null },
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
            nearestMatches: [],
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
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;

    const { result } = renderHook(() => useTapWaterSearch());

    act(() => {
      result.current.setQuery("11356");
    });

    await act(async () => {
      await result.current.submitSearch();
    });

    await waitFor(() => {
      assert.equal(result.current.state.phase, "success");
      assert.equal(result.current.state.data.length, 1);
      assert.equal(result.current.state.meta?.zip, "11356");
    });
  } finally {
    teardown();
  }
});
