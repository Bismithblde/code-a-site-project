export type TapWaterStatus = "normal" | "review" | "alert" | "unknown";

export type TapWaterLeadRisk = "low" | "elevated" | "high" | "unknown";
export type TapWaterFilterRecommendation =
  | "not_needed"
  | "recommended"
  | "strongly_recommended"
  | "unknown";

export type TapWaterSampleSummary = {
  leadRisk: TapWaterLeadRisk;
  overall: TapWaterStatus;
  filterRecommendation: TapWaterFilterRecommendation;
};

export type TapWaterHealthSummary = {
  status: "normal" | "watch" | "alert" | "unknown";
  reasons: string[];
};

export type TapWaterMeasurement = {
  raw: string | null;
  value: number | null;
  comparator: "lt" | "lte" | "gt" | "gte" | "eq" | null;
  parseError: string | null;
};

export type TapWaterSample = {
  id: string;
  sampleNumber: string | null;
  sampleDate: string | null;
  sampleTime: string | null;
  sampledAt: string | null;
  dateReceived: string | null;
  zipCode: string | null;
  borough: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  leadFirstDraw: TapWaterMeasurement;
  leadFlushOneToTwo: TapWaterMeasurement;
  leadFlushFive: TapWaterMeasurement;
  copperFirstDraw: TapWaterMeasurement;
  copperFlushOneToTwo: TapWaterMeasurement;
  copperFlushFive: TapWaterMeasurement;
  distanceMiles?: number;
  summary: TapWaterSampleSummary;
  healthSummary: TapWaterHealthSummary;
};

export type TapWaterNearbySummary = {
  sampleCount: number;
  nearestDistanceMiles: number | null;
  overall: TapWaterStatus;
  leadRisk: TapWaterLeadRisk;
  filterRecommendation: TapWaterFilterRecommendation;
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

export type TapWaterMeta = {
  zip?: string;
  origin?: {
    latitude: number;
    longitude: number;
  };
  count?: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortDir: "asc" | "desc";
};

export type TapWaterSearchResponse = {
  data: TapWaterSample[];
  meta: TapWaterMeta;
  nearbySummary: TapWaterNearbySummary;
};

export type TapWaterSearchMode = "zip" | "location";
