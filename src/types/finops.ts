export type PricingModel = "on-demand" | "preemptible" | "custom";
export type BillingUnit = "GPU-hour" | "instance-hour";
export type PriceVerificationStatus = "VERIFIED" | "UNKNOWN" | "USER_OVERRIDE";

export interface GpuSpec {
  id: string;
  name: string;
  architecture: string; // Hopper, Ada Lovelace, Blackwell, Ampere
  vramGb: number;
  memoryBandwidthTbSec: number;
  fp16Tflops: number;
  fp8Tflops?: number;
  interconnect: string; // NVLink 900 GB/s, PCIe 4.0, etc.
  
  // Explicitly distinguished On-Demand vs Preemptible pricing
  onDemandHourlyRateUsd: number | null; // null if UNKNOWN / requires quote
  preemptibleHourlyRateUsd: number | null; // null if UNKNOWN / unsupported
  
  // Multi-GPU instance support (e.g., AWS p5.48xlarge = 8x H100)
  gpusPerInstance: number;
  instanceOnDemandRateUsd?: number | null;
  instancePreemptibleRateUsd?: number | null;
  
  priceStatus: PriceVerificationStatus;
  provider: "Nebius" | "NVIDIA Cloud" | "AWS" | "Custom";
  priceSourceUrl: string;
  lastVerifiedDate: string; // ISO date string e.g. "2026-02-20"
  pricingNotes?: string;
}

export interface GpuWorkloadInput {
  gpuId: string;
  gpuCount: number;
  billedHours: number;
  pricingModel?: PricingModel;
  billingUnit?: BillingUnit;
  customHourlyRateUsd?: number | null; // User-entered override
  storageGb?: number;
  storageRatePerGbMonthUsd?: number;
  networkEgressGb?: number;
  networkEgressRatePerGbUsd?: number;
  isEmpiricallyMeasured?: boolean; // Distinguishes measured benchmarks from assumed runtime
  measuredRuntimeHours?: number;
  notes?: string;
}

export interface ModelInferenceInput {
  modelName: string;
  inputTokensMillion: number;
  outputTokensMillion: number;
  inputTokenRatePerMillionUsd?: number | null;
  outputTokenRatePerMillionUsd?: number | null;
  requestCount?: number;
  rateSourceUrl?: string;
  lastVerifiedDate?: string;
  isRateVerified?: boolean;
}

export interface FinOpsPriceSource {
  label: string;
  rate: number | null;
  unit: string;
  pricingModel: PricingModel;
  billingUnit: BillingUnit;
  isVerified: boolean;
  priceStatus: PriceVerificationStatus;
  sourceUrl: string;
  lastVerifiedDate: string;
}

export interface FinOpsCalculationResult {
  gpuCostUsd: number;
  storageCostUsd: number;
  networkCostUsd: number;
  totalGpuWorkloadCostUsd: number;
  inferenceCostUsd: number;
  totalCostUsd: number;
  pricingModel: PricingModel;
  billingUnit: BillingUnit;
  isPriceVerified: boolean;
  missingPrice: boolean;
  breakdown: {
    billedHours: number;
    effectiveHourlyRateUsd: number;
    rateUnit: BillingUnit;
    gpuHourlyTotalUsd: number;
    instanceCount?: number;
    inputTokensCostUsd: number;
    outputTokensCostUsd: number;
  };
  assumptions: string[];
  priceSources: FinOpsPriceSource[];
  unresolvedPricingWarnings: string[];
}

export interface FinOpsComparisonResult {
  baseline: FinOpsCalculationResult;
  proposed: FinOpsCalculationResult;
  deltaCostUsd: number; // positive = savings, negative = increase
  percentageDifference: number; // positive = percent reduction
  isSavingsVerified: boolean; // TRUE only if BOTH baseline and proposed have verified pricing
  savingsClassification: "VERIFIED_PUBLISHED" | "UNVERIFIED_ESTIMATE" | "NEGATIVE_SAVINGS";
  performanceDisclaimer: string;
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
