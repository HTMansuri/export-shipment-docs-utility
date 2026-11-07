export interface Box {
  boxNumber: number;
  commodity: string;
  grossWeightKg: number;
  netWeightKg: number;
  tareWeightKg: number;
  boxSize?: string;
  units?: number;
  ownerMark?: string;
}

export interface PackingSummary {
  boxCount: number;
  totalGrossWeightKg: number;
  totalNetWeightKg: number;
  totalTareWeightKg: number;
  byCommodity: Record<string, { boxCount: number; grossWeightKg: number; netWeightKg: number }>;
}
