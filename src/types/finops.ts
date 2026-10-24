export interface GpuSpec {
  id: string;
  name: string;
  architecture: string; // Hopper, Ada Lovelace, Blackwell, Ampere
  vramGb: number;
  memoryBandwidthTbSec: number;
  fp16Tflops: number;
  fp8Tflops?: number;
  interconnect: string; // NVLink 900 GB/s, PCIe 4.0, etc.
  standardHourlyRateUsd: number;
  provider: "Nebius" | "NVIDIA Cloud" | "AWS" | "Custom";
  priceSourceUrl: string;
  lastVerifiedDate: string; // ISO date string
}

export interface GpuWorkloadInput {
  gpuId: string;
  gpuCount: number;
  billedHours: number;
  customHourlyRateUsd?: number;
  storageGb?: number;
  storageRatePerGbMonthUsd?: number;
  networkEgressGb?: number;
  networkEgressRatePerGbUsd?: number;
  notes?: string;
}

export interface ModelInferenceInput {
  modelName: string;
  inputTokensMillion: number;
  outputTokensMillion: number;
  inputTokenRatePerMillionUsd: number;
  outputTokenRatePerMillionUsd: number;
  requestCount?: number;
  rateSourceUrl?: string;
  lastVerifiedDate?: string;
}

export interface FinOpsCalculationResult {
  gpuCostUsd: number;
  storageCostUsd: number;
  networkCostUsd: number;
  totalGpuWorkloadCostUsd: number;
  inferenceCostUsd: number;
  totalCostUsd: number;
  breakdown: {
    billedHours: number;
    effectiveHourlyRateUsd: number;
    gpuHourlyTotalUsd: number;
    inputTokensCostUsd: number;
    outputTokensCostUsd: number;
  };
  assumptions: string[];
  priceSources: {
    label: string;
    rate: number;
    unit: string;
    sourceUrl: string;
    lastVerifiedDate: string;
  }[];
}

export interface FinOpsComparisonResult {
  baseline: FinOpsCalculationResult;
  proposed: FinOpsCalculationResult;
  deltaCostUsd: number; // positive = savings, negative = increase
  percentageDifference: number; // positive = percent reduction
  wasteDetections: {
    category: "OVERPROVISIONED_GPU" | "IDLE_RESOURCES" | "SUBOPTIMAL_PRECISION" | "INEFFICIENT_BATCHING";
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    description: string;
    potentialWasteUsd: number;
    recommendation: string;
  }[];
  feasibilityTradeoffs: string[];
  missingEvidenceWarnings: string[];
}
