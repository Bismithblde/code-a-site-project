import type { GeoPoint, NearbySummary, NearbyWaterSample, WaterSample } from "./types";
import { getComputedSummaryForSample } from "./summary";

const EARTH_RADIUS_MILES = 3958.7613;

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceMiles(origin: GeoPoint, target: GeoPoint) {
  const latitudeDelta = degreesToRadians(target.latitude - origin.latitude);
  const longitudeDelta = degreesToRadians(target.longitude - origin.longitude);
  const originLatitude = degreesToRadians(origin.latitude);
  const targetLatitude = degreesToRadians(target.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(targetLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(haversine));
}

export function roundDistanceMiles(value: number) {
  return Number(value.toFixed(1));
}

export function hasCoordinates(
  sample: WaterSample,
): sample is WaterSample & GeoPoint {
  return sample.latitude != null && sample.longitude != null;
}

const overallSeverity = {
  unknown: 0,
  normal: 1,
  review: 2,
  alert: 3,
} as const;

const leadRiskSeverity = {
  unknown: 0,
  low: 1,
  elevated: 2,
  high: 3,
} as const;

const filterSeverity = {
  unknown: 0,
  not_needed: 1,
  recommended: 2,
  strongly_recommended: 3,
} as const;

function maxBySeverity<T extends string>(
  values: T[],
  severity: Record<T, number>,
  fallback: T,
) {
  if (values.length === 0) {
    return fallback;
  }

  return [...values].sort((left, right) => severity[right] - severity[left])[0] ?? fallback;
}

export function summarizeNearbySamples(samples: NearbyWaterSample[]): NearbySummary {
  if (samples.length === 0) {
    return {
      sampleCount: 0,
      nearestDistanceMiles: null,
      overall: "unknown",
      leadRisk: "unknown",
      filterRecommendation: "unknown",
    };
  }

  const computed = samples.map(getComputedSummaryForSample);

  return {
    sampleCount: samples.length,
    nearestDistanceMiles:
      typeof samples[0]?.distanceMiles === "number"
        ? roundDistanceMiles(samples[0].distanceMiles)
        : null,
    overall: maxBySeverity(
      computed.map((item) => item.overall),
      overallSeverity,
      "unknown",
    ),
    leadRisk: maxBySeverity(
      computed.map((item) => item.leadRisk),
      leadRiskSeverity,
      "unknown",
    ),
    filterRecommendation: maxBySeverity(
      computed.map((item) => item.filterRecommendation),
      filterSeverity,
      "unknown",
    ),
  };
}
