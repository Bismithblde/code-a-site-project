import zipCoordinates from "@/data/nyc-zip-centroids.json";
import { WaterQualityValidationError } from "./errors";
import type { GeoPoint } from "./types";

type ZipCoordinateRecord = GeoPoint & {
  zip: string;
};

const ZIP_CODE_PATTERN = /^\d{5}$/;

const zipCoordinateMap = new Map(
  (zipCoordinates as ZipCoordinateRecord[]).map((record) => [record.zip, record]),
);

export function normalizeZipCode(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.trim();
}

export function resolveZipCodeOrigin(value: string | null | undefined): GeoPoint & { zip: string } {
  const zip = normalizeZipCode(value);

  if (!zip || !ZIP_CODE_PATTERN.test(zip)) {
    throw new WaterQualityValidationError(
      "ZIP code must be a valid 5-digit NYC ZIP code.",
    );
  }

  const coordinates = zipCoordinateMap.get(zip);

  if (!coordinates) {
    throw new WaterQualityValidationError(
      `ZIP code "${zip}" is not supported by the NYC tap water lookup yet.`,
    );
  }

  return coordinates;
}
