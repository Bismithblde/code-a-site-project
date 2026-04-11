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
  leadFirstDraw: {
    min: "leadFirstDrawMin",
    max: "leadFirstDrawMax",
  },
  leadFlushOneToTwo: {
    min: "leadFlushOneToTwoMin",
    max: "leadFlushOneToTwoMax",
  },
  leadFlushFive: {
    min: "leadFlushFiveMin",
    max: "leadFlushFiveMax",
  },
  copperFirstDraw: {
    min: "copperFirstDrawMin",
    max: "copperFirstDrawMax",
  },
  copperFlushOneToTwo: {
    min: "copperFlushOneToTwoMin",
    max: "copperFlushOneToTwoMax",
  },
  copperFlushFive: {
    min: "copperFlushFiveMin",
    max: "copperFlushFiveMax",
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
    "zipCode",
    "borough",
    "sampleNumber",
    "leadFirstDraw",
    "leadFlushOneToTwo",
    "leadFlushFive",
    "copperFirstDraw",
    "copperFlushOneToTwo",
    "copperFlushFive",
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
    zipCode: searchParams.get("zipCode") ?? undefined,
    borough: searchParams.get("borough") ?? undefined,
    locationText: searchParams.get("location") ?? undefined,
    zip: searchParams.get("zip") ?? undefined,
    limit,
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
