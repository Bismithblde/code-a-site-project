import {
  SOURCE_COLUMNS,
  SOURCE_COLUMN_ALIASES,
} from "./constants";
import type {
  NumericComparator,
  NumericMeasurement,
  RawCsvRow,
  WaterSample,
} from "./types";

function cleanString(value: string | null | undefined) {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim().replace(/^"(.*)"$/, "$1").replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeText(value: string | null | undefined) {
  return (cleanString(value) ?? "")
    .toLowerCase()
    .replace(/['".,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pad(value: string) {
  return value.padStart(2, "0");
}

function normalizeDate(rawValue: string | undefined, issues: string[]) {
  const value = cleanString(rawValue);

  if (!value) {
    return null;
  }

  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const isoDateTimeMatch = value.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/,
  );
  if (isoDateTimeMatch) {
    const [, year, month, day] = isoDateTimeMatch;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const usMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (usMatch) {
    const [, month, day, rawYear] = usMatch;
    let year = rawYear;
    if (year.length === 2) {
      year = `20${year}`;
    }
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  issues.push(`Unrecognized sample date "${value}"`);
  return null;
}

function normalizeTime(rawValue: string | undefined, issues: string[]) {
  const value = cleanString(rawValue);

  if (!value) {
    return null;
  }

  const meridiemMatch = value.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i,
  );
  if (meridiemMatch) {
    const [, rawHour, minute, second = "00", period] = meridiemMatch;
    let hour = Number(rawHour);
    const upperPeriod = period.toUpperCase();

    if (upperPeriod === "PM" && hour !== 12) {
      hour += 12;
    }
    if (upperPeriod === "AM" && hour === 12) {
      hour = 0;
    }

    return `${pad(String(hour))}:${minute}:${second}`;
  }

  const twentyFourHourMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (twentyFourHourMatch) {
    const [, hour, minute, second = "00"] = twentyFourHourMatch;
    return `${pad(hour)}:${minute}:${second}`;
  }

  issues.push(`Unrecognized sample time "${value}"`);
  return null;
}

function parseComparatorValue(rawValue: string): {
  comparator: NumericComparator;
  numericPortion: string;
} {
  const comparatorMatch = rawValue.match(/^(<=|>=|<|>|=)\s*(.+)$/);

  if (!comparatorMatch) {
    return {
      comparator: "eq",
      numericPortion: rawValue,
    };
  }

  const [, comparatorToken, numericPortion] = comparatorMatch;
  const comparatorMap: Record<string, NumericComparator> = {
    "<": "lt",
    "<=": "lte",
    ">": "gt",
    ">=": "gte",
    "=": "eq",
  };

  return {
    comparator: comparatorMap[comparatorToken] ?? "eq",
    numericPortion,
  };
}

function parseNumericMeasurement(
  rawValue: string | undefined,
  fieldLabel: string,
  issues: string[],
): NumericMeasurement {
  const cleaned = cleanString(rawValue);

  if (!cleaned) {
    return {
      raw: null,
      value: null,
      comparator: null,
      parseError: null,
    };
  }

  const { comparator, numericPortion } = parseComparatorValue(cleaned);
  const normalizedPortion = numericPortion.replace(/,/g, "").trim();
  const parsedNumber = Number(normalizedPortion);

  if (Number.isFinite(parsedNumber)) {
    return {
      raw: cleaned,
      value: parsedNumber,
      comparator,
      parseError: null,
    };
  }

  const parseError = `Could not parse numeric value "${cleaned}" for ${fieldLabel}`;
  issues.push(parseError);

  return {
    raw: cleaned,
    value: null,
    comparator,
    parseError,
  };
}

function readSourceValue(
  row: RawCsvRow,
  columnName: string,
  aliases: readonly string[] = [],
) {
  const candidateNames = [columnName, ...aliases];

  for (const candidateName of candidateNames) {
    if (candidateName in row) {
      return row[candidateName];
    }
  }

  return undefined;
}

export function normalizeWaterSample(
  row: RawCsvRow,
  sourceRowNumber: number,
): WaterSample {
  const issues: string[] = [];
  const sampleNumber = cleanString(row[SOURCE_COLUMNS.sampleNumber]);
  const sampleDate = normalizeDate(
    readSourceValue(row, SOURCE_COLUMNS.sampleDate),
    issues,
  );
  const sampleTime = normalizeTime(row[SOURCE_COLUMNS.sampleTime], issues);
  const sampleSite = cleanString(row[SOURCE_COLUMNS.sampleSite]);
  const sampleClass = cleanString(row[SOURCE_COLUMNS.sampleClass]);
  const location = cleanString(row[SOURCE_COLUMNS.location]);

  if (!sampleNumber) {
    issues.push("Missing sample number");
  }

  const sampledAt =
    sampleDate && sampleTime ? `${sampleDate}T${sampleTime}` : sampleDate;

  return {
    id: sampleNumber ? `sample-${sampleNumber}` : `row-${sourceRowNumber}`,
    sampleNumber,
    sampleDate,
    sampleTime,
    sampledAt,
    sampleSite,
    sampleClass,
    location,
    locationNormalized: normalizeText(location),
    sampleSiteNormalized: normalizeText(sampleSite),
    sampleClassNormalized: normalizeText(sampleClass),
    latitude: null,
    longitude: null,
    residualFreeChlorine: parseNumericMeasurement(
      row[SOURCE_COLUMNS.residualFreeChlorine],
      SOURCE_COLUMNS.residualFreeChlorine,
      issues,
    ),
    turbidity: parseNumericMeasurement(
      row[SOURCE_COLUMNS.turbidity],
      SOURCE_COLUMNS.turbidity,
      issues,
    ),
    fluoride: parseNumericMeasurement(
      row[SOURCE_COLUMNS.fluoride],
      SOURCE_COLUMNS.fluoride,
      issues,
    ),
    coliformQuantiTray: parseNumericMeasurement(
      row[SOURCE_COLUMNS.coliformQuantiTray],
      SOURCE_COLUMNS.coliformQuantiTray,
      issues,
    ),
    eColiQuantiTray: parseNumericMeasurement(
      readSourceValue(
        row,
        SOURCE_COLUMNS.eColiQuantiTray,
        SOURCE_COLUMN_ALIASES.eColiQuantiTray,
      ),
      SOURCE_COLUMNS.eColiQuantiTray,
      issues,
    ),
    raw: row,
    issues,
    sourceRowNumber,
  };
}
