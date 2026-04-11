import "server-only";

import { loadCsvFile } from "./csv";
import { normalizeWaterSample } from "./normalize";
import type { WaterDataset, WaterSample } from "./types";

let cachedDataset:
  | {
      cacheKey: string;
      dataset: WaterDataset;
    }
  | null = null;

export async function getWaterDataset(): Promise<WaterDataset> {
  const csvFile = await loadCsvFile();
  const cacheKey = [csvFile.mtimeMs].join(":");

  if (cachedDataset && cachedDataset.cacheKey === cacheKey) {
    return cachedDataset.dataset;
  }

  const records = csvFile.rows.map((row, index) =>
    normalizeWaterSample(row, index + 2),
  );

  /*
   * Previous hackathon path (kept for easy restore):
   * We used a geocoded location cache and enriched records with latitude/longitude
   * before running nearest-distance ZIP centroid lookup.
   *
   * const geocodedSamples = await loadGeocodedSampleMap();
   * const records = csvFile.rows.map((row, index) => {
   *   const record = normalizeWaterSample(row, index + 2);
   *   const geocoded = geocodedSamples.get(record.locationNormalized);
   *   if (geocoded) {
   *     record.latitude = geocoded.latitude;
   *     record.longitude = geocoded.longitude;
   *   }
   *   return record;
   * });
   */

  const bySampleNumber = new Map<string, WaterSample>();
  const byZipCode = new Map<string, WaterSample[]>();
  const byBorough = new Map<string, WaterSample[]>();

  records.forEach((record) => {
    if (record.sampleNumber) {
      bySampleNumber.set(record.sampleNumber, record);
    }

    if (record.zipCodeNormalized) {
      const existingZipRecords = byZipCode.get(record.zipCodeNormalized) ?? [];
      existingZipRecords.push(record);
      byZipCode.set(record.zipCodeNormalized, existingZipRecords);
    }

    if (record.boroughNormalized) {
      const existingBoroughRecords = byBorough.get(record.boroughNormalized) ?? [];
      existingBoroughRecords.push(record);
      byBorough.set(record.boroughNormalized, existingBoroughRecords);
    }
  });

  const dataset: WaterDataset = {
    sourcePath: csvFile.absolutePath,
    loadedAt: new Date().toISOString(),
    records,
    bySampleNumber,
    byZipCode,
    byBorough,
    uniqueZipCodes: Array.from(
      new Set(records.map((record) => record.zipCode).filter(Boolean)),
    ) as string[],
    uniqueLocations: Array.from(
      new Set(records.map((record) => record.location).filter(Boolean)),
    ) as string[],
  };

  cachedDataset = {
    cacheKey,
    dataset,
  };

  return dataset;
}
