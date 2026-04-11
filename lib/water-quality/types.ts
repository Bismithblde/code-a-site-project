export type NumericComparator = "lt" | "lte" | "gt" | "gte" | "eq" | null;

export type NumericFieldKey =
  | "leadFirstDraw"
  | "leadFlushOneToTwo"
  | "leadFlushFive"
  | "copperFirstDraw"
  | "copperFlushOneToTwo"
  | "copperFlushFive";

export type SortField =
  | "sampleDate"
  | "zipCode"
  | "borough"
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
  dateReceived: string | null;
  zipCode: string | null;
  borough: string | null;
  location: string | null;
  zipCodeNormalized: string;
  boroughNormalized: string;
  locationNormalized: string;
  latitude: number | null;
  longitude: number | null;
  leadFirstDraw: NumericMeasurement;
  leadFlushOneToTwo: NumericMeasurement;
  leadFlushFive: NumericMeasurement;
  copperFirstDraw: NumericMeasurement;
  copperFlushOneToTwo: NumericMeasurement;
  copperFlushFive: NumericMeasurement;
  raw: RawCsvRow;
  issues: string[];
  sourceRowNumber: number;
};

export type WaterDataset = {
  sourcePath: string;
  loadedAt: string;
  records: WaterSample[];
  bySampleNumber: Map<string, WaterSample>;
  byZipCode: Map<string, WaterSample[]>;
  byBorough: Map<string, WaterSample[]>;
  uniqueZipCodes: string[];
  uniqueLocations: string[];
};

export type NumericRangeFilter = {
  min?: number;
  max?: number;
};

export type WaterSampleFilters = {
  zipCode?: string;
  borough?: string;
  locationText?: string;
  zip?: string;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: SortField;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  contaminants?: Partial<Record<NumericFieldKey, NumericRangeFilter>>;
};

export type NearestMatch = {
  field: "zipCode" | "borough" | "location";
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
  leadRisk: "low" | "elevated" | "high" | "unknown";
  filterRecommendation:
    | "not_needed"
    | "recommended"
    | "strongly_recommended"
    | "unknown";
  averageLeadFirstDrawMgL?: number | null;
  averageLeadFlushOneToTwoMgL?: number | null;
  averageLeadFlushFiveMgL?: number | null;
  leadRiskDistribution?: {
    low: number;
    elevated: number;
    high: number;
    unknown: number;
  };
};

export type LeadSummary = {
  sampleCount: number;
  mostRecentTestDate: string | null;
  medianFirstDraw: number | null;
  maxFirstDraw: number | null;
  percentDetected: number;
  percentElevated: number;
};

export type LeadDistributionBucket = {
  count: number;
  percent: number;
};

export type LeadDistribution = {
  notDetected: LeadDistributionBucket;
  detected: LeadDistributionBucket;
  elevated: LeadDistributionBucket;
};

export type NearbyWaterSample = WaterSample & {
  distanceMiles?: number;
};

export type NearbyQueryResult = {
  data: NearbyWaterSample[];
  meta: {
    zip: string;
    origin?: GeoPoint;
    count: number;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    sortBy: string;
    sortDir: "asc" | "desc";
    nearestMatches: NearestMatch[];
  };
  nearbySummary: NearbySummary;
  leadSummary: LeadSummary;
  distribution: LeadDistribution;
  recentTests: NearbyWaterSample[];
  notes: string;
};

export type HealthSummary = {
  status: HealthStatus;
  reasons: string[];
};

export type SampleComputedSummary = {
  leadRisk: "low" | "elevated" | "high" | "unknown";
  overall: "normal" | "review" | "alert" | "unknown";
  filterRecommendation:
    | "not_needed"
    | "recommended"
    | "strongly_recommended"
    | "unknown";
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
