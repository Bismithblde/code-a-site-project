import type { TapWaterMeta, TapWaterSample, TapWaterSearchResponse } from "./types";

export type TapWaterPhase =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "validation_error"
  | "error";

export type TapWaterPageState = {
  query: string;
  submittedQuery: string | null;
  phase: TapWaterPhase;
  data: TapWaterSample[];
  recentTests: TapWaterSample[];
  meta: TapWaterMeta | null;
  leadSummary: TapWaterSearchResponse["leadSummary"] | null;
  distribution: TapWaterSearchResponse["distribution"] | null;
  notes: string | null;
  errorMessage: string | null;
};

export type TapWaterAction =
  | { type: "queryChanged"; query: string }
  | { type: "searchStarted"; query: string }
  | {
      type: "searchSucceeded";
      query: string;
      data: TapWaterSample[];
      meta: TapWaterMeta;
      recentTests: TapWaterSample[];
      leadSummary: TapWaterSearchResponse["leadSummary"];
      distribution: TapWaterSearchResponse["distribution"];
      notes: string | undefined;
    }
  | { type: "validationFailed"; query: string; message: string }
  | { type: "searchFailed"; query: string; message: string };

export const initialTapWaterState: TapWaterPageState = {
  query: "",
  submittedQuery: null,
  phase: "idle",
  data: [],
  recentTests: [],
  meta: null,
  leadSummary: null,
  distribution: null,
  notes: null,
  errorMessage: null,
};

export function tapWaterReducer(
  state: TapWaterPageState,
  action: TapWaterAction,
): TapWaterPageState {
  switch (action.type) {
    case "queryChanged":
      return {
        ...state,
        query: action.query,
        errorMessage: state.phase === "validation_error" ? null : state.errorMessage,
        phase: state.phase === "validation_error" ? "idle" : state.phase,
      };
    case "searchStarted":
      return {
        ...state,
        submittedQuery: action.query,
        phase: "loading",
        errorMessage: null,
      };
    case "searchSucceeded":
      return {
        ...state,
        submittedQuery: action.query,
        phase: action.recentTests.length === 0 ? "empty" : "success",
        data: action.data,
        recentTests: action.recentTests,
        meta: action.meta,
        leadSummary: action.leadSummary ?? null,
        distribution: action.distribution ?? null,
        notes: action.notes ?? null,
        errorMessage: null,
      };
    case "validationFailed":
      return {
        ...state,
        submittedQuery: action.query,
        phase: "validation_error",
        errorMessage: action.message,
      };
    case "searchFailed":
      return {
        ...state,
        submittedQuery: action.query,
        phase: "error",
        errorMessage: action.message,
      };
    default:
      return state;
  }
}
