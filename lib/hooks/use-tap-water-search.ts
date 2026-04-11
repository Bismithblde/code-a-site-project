"use client";

import { useCallback, useReducer } from "react";
import { searchTapWaterSamples } from "@/lib/tap-water/api";
import {
  initialTapWaterState,
  tapWaterReducer,
} from "@/lib/tap-water/state";

type UseTapWaterSearchOptions = {
  limit?: number;
};

const ZIP_CODE_PATTERN = /^\d{5}$/;

export function useTapWaterSearch(options?: UseTapWaterSearchOptions) {
  const [state, dispatch] = useReducer(tapWaterReducer, initialTapWaterState);

  const setQuery = useCallback((query: string) => {
    dispatch({ type: "queryChanged", query });
  }, []);

  const submitSearch = useCallback(
    async (nextQuery?: string) => {
      const query = (nextQuery ?? state.query).trim();

      if (!query) {
        dispatch({
          type: "validationFailed",
          query,
          message: "Enter a ZIP code to search lead-at-the-tap samples.",
        });
        return;
      }

      const maybeZip = query.replace(/\s+/g, "");
      const looksLikeZipInput = maybeZip.length <= 5 && /^\d+$/.test(maybeZip);

      if (looksLikeZipInput && !ZIP_CODE_PATTERN.test(maybeZip)) {
        dispatch({
          type: "validationFailed",
          query,
          message: "ZIP code must be exactly 5 digits.",
        });
        return;
      }

      dispatch({ type: "searchStarted", query });

      try {
        const result = await searchTapWaterSamples(query, options?.limit ?? 5);
        dispatch({
          type: "searchSucceeded",
          query,
          data: result.data,
          meta: result.meta,
          recentTests: result.recentTests ?? result.data,
          zipTrends: result.zipTrends,
          nearbySummary: result.nearbySummary,
          leadSummary: result.leadSummary,
          distribution: result.distribution,
          notes: result.notes,
        });
      } catch (error) {
        dispatch({
          type: "searchFailed",
          query,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch ZIP lead results.",
        });
      }
    },
    [options?.limit, state.query],
  );

  return {
    state,
    setQuery,
    submitSearch,
  };
}
