import "server-only";

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_WATER_SAMPLES_CSV_PATH } from "./constants";
import type { RawCsvRow } from "./types";

export type LoadedCsvFile = {
  absolutePath: string;
  mtimeMs: number;
  rows: RawCsvRow[];
  headers: string[];
};

function getCsvPath() {
  const configuredPath =
    process.env.NYC_WATER_SAMPLES_CSV_PATH || DEFAULT_WATER_SAMPLES_CSV_PATH;

  if (path.isAbsolute(configuredPath)) return configuredPath;

  // Try process.cwd() first (works locally), then __dirname-based paths (works on Vercel)
  const cwdPath = path.join(process.cwd(), configuredPath);
  try {
    if (require("fs").existsSync(cwdPath)) return cwdPath;
  } catch {}

  // On Vercel, files are in the function bundle relative to the project root
  const dirnamePath = path.resolve(__dirname, "../../..", configuredPath);
  try {
    if (require("fs").existsSync(dirnamePath)) return dirnamePath;
  } catch {}

  // Fallback to cwd path (will show the error message with the path)
  return cwdPath;
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

function rowsToObjects(rows: string[][]) {
  const [headerRow, ...dataRows] = rows;

  if (!headerRow || headerRow.length === 0) {
    throw new Error("CSV file is empty or missing a header row.");
  }

  const headers = headerRow.map((header) => header.trim());
  const objects = dataRows.map<RawCsvRow>((row) => {
    const result: RawCsvRow = {};

    headers.forEach((header, index) => {
      result[header] = row[index] ?? "";
    });

    return result;
  });

  return { headers, rows: objects };
}

export async function loadCsvFile(): Promise<LoadedCsvFile> {
  const absolutePath = getCsvPath();

  let fileStat;
  try {
    fileStat = await stat(absolutePath);
  } catch {
    throw new Error(
      `Water sample CSV not found at "${absolutePath}". Set NYC_WATER_SAMPLES_CSV_PATH or add the file there.`,
    );
  }

  const fileContents = await readFile(absolutePath, "utf8");
  const parsedRows = parseCsvText(fileContents);
  const { headers, rows } = rowsToObjects(parsedRows);

  return {
    absolutePath,
    mtimeMs: fileStat.mtimeMs,
    headers,
    rows,
  };
}
