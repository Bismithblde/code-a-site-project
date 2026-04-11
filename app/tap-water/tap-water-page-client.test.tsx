import assert from "node:assert/strict";
import test from "node:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { setupDomEnvironment } from "@/lib/test/setup-dom";
import { initialTapWaterState, type TapWaterPageState } from "@/lib/tap-water/state";
import { TapWaterPageClient } from "./tap-water-page-client";

const sampleRecord = {
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
    assert.ok(view.getByText("Tap Water Quality Lookup"));
    assert.ok(
      view.getByText(
        "Enter a ZIP code to load your lead risk summary and charts.",
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

test("renders carousel summary and supports next/back navigation", async () => {
  const teardown = setupDomEnvironment();

  try {
    const view = render(
      <TapWaterPageClient
        controller={makeController({
          query: "11356",
          phase: "success",
          data: [sampleRecord],
          recentTests: [sampleRecord],
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
            nearestDistanceMiles: 0.3,
            overall: "alert",
            leadRisk: "high",
            filterRecommendation: "strongly_recommended",
          },
          leadSummary: {
            sampleCount: 1,
            mostRecentTestDate: "2015-01-03",
            medianFirstDraw: 0.019,
            maxFirstDraw: 0.019,
            percentDetected: 100,
            percentElevated: 100,
          },
          distribution: {
            notDetected: { count: 0, percent: 0 },
            detected: { count: 0, percent: 0 },
            elevated: { count: 1, percent: 100 },
          },
          notes: "Lead results vary by home and plumbing conditions.",
        })}
      />,
    );

    assert.ok(view.getByText("Tap Water Quality Lookup"));
    assert.ok(view.getByText("We tested 1 samples. 100.0% have lead. Median first draw: 0.019 mg/L."));
    assert.ok(view.getByText("Details"));
    assert.ok(view.getByText("Recent Tests"));

    fireEvent.click(view.getByRole("button", { name: "Next summary page" }));
    assert.ok(view.getByText("Use a lead-certified filter now."));

    fireEvent.click(view.getByRole("button", { name: "Next summary page" }));
    assert.ok(view.getByText("Lead Distribution"));

    fireEvent.click(view.getByRole("button", { name: "Previous summary page" }));
    assert.ok(view.getByText("Use a lead-certified filter now."));
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
          recentTests: [],
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
          leadSummary: {
            sampleCount: 0,
            mostRecentTestDate: null,
            medianFirstDraw: null,
            maxFirstDraw: null,
            percentDetected: 0,
            percentElevated: 0,
          },
          distribution: {
            notDetected: { count: 0, percent: 0 },
            detected: { count: 0, percent: 0 },
            elevated: { count: 0, percent: 0 },
          },
          notes: "Lead results vary by home and plumbing conditions.",
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

test("renders carousel dots for summary pages", async () => {
  const teardown = setupDomEnvironment();

  try {
    const view = render(
      <TapWaterPageClient
        controller={makeController({
          query: "11356",
          phase: "success",
          data: [],
          recentTests: [],
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
          leadSummary: {
            sampleCount: 0,
            mostRecentTestDate: null,
            medianFirstDraw: null,
            maxFirstDraw: null,
            percentDetected: 0,
            percentElevated: 0,
          },
          distribution: {
            notDetected: { count: 0, percent: 0 },
            detected: { count: 0, percent: 0 },
            elevated: { count: 0, percent: 0 },
          },
          notes: "Lead results vary by home and plumbing conditions.",
        })}
      />,
    );

    assert.equal(view.getAllByRole("button", { name: /Go to summary page/ }).length, 3);
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
