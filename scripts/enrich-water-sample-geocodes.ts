import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadCsvFile } from "@/lib/water-quality/csv";
import { normalizeText } from "@/lib/water-quality/normalize";

type GeocodedLocationRecord = {
  key: string;
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  lat: string;
  lon: string;
};

const OUTPUT_PATH = path.join(process.cwd(), "data/nyc-water-samples.geocoded.json");
const OVERRIDES_PATH = path.join(
  process.cwd(),
  "data/nyc-water-samples.geocoded.overrides.json",
);

function buildLookupQuery(location: string) {
  return `${location}, New York City, NY`;
}

async function loadOverrides() {
  try {
    const fileContents = await readFile(OVERRIDES_PATH, "utf8");
    return JSON.parse(fileContents) as GeocodedLocationRecord[];
  } catch {
    return [];
  }
}

async function geocodeLocation(location: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", buildLookupQuery(location));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        process.env.NYC_WATER_GEOCODER_USER_AGENT ??
        "nyc-water-sample-enrichment/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoder returned ${response.status} for "${location}"`);
  }

  const body = (await response.json()) as NominatimResult[];
  const match = body[0];

  if (!match) {
    return null;
  }

  return {
    latitude: Number(match.lat),
    longitude: Number(match.lon),
  };
}

async function main() {
  const csvFile = await loadCsvFile();

  const overrides = await loadOverrides();
  const overrideMap = new Map(overrides.map((record) => [record.key, record]));

  const uniqueLocations = Array.from(
    new Set(
      csvFile.rows
        .map((row) => row.Location?.trim() ?? "")
        .filter(Boolean),
    ),
  );

  const output: GeocodedLocationRecord[] = [...overrides];
  const failures: string[] = [];

  for (const location of uniqueLocations) {
    const key = normalizeText(location);

    if (!key || overrideMap.has(key) || output.some((record) => record.key === key)) {
      continue;
    }

    try {
      const result = await geocodeLocation(location);

      if (!result) {
        failures.push(location);
        continue;
      }

      output.push({
        key,
        latitude: result.latitude,
        longitude: result.longitude,
      });
    } catch (error) {
      failures.push(
        `${location}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  output.sort((left, right) => left.key.localeCompare(right.key));
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.log("Geocoding completed with skipped locations:");
    failures.forEach((failure) => console.log(`- ${failure}`));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
