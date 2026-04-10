import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeText } from "@/lib/water-quality/normalize";

type GeocodedLocationRecord = {
  key: string;
  latitude: number;
  longitude: number;
};

type GeocodeMissRecord = {
  key: string;
  location: string;
  attemptedQueries: string[];
  lastError?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
};

type GeocodeResult =
  | {
      latitude: number;
      longitude: number;
      queryUsed: string;
      attemptedQueries: string[];
      rateLimitedCount: number;
    }
  | {
      attemptedQueries: string[];
      lastError?: string;
      rateLimitedCount: number;
    };

const OUTPUT_PATH = path.join(process.cwd(), "data/nyc-water-samples.geocoded.json");
const OVERRIDES_PATH = path.join(
  process.cwd(),
  "data/nyc-water-samples.geocoded.overrides.json",
);
const MISSES_PATH = path.join(
  process.cwd(),
  "data/nyc-water-samples.geocoded.misses.json",
);
const CSV_PATH = path.join(process.cwd(), "data/nyc-water-samples.csv");

const DEFAULT_DELAY_MS = 1100;
const DEFAULT_PROGRESS_INTERVAL = 25;
const DEFAULT_CHECKPOINT_INTERVAL = 50;
const NYC_BOROUGH_TOKENS = [
  "manhattan",
  "brooklyn",
  "queens",
  "bronx",
  "staten island",
  "new york city",
] as const;
const NYC_BOROUGH_SUFFIXES = [
  "Queens, NY",
  "Brooklyn, NY",
  "Bronx, NY",
  "Manhattan, NY",
  "Staten Island, NY",
] as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDelayMs() {
  const configured = Number(process.env.NYC_WATER_GEOCODER_DELAY_MS ?? "");
  if (Number.isFinite(configured) && configured >= 0) {
    return configured;
  }
  return DEFAULT_DELAY_MS;
}

function getMaxRequests() {
  const configured = Number(process.env.NYC_WATER_GEOCODER_MAX_REQUESTS ?? "");
  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured);
  }
  return null;
}

function getProgressInterval() {
  const configured = Number(process.env.NYC_WATER_GEOCODER_PROGRESS_INTERVAL ?? "");
  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured);
  }
  return DEFAULT_PROGRESS_INTERVAL;
}

function getCheckpointInterval() {
  const configured = Number(process.env.NYC_WATER_GEOCODER_CHECKPOINT_INTERVAL ?? "");
  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured);
  }
  return DEFAULT_CHECKPOINT_INTERVAL;
}

function shouldIgnoreMissCache() {
  const raw = (process.env.NYC_WATER_GEOCODER_IGNORE_MISS_CACHE ?? "").trim();
  return raw === "1" || raw.toLowerCase() === "true";
}

function normalizeLocationForQuery(location: string) {
  // Keep this conservative and reversible: strip repeated prefixes that hurt geocoding.
  return location
    .replace(/^ss\s*-\s*/i, "")
    .replace(/^hydt\s*-\s*/i, "")
    .replace(/^ht\s*-\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupUtilityTokens(value: string) {
  return value
    .replace(/\b(SS|HYDT|HT)\b\s*-\s*/gi, "")
    .replace(/\b(1st|2nd|3rd|4th)\s+SS\s+(N\/O|S\/O|E\/O|W\/O)\b/gi, "")
    .replace(/\b(BTW|BTWN|B\/W)\b/gi, "between")
    .replace(/\bIFO\b/gi, "")
    .replace(/\bOPP\b/gi, "")
    .replace(/\b(CORNER OF|ACROSS)\b/gi, "")
    .replace(/\b(N\/S|S\/S|E\/S|W\/S)\b/gi, "")
    .replace(/\b(\d+)\s*(inch|in)\b/gi, "")
    .replace(/["']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripDirectionalSegmentTokens(value: string) {
  return value
    .replace(/\b(?:1st|2nd|3rd|4th)\s+SS\s+(?:N\/O|S\/O|E\/O|W\/O)\s+[A-Za-z0-9'. -]+/gi, "")
    .replace(/\b(?:N\/O|S\/O|E\/O|W\/O)\s+[A-Za-z0-9'. -]+/gi, "")
    .replace(/\b(?:N\/S|S\/S|E\/S|W\/S)\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractStreetTokens(value: string) {
  const streetRegex =
    /\b([A-Za-z0-9'.-]+\s)+(Ave|Avenue|St|Street|Rd|Road|Blvd|Boulevard|Pl|Place|Pkwy|Parkway|Dr|Drive|Ct|Court|Ln|Lane|Terrace|Expy|Expressway)\b/gi;
  const matches: string[] = [];
  let match: RegExpExecArray | null = streetRegex.exec(value);
  while (match) {
    matches.push(match[0].replace(/\s+/g, " ").trim());
    match = streetRegex.exec(value);
  }
  return Array.from(new Set(matches));
}

function extractBetweenStreets(value: string) {
  const betweenRegex =
    /\b(?:between|btw|btwn|b\/w)\s+([A-Za-z0-9'. -]+?)\s*(?:&|and)\s*([A-Za-z0-9'. -]+?)(?:,|$)/i;
  const match = value.match(betweenRegex);
  if (!match) {
    return null;
  }

  return {
    first: match[1].replace(/\s+/g, " ").trim(),
    second: match[2].replace(/\s+/g, " ").trim(),
  };
}

function extractAddressToken(value: string) {
  const addressRegex =
    /\b(\d{1,5}[-]?\d{0,4}\s+[A-Za-z0-9'. -]+?\b(?:Ave|Avenue|St|Street|Rd|Road|Blvd|Boulevard|Pl|Place|Pkwy|Parkway|Dr|Drive|Ct|Court|Ln|Lane|Terrace|Expy|Expressway)\b)/i;
  const match = value.match(addressRegex);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? null;
}

function buildLookupQueries(location: string) {
  const base = normalizeLocationForQuery(location);
  const cleaned = cleanupUtilityTokens(base);
  const directionalStripped = stripDirectionalSegmentTokens(cleaned);
  const streetTokens = extractStreetTokens(directionalStripped);
  const between = extractBetweenStreets(directionalStripped);
  const address = extractAddressToken(directionalStripped);

  const queries = new Set<string>();
  queries.add(`${directionalStripped}, New York City, NY`);
  queries.add(`${cleaned}, New York City, NY`);
  queries.add(`${base}, New York City, NY`);

  if (address) {
    queries.add(`${address}, New York City, NY`);
  }

  if (between && streetTokens.length >= 1) {
    queries.add(`${streetTokens[0]} and ${between.first}, New York City, NY`);
    queries.add(`${streetTokens[0]} and ${between.second}, New York City, NY`);
  }

  if (streetTokens.length >= 2) {
    queries.add(`${streetTokens[0]} and ${streetTokens[1]}, New York City, NY`);
  }

  if (streetTokens.length >= 1) {
    queries.add(`${streetTokens[0]}, New York City, NY`);
  }

  const baseQueries = Array.from(queries)
    .map((entry) => entry.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const expanded = new Set<string>(baseQueries);
  for (const query of baseQueries) {
    const stripped = query.replace(/,\s*new york city,\s*ny$/i, "").trim();
    for (const suffix of NYC_BOROUGH_SUFFIXES) {
      expanded.add(`${stripped}, ${suffix}`);
    }
  }

  return Array.from(expanded);
}

async function readGeocodedFile(pathname: string) {
  try {
    const fileContents = await readFile(pathname, "utf8");
    return JSON.parse(fileContents) as GeocodedLocationRecord[];
  } catch {
    return [];
  }
}

async function loadMisses() {
  try {
    const fileContents = await readFile(MISSES_PATH, "utf8");
    return JSON.parse(fileContents) as GeocodeMissRecord[];
  } catch {
    return [];
  }
}

async function writeGeocodedOutput(outputMap: Map<string, GeocodedLocationRecord>) {
  const output = Array.from(outputMap.values()).sort((left, right) =>
    left.key.localeCompare(right.key),
  );
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
}

async function writeMissesOutput(missMap: Map<string, GeocodeMissRecord>) {
  const misses = Array.from(missMap.values()).sort((left, right) =>
    left.key.localeCompare(right.key),
  );
  await writeFile(MISSES_PATH, `${JSON.stringify(misses, null, 2)}\n`, "utf8");
}

function parseCsvText(text: string) {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;
  const normalizedText = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < normalizedText.length; index += 1) {
    const char = normalizedText[index];
    const next = normalizedText[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((field) => field.trim().length > 0));
}

async function loadCsvLocations() {
  const fileContents = await readFile(CSV_PATH, "utf8");
  const rows = parseCsvText(fileContents);
  const [headerRow, ...dataRows] = rows;
  if (!headerRow) {
    return [];
  }

  const locationIndex = headerRow.findIndex((header) => header.trim() === "Location");
  if (locationIndex === -1) {
    throw new Error('Could not find "Location" column in water sample CSV.');
  }

  return dataRows
    .map((row) => row[locationIndex]?.trim() ?? "")
    .filter(Boolean);
}

async function loadOverrides() {
  return readGeocodedFile(OVERRIDES_PATH);
}

async function loadExistingGeocodes() {
  return readGeocodedFile(OUTPUT_PATH);
}

function isNycResult(resultDisplayName: string | null | undefined) {
  if (!resultDisplayName) {
    return true;
  }

  const lower = resultDisplayName.toLowerCase();
  return NYC_BOROUGH_TOKENS.some((token) => lower.includes(token));
}

async function geocodeLocation(location: string) {
  const queries = buildLookupQueries(location);
  let lastError: string | undefined;
  let rateLimitedCount = 0;

  for (const query of queries) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          process.env.NYC_WATER_GEOCODER_USER_AGENT ??
          "nyc-water-sample-enrichment/1.0",
      },
    });

    if (response.status === 429) {
      rateLimitedCount += 1;
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSeconds = Number(retryAfterHeader ?? "");
      const retryDelayMs =
        Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? Math.floor(retryAfterSeconds * 1000)
          : 2500;
      lastError = `Geocoder returned 429 (rate limited)`;
      await sleep(retryDelayMs);
      continue;
    }

    if (!response.ok) {
      lastError = `Geocoder returned ${response.status}`;
      continue;
    }

    const body = (await response.json()) as Array<
      NominatimResult & { display_name?: string }
    >;

    const match = body.find((item) => isNycResult(item.display_name)) ?? body[0];
    if (!match) {
      continue;
    }

    const latitude = Number(match.lat);
    const longitude = Number(match.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    return {
      latitude,
      longitude,
      queryUsed: query,
      attemptedQueries: queries,
      rateLimitedCount,
    };
  }

  return { attemptedQueries: queries, lastError, rateLimitedCount };
}

function getUniqueLocationEntries(rawLocations: string[]) {
  const byKey = new Map<string, string>();

  for (const location of rawLocations) {
    const key = normalizeText(location);
    if (!key || byKey.has(key)) {
      continue;
    }
    byKey.set(key, location);
  }

  return Array.from(byKey.entries()).map(([key, location]) => ({ key, location }));
}

async function main() {
  console.log("[water:geocode] Starting NYC sample geocode enrichment...");

  const csvLocations = await loadCsvLocations();
  const [overrides, existing] = await Promise.all([
    loadOverrides(),
    loadExistingGeocodes(),
  ]);
  const existingMisses = await loadMisses();

  const overrideMap = new Map(overrides.map((record) => [record.key, record]));
  const existingMap = new Map(existing.map((record) => [record.key, record]));
  const outputMap = new Map([...existingMap, ...overrideMap].map((entry) => [entry[0], entry[1]]));
  const missMap = new Map(existingMisses.map((record) => [record.key, record]));

  const uniqueLocationEntries = getUniqueLocationEntries(
    csvLocations,
  );

  const delayMs = getDelayMs();
  const maxRequests = getMaxRequests();
  const progressInterval = getProgressInterval();
  const checkpointInterval = getCheckpointInterval();
  const ignoreMissCache = shouldIgnoreMissCache();
  const failures: string[] = [];
  let requestsSent = 0;
  let added = 0;
  let skippedAlreadyKnown = 0;
  let skippedKnownMisses = 0;
  let skippedNoResult = 0;
  let rateLimitedResponses = 0;
  let inspected = 0;
  const totalToInspect = uniqueLocationEntries.length;

  console.log(
    `[water:geocode] Loaded ${totalToInspect} unique normalized locations from CSV.`,
  );
  console.log(
    `[water:geocode] Existing geocodes: ${existing.length}, overrides: ${overrides.length}, combined known keys: ${outputMap.size}.`,
  );
  console.log(
    `[water:geocode] Existing misses cache keys: ${missMap.size}.`,
  );
  if (ignoreMissCache) {
    console.log("[water:geocode] Miss cache is ignored for this run.");
  }
  console.log(
    `[water:geocode] Delay: ${delayMs}ms, request cap: ${
      maxRequests ?? "none"
    }, progress interval: every ${progressInterval} rows, checkpoint interval: every ${checkpointInterval} requests.`,
  );

  for (const { key, location } of uniqueLocationEntries) {
    inspected += 1;

    if (outputMap.has(key)) {
      skippedAlreadyKnown += 1;
      if (inspected % progressInterval === 0) {
        console.log(
          `[water:geocode] Progress ${inspected}/${totalToInspect} | known:${skippedAlreadyKnown} added:${added} requests:${requestsSent} failures:${failures.length}`,
        );
      }
      continue;
    }

    if (!ignoreMissCache && missMap.has(key)) {
      skippedKnownMisses += 1;
      if (inspected % progressInterval === 0) {
        console.log(
          `[water:geocode] Progress ${inspected}/${totalToInspect} | known:${skippedAlreadyKnown} miss-cache:${skippedKnownMisses} added:${added} requests:${requestsSent} failures:${failures.length}`,
        );
      }
      continue;
    }

    if (maxRequests != null && requestsSent >= maxRequests) {
      break;
    }

    try {
      const result = await geocodeLocation(location);
      requestsSent += 1;
      rateLimitedResponses += result.rateLimitedCount;

      if (!("latitude" in result) || !("longitude" in result)) {
        skippedNoResult += 1;
        const miss: GeocodeMissRecord = {
          key,
          location,
          attemptedQueries: result.attemptedQueries,
          lastError: result.lastError,
        };
        missMap.set(key, miss);
        failures.push(`No result: ${location}`);
        console.log(
          `[water:geocode] No result: ${location} | attempts=${result.attemptedQueries.length}${
            result.lastError ? ` | lastError=${result.lastError}` : ""
          }`,
        );
      } else {
        outputMap.set(key, { key, latitude: result.latitude, longitude: result.longitude });
        missMap.delete(key);
        added += 1;
        console.log(
          `[water:geocode] Added (${added}): ${location} -> (${result.latitude.toFixed(
            5,
          )}, ${result.longitude.toFixed(5)}) via "${result.queryUsed}"`,
        );
      }
    } catch (error) {
      requestsSent += 1;
      const message = `${location}: ${
        error instanceof Error ? error.message : String(error)
      }`;
      failures.push(message);
      console.log(`[water:geocode] Error: ${message}`);
    }

    if (inspected % progressInterval === 0) {
      console.log(
        `[water:geocode] Progress ${inspected}/${totalToInspect} | known:${skippedAlreadyKnown} miss-cache:${skippedKnownMisses} added:${added} requests:${requestsSent} failures:${failures.length}`,
      );
    }

    if (requestsSent > 0 && requestsSent % checkpointInterval === 0) {
      await Promise.all([writeGeocodedOutput(outputMap), writeMissesOutput(missMap)]);
      console.log(
        `[water:geocode] Checkpoint saved at request ${requestsSent}.`,
      );
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  await Promise.all([writeGeocodedOutput(outputMap), writeMissesOutput(missMap)]);

  const totalUniqueLocations = uniqueLocationEntries.length;
  const geocodedCount = outputMap.size;
  const coverage = totalUniqueLocations === 0 ? 0 : (geocodedCount / totalUniqueLocations) * 100;

  console.log("[water:geocode] NYC water geocode enrichment complete.");
  console.log(`- Unique normalized locations in CSV: ${totalUniqueLocations}`);
  console.log(`- Coordinates stored (output + overrides): ${geocodedCount}`);
  console.log(`- Coverage: ${coverage.toFixed(2)}%`);
  console.log(`- Added this run: ${added}`);
  console.log(`- Requests sent this run: ${requestsSent}`);
  console.log(`- Skipped already known keys: ${skippedAlreadyKnown}`);
  console.log(`- Skipped known misses from cache: ${skippedKnownMisses}`);
  console.log(`- Skipped no-result locations: ${skippedNoResult}`);
  console.log(`- Miss cache size: ${missMap.size}`);
  console.log(`- Rate-limited query responses (429): ${rateLimitedResponses}`);
  if (maxRequests != null) {
    console.log(`- Max requests cap used: ${maxRequests}`);
  }

  if (failures.length > 0) {
    console.log("Geocoding failures/skips:");
    failures.slice(0, 100).forEach((failure) => console.log(`- ${failure}`));
    if (failures.length > 100) {
      console.log(`...and ${failures.length - 100} more`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
