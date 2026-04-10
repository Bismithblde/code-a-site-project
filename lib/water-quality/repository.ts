import "server-only";

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { loadCsvFile } from "./csv";
import { normalizeWaterSample } from "./normalize";
import type { WaterDataset, WaterSample } from "./types";

let cachedDataset:
  | {
      cacheKey: string;
      dataset: WaterDataset;
    }
  | null = null;

type GeocodedSampleRecord = {
  key: string;
  latitude: number;
  longitude: number;
};

function getGeocodedSamplePath(suffix: string) {
  const configuredPath =
    process.env.NYC_WATER_SAMPLES_GEOCODED_PATH ??
    `data/nyc-water-samples.geocoded${suffix}.json`;

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(/* turbopackIgnore: true */ process.cwd(), configuredPath);
}

async function readGeocodedSampleRecords(pathname: string) {
  try {
    const fileContents = await readFile(pathname, "utf8");
    return JSON.parse(fileContents) as GeocodedSampleRecord[];
  } catch {
    return [];
  }
}

async function getOptionalMtimeMs(pathname: string) {
  try {
    const fileStat = await stat(pathname);
    return fileStat.mtimeMs;
  } catch {
    return 0;
  }
}

async function loadGeocodedSampleMap() {
  const [generated, overrides] = await Promise.all([
    readGeocodedSampleRecords(getGeocodedSamplePath("")),
    readGeocodedSampleRecords(getGeocodedSamplePath(".overrides")),
  ]);

  return new Map(
    [...generated, ...overrides].map((record) => [
      record.key,
      { latitude: record.latitude, longitude: record.longitude },
    ]),
  );
}

export async function getWaterDataset(): Promise<WaterDataset> {
  const csvFile = await loadCsvFile();
  const geocodedPath = getGeocodedSamplePath("");
  const overridePath = getGeocodedSamplePath(".overrides");
  const [geocodedMtimeMs, overrideMtimeMs] = await Promise.all([
    getOptionalMtimeMs(geocodedPath),
    getOptionalMtimeMs(overridePath),
  ]);
  const cacheKey = [csvFile.mtimeMs, geocodedMtimeMs, overrideMtimeMs].join(":");

  if (cachedDataset && cachedDataset.cacheKey === cacheKey) {
    return cachedDataset.dataset;
  }

  const geocodedSamples = await loadGeocodedSampleMap();
  const records = csvFile.rows.map((row, index) => {
    const record = normalizeWaterSample(row, index + 2);
    const geocoded = geocodedSamples.get(record.locationNormalized);

    if (geocoded) {
      record.latitude = geocoded.latitude;
      record.longitude = geocoded.longitude;
    }

    return record;
  });

  const bySampleNumber = new Map<string, WaterSample>();
  const bySampleSite = new Map<string, WaterSample[]>();
  const bySampleClass = new Map<string, WaterSample[]>();

  records.forEach((record) => {
    if (record.sampleNumber) {
      bySampleNumber.set(record.sampleNumber, record);
    }

    if (record.sampleSiteNormalized) {
      const existingSiteRecords = bySampleSite.get(record.sampleSiteNormalized) ?? [];
      existingSiteRecords.push(record);
      bySampleSite.set(record.sampleSiteNormalized, existingSiteRecords);
    }

    if (record.sampleClassNormalized) {
      const existingClassRecords =
        bySampleClass.get(record.sampleClassNormalized) ?? [];
      existingClassRecords.push(record);
      bySampleClass.set(record.sampleClassNormalized, existingClassRecords);
    }
  });

  const dataset: WaterDataset = {
    sourcePath: csvFile.absolutePath,
    loadedAt: new Date().toISOString(),
    records,
    bySampleNumber,
    bySampleSite,
    bySampleClass,
    uniqueSites: Array.from(
      new Set(records.map((record) => record.sampleSite).filter(Boolean)),
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
