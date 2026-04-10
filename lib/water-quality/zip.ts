import { WaterQualityValidationError } from "./errors";

const ZIP_CODE_PATTERN = /^\d{5}$/;

export function normalizeZipCode(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function assertValidZipCode(value: string | null | undefined) {
  const zip = normalizeZipCode(value);

  if (!zip || !ZIP_CODE_PATTERN.test(zip)) {
    throw new WaterQualityValidationError(
      "ZIP code must be a valid 5-digit NYC ZIP code.",
    );
  }

  return zip;
}
