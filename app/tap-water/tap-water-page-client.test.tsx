import assert from "node:assert/strict";
import test from "node:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { setupDomEnvironment } from "@/lib/test/setup-dom";
import { initialTapWaterState, type TapWaterPageState } from "@/lib/tap-water/state";
import { TapWaterPageClient } from "./tap-water-page-client";

const successPayload = {
  data: [
    {
      id: "sample-77050",
      sampleNumber: "77050",
      sampleDate: "2015-01-03",
      sampleTime: null,
      sampledAt: "2015-01-03T11:32:00",
      dateReceived: "2015-01-04",
      zipCode: "11356",
      borough: "Queens",
      location: "Queens • 11356",
      latitude: null,
      longitude: null,
      leadFirstDraw: { raw: "0.019", value: 0.019, comparator: "eq", parseError: null },
      leadFlushOneToTwo: { raw: "0.004", value: 0.004, comparator: "eq", parseError: null },
      leadFlushFive: { raw: null, value: null, comparator: null, parseError: null },
      copperFirstDraw: { raw: "0.313", value: 0.313, comparator: "eq", parseError: null },
      copperFlushOneToTwo: { raw: "0.043", value: 0.043, comparator: "eq", parseError: null },
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
    averageLeadFirstDrawMgL: 0.019,
    leadRiskDistribution: {
      low: 0,
      elevated: 0,
      high: 1,
      unknown: 0,
    },
  },
};

function makeController(
  overrides: Partial<TapWaterPageState> = {},
  handlers?: {
    setQuery?: (query: string) => void;
    submitSearch?: () => Promise<void>;
  },
) {
  const state: TapWaterPageState = {
    ...initialTapWaterState,
    ...overrides,
  };

  return {
    state,
    setQuery: handlers?.setQuery ?? (() => {}),
    submitSearch: handlers?.submitSearch ?? (async () => {}),
  };
}

test("renders initial idle state", async () => {
  const teardown = setupDomEnvironment();

  try {
    const view = render(<TapWaterPageClient controller={makeController()} />);
    assert.ok(view.getByText("NYC Tap Water Lookup"));
    assert.ok(
      view.getByText(
        "Enter a ZIP code to see lead results and a filter recommendation.",
      ),
    );
  } finally {
    cleanup();
    teardown();
  }
});

test("shows validation error for invalid ZIP-like input", async () => {
  const teardown = setupDomEnvironment();

  try {
    const view = render(
      <TapWaterPageClient
        controller={makeController({
          query: "1135",
          phase: "validation_error",
          errorMessage: "ZIP code must be exactly 5 digits.",
        })}
      />,
    );
    assert.ok(view.getByText("ZIP code must be exactly 5 digits."));
  } finally {
    cleanup();
    teardown();
  }
});

test("shows loading state while request is pending", async () => {
  const teardown = setupDomEnvironment();

  try {
    const view = render(
      <TapWaterPageClient
        controller={makeController({
          query: "11356",
          phase: "loading",
        })}
      />,
    );
    assert.ok(view.getByRole("button", { name: "Searching..." }));
  } finally {
    cleanup();
    teardown();
  }
});

test("renders nearby summary and sample list on success", async () => {
  const teardown = setupDomEnvironment();

  try {
    const view = render(
      <TapWaterPageClient
        controller={makeController({
          query: "11356",
          phase: "success",
          data: successPayload.data,
          meta: successPayload.meta,
          nearbySummary: successPayload.nearbySummary,
        })}
      />,
    );

    assert.ok(view.getByText("Nearby Summary"));
    assert.ok(view.getByText("Nearby Samples"));
    assert.ok(view.getByText("Overall: Alert"));
    assert.ok(view.getByText("ZIP 11356"));
    assert.ok(view.getAllByText("Filter Strongly Recommended").length >= 1);
    assert.ok(view.getByText("Should Buy Filter"));
    assert.ok(view.getByText("Yes"));
    assert.ok(view.getAllByText("0.019 mg/L").length >= 1);
    assert.ok(view.getByText("100%"));
  } finally {
    cleanup();
    teardown();
  }
});

test("renders empty state when no samples are returned", async () => {
  const teardown = setupDomEnvironment();

  try {
    const view = render(
      <TapWaterPageClient
        controller={makeController({
          query: "11356",
          phase: "empty",
          data: [],
          meta: {
            zip: "11356",
            count: 0,
            total: 0,
            page: 1,
            pageSize: 0,
            totalPages: 0,
            sortBy: "sampleDate",
            sortDir: "desc",
            nearestMatches: [],
          },
          nearbySummary: {
            sampleCount: 0,
            nearestDistanceMiles: null,
            overall: "unknown",
            leadRisk: "unknown",
            filterRecommendation: "unknown",
            averageLeadFirstDrawMgL: null,
            leadRiskDistribution: {
              low: 0,
              elevated: 0,
              high: 0,
              unknown: 0,
            },
          },
        })}
      />,
    );

    assert.ok(
      view.getByText(
        "No lead-at-the-tap samples were found for this ZIP code yet.",
      ),
    );
  } finally {
    cleanup();
    teardown();
  }
});

test("renders backend error state and retry button", async () => {
  const teardown = setupDomEnvironment();

  try {
    const view = render(
      <TapWaterPageClient
        controller={makeController({
          query: "99999",
          phase: "error",
          errorMessage: "ZIP code must be a valid 5-digit NYC ZIP code.",
        })}
      />,
    );

    assert.ok(view.getByText("ZIP code must be a valid 5-digit NYC ZIP code."));
    assert.ok(view.getByRole("button", { name: "Retry" }));
  } finally {
    cleanup();
    teardown();
  }
});

test("supports search submit interactions", async () => {
  const teardown = setupDomEnvironment();

  try {
    let submitCalls = 0;
    const submitSearch = async () => {
      submitCalls += 1;
    };

    const view = render(
      <TapWaterPageClient
        controller={makeController(
          {
            query: "11356",
          },
          { submitSearch },
        )}
      />,
    );

    fireEvent.click(view.getByRole("button", { name: "Search" }));
    fireEvent.submit(
      view.getByPlaceholderText("Enter ZIP code").closest("form") as HTMLFormElement,
    );

    assert.equal(submitCalls, 2);
  } finally {
    cleanup();
    teardown();
  }
});
