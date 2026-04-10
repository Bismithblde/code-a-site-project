export type NumericComparator = "lt" | "lte" | "gt" | "gte" | "eq" | null;

export type NumericFieldKey =
  | "residualFreeChlorine"
  | "turbidity"
  | "fluoride"
  | "coliformQuantiTray"
  | "eColiQuantiTray";

export type SortField =
  | "sampleDate"
  | "sampleSite"
  | "location"
  | "sampleClass"
  | "sampleNumber"
  | NumericFieldKey;

export type HealthStatus = "normal" | "watch" | "alert" | "unknown";

export type RawCsvRow = Record<string, string>;

export type NumericMeasurement = {
  raw: string | null;
  value: number | null;
  comparator: NumericComparator;
  parseError: string | null;
};

export type WaterSample = {
  id: string;
  sampleNumber: string | null;
  sampleDate: string | null;
  sampleTime: string | null;
  sampledAt: string | null;
  sampleSite: string | null;
  sampleClass: string | null;
  location: string | null;
  locationNormalized: string;
  sampleSiteNormalized: string;
  sampleClassNormalized: string;
  latitude: number | null;
  longitude: number | null;
  residualFreeChlorine: NumericMeasurement;
  turbidity: NumericMeasurement;
  fluoride: NumericMeasurement;
  coliformQuantiTray: NumericMeasurement;
  eColiQuantiTray: NumericMeasurement;
  raw: RawCsvRow;
  issues: string[];
  sourceRowNumber: number;
};

export type WaterDataset = {
  sourcePath: string;
  loadedAt: string;
  records: WaterSample[];
  bySampleNumber: Map<string, WaterSample>;
  bySampleSite: Map<string, WaterSample[]>;
  bySampleClass: Map<string, WaterSample[]>;
  uniqueSites: string[];
  uniqueLocations: string[];
};

export type NumericRangeFilter = {
  min?: number;
  max?: number;
};

export type WaterSampleFilters = {
  sampleSite?: string;
  locationText?: string;
  zip?: string;
  limit?: number;
  sampleClass?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: SortField;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  contaminants?: Partial<Record<NumericFieldKey, NumericRangeFilter>>;
};

export type NearestMatch = {
  field: "sampleSite" | "location";
  value: string;
  score: number;
};

export type QueryResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortDir: "asc" | "desc";
  nearestMatches: NearestMatch[];
};

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type NearbySummary = {
  sampleCount: number;
  nearestDistanceMiles: number | null;
  overall: "normal" | "review" | "alert" | "unknown";
  bacteria: "not_detected" | "coliform_detected" | "e_coli_detected" | "unknown";
  clarity: "normal" | "review" | "unknown";
  disinfection: "normal" | "low_review" | "high_alert" | "unknown";
};

export type NearbyWaterSample = WaterSample & {
  distanceMiles: number;
};

export type NearbyQueryResult = {
  data: NearbyWaterSample[];
  meta: {
    zip: string;
    origin: GeoPoint;
    count: number;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    sortBy: "distanceMiles";
    sortDir: "asc";
    nearestMatches: NearestMatch[];
  };
  nearbySummary: NearbySummary;
};

export type HealthSummary = {
  status: HealthStatus;
  reasons: string[];
};

export type SampleComputedSummary = {
  bacteria: "not_detected" | "coliform_detected" | "e_coli_detected";
  clarity: "normal" | "review";
  disinfection: "normal" | "low_review" | "high_alert";
  overall: "normal" | "review" | "alert";
};

export type NumericFieldStats = {
  field: NumericFieldKey;
  count: number;
  min: number | null;
  max: number | null;
  average: number | null;
};

export type SummaryResult = {
  totalCount: number;
  filteredCount: number;
  dateRange: {
    from: string | null;
    to: string | null;
  };
  sampleClasses: Record<string, number>;
  numeric: NumericFieldStats[];
  health: {
    overallStatus: HealthStatus;
    counts: Record<HealthStatus, number>;
  };
};
