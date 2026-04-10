import { MAX_PAGE_SIZE } from "./constants";
import type {
  NumericFieldKey,
  SortField,
  WaterSampleFilters,
} from "./types";

const NUMERIC_FILTER_PARAM_MAP: Record<
  NumericFieldKey,
  { min: string; max: string }
> = {
  residualFreeChlorine: {
    min: "residualFreeChlorineMin",
    max: "residualFreeChlorineMax",
  },
  turbidity: {
    min: "turbidityMin",
    max: "turbidityMax",
  },
  fluoride: {
    min: "fluorideMin",
    max: "fluorideMax",
  },
  coliformQuantiTray: {
    min: "coliformMin",
    max: "coliformMax",
  },
  eColiQuantiTray: {
    min: "eColiMin",
    max: "eColiMax",
  },
};

function parseOptionalNumber(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalSortField(value: string | null): SortField | undefined {
  if (!value) {
    return undefined;
  }

  const allowedFields: SortField[] = [
    "sampleDate",
    "sampleSite",
    "location",
    "sampleClass",
    "sampleNumber",
    "residualFreeChlorine",
    "turbidity",
    "fluoride",
    "coliformQuantiTray",
    "eColiQuantiTray",
  ];

  return allowedFields.includes(value as SortField)
    ? (value as SortField)
    : undefined;
}

export function parseSampleFilters(searchParams: URLSearchParams): WaterSampleFilters {
  const contaminants = Object.entries(NUMERIC_FILTER_PARAM_MAP).reduce<
    NonNullable<WaterSampleFilters["contaminants"]>
  >((accumulator, [field, params]) => {
    const min = parseOptionalNumber(searchParams.get(params.min));
    const max = parseOptionalNumber(searchParams.get(params.max));

    if (min == null && max == null) {
      return accumulator;
    }

    accumulator[field as NumericFieldKey] = { min, max };
    return accumulator;
  }, {});

  const pageSize = parseOptionalNumber(searchParams.get("pageSize"));
  const limit = parseOptionalNumber(searchParams.get("limit"));

  return {
    sampleSite: searchParams.get("sampleSite") ?? undefined,
    locationText: searchParams.get("location") ?? undefined,
    zip: searchParams.get("zip") ?? undefined,
    limit,
    sampleClass: searchParams.get("sampleClass") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    sortBy: parseOptionalSortField(searchParams.get("sortBy")),
    sortDir: searchParams.get("sortDir") === "asc" ? "asc" : "desc",
    page: parseOptionalNumber(searchParams.get("page")),
    pageSize:
      pageSize && pageSize <= MAX_PAGE_SIZE ? pageSize : undefined,
    contaminants: Object.keys(contaminants).length > 0 ? contaminants : undefined,
  };
}
