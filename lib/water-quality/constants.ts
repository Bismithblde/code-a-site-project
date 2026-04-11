import type { NumericFieldKey } from "./types";

export const DEFAULT_WATER_SAMPLES_CSV_PATH = "data/Lead_At_The_Tap_Results.csv";

export const SOURCE_COLUMNS = {
  sampleNumber: "Kit ID",
  borough: "Borough",
  zipCode: "Zipcode",
  sampleDate: "Date Collected",
  dateReceived: "Date Recieved",
  leadFirstDraw: "Lead First Draw (mg/L)",
  leadFlushOneToTwo: "Lead 1-2 Minute Flush (mg/L)",
  leadFlushFive: "Lead 5 Minute Flush (mg/L)",
  copperFirstDraw: "Copper First Draw (mg/L)",
  copperFlushOneToTwo: "Copper 1-2 Minute Flush (mg/L)",
  copperFlushFive: "Copper 5 minute Flush (mg/L)",
} as const;

export const SOURCE_COLUMN_ALIASES = {} as const;

export const NUMERIC_FIELDS: NumericFieldKey[] = [
  "leadFirstDraw",
  "leadFlushOneToTwo",
  "leadFlushFive",
  "copperFirstDraw",
  "copperFlushOneToTwo",
  "copperFlushFive",
];

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 200;
