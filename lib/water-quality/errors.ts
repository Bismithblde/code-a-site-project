export class WaterQualityValidationError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "WaterQualityValidationError";
    this.statusCode = statusCode;
  }
}
