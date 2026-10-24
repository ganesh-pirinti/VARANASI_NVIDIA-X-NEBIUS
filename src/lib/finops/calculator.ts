import {
  GpuWorkloadInput,
  ModelInferenceInput,
  FinOpsCalculationResult,
  FinOpsComparisonResult,
} from "@/types/finops";
import { VERIFIED_GPU_CATALOG, MODEL_TOKEN_RATES } from "../constants";

/**
 * Calculates deterministic GPU workload cost and/or token inference cost.
 * Pure mathematical computation without LLM dependencies.
 */
export function calculateFinOpsCost(
  gpuInput?: GpuWorkloadInput,
  modelInput?: ModelInferenceInput
): FinOpsCalculationResult {
  const assumptions: string[] = [];
  const priceSources: FinOpsCalculationResult["priceSources"] = [];

  let gpuCostUsd = 0;
  let storageCostUsd = 0;
  let networkCostUsd = 0;
  let effectiveHourlyRate = 0;
  let billedHours = 0;

  // 1. GPU Compute Cost Calculation
  // C_GPU = sum(GPU count * billed hours * price per GPU-hour) + storage + network
  if (gpuInput) {
    const catalogGpu = VERIFIED_GPU_CATALOG.find((g) => g.id === gpuInput.gpuId);
    effectiveHourlyRate =
      gpuInput.customHourlyRateUsd !== undefined && gpuInput.customHourlyRateUsd >= 0
        ? gpuInput.customHourlyRateUsd
        : catalogGpu
        ? catalogGpu.standardHourlyRateUsd
        : 2.85;

    billedHours = Math.max(0, gpuInput.billedHours);
    const gpuCount = Math.max(1, gpuInput.gpuCount);

    gpuCostUsd = gpuCount * billedHours * effectiveHourlyRate;

    // Storage cost (e.g. fast NVMe scratch or persistent cloud volume)
    // Monthly rate prorated to billed hours (assumes 730 hours/month)
    if (gpuInput.storageGb && gpuInput.storageRatePerGbMonthUsd) {
      const storageHourlyRate = (gpuInput.storageGb * gpuInput.storageRatePerGbMonthUsd) / 730;
      storageCostUsd = storageHourlyRate * billedHours;
    }

    // Network egress cost
    if (gpuInput.networkEgressGb && gpuInput.networkEgressRatePerGbUsd) {
      networkCostUsd = gpuInput.networkEgressGb * gpuInput.networkEgressRatePerGbUsd;
    }

    priceSources.push({
      label: catalogGpu ? `${catalogGpu.name} (${catalogGpu.provider})` : "Custom GPU Rate",
      rate: effectiveHourlyRate,
      unit: "USD / GPU-hour",
      sourceUrl: catalogGpu ? catalogGpu.priceSourceUrl : "User supplied assumption",
      lastVerifiedDate: catalogGpu ? catalogGpu.lastVerifiedDate : new Date().toISOString().split("T")[0],
    });

    assumptions.push(
      `GPU Compute: ${gpuCount}x GPU(s) @ $${effectiveHourlyRate.toFixed(2)}/GPU-hr for ${billedHours} billed hour(s).`
    );
  }

  // 2. Model Inference Cost Calculation
  // C_API = (input tokens * input-token rate + output tokens * output-token rate) / 1,000,000
  let inferenceCostUsd = 0;
  let inputTokensCostUsd = 0;
  let outputTokensCostUsd = 0;

  if (modelInput) {
    const catalogRate = MODEL_TOKEN_RATES.find((m) => m.modelId === modelInput.modelName);
    const inRate =
      modelInput.inputTokenRatePerMillionUsd !== undefined
        ? modelInput.inputTokenRatePerMillionUsd
        : catalogRate
        ? catalogRate.inputRatePerMillionUsd
        : 0.35;

    const outRate =
      modelInput.outputTokenRatePerMillionUsd !== undefined
        ? modelInput.outputTokenRatePerMillionUsd
        : catalogRate
        ? catalogRate.outputRatePerMillionUsd
        : 0.90;

    const inMillion = Math.max(0, modelInput.inputTokensMillion);
    const outMillion = Math.max(0, modelInput.outputTokensMillion);

    // Rate is per 1,000,000 tokens
    inputTokensCostUsd = inMillion * inRate;
    outputTokensCostUsd = outMillion * outRate;
    inferenceCostUsd = inputTokensCostUsd + outputTokensCostUsd;

    priceSources.push({
      label: `${modelInput.modelName} (Input)`,
      rate: inRate,
      unit: "USD / 1M input tokens",
      sourceUrl: catalogRate ? catalogRate.priceSourceUrl : (modelInput.rateSourceUrl || "User assumption"),
      lastVerifiedDate: catalogRate ? catalogRate.lastVerifiedDate : (modelInput.lastVerifiedDate || new Date().toISOString().split("T")[0]),
    });

    priceSources.push({
      label: `${modelInput.modelName} (Output)`,
      rate: outRate,
      unit: "USD / 1M output tokens",
      sourceUrl: catalogRate ? catalogRate.priceSourceUrl : (modelInput.rateSourceUrl || "User assumption"),
      lastVerifiedDate: catalogRate ? catalogRate.lastVerifiedDate : (modelInput.lastVerifiedDate || new Date().toISOString().split("T")[0]),
    });

    assumptions.push(
      `Inference Tokens: ${inMillion}M in @ $${inRate.toFixed(2)}/1M, ${outMillion}M out @ $${outRate.toFixed(2)}/1M.`
    );
  }

  const totalGpuWorkloadCostUsd = gpuCostUsd + storageCostUsd + networkCostUsd;
  const totalCostUsd = totalGpuWorkloadCostUsd + inferenceCostUsd;

  return {
    gpuCostUsd: Number(gpuCostUsd.toFixed(4)),
    storageCostUsd: Number(storageCostUsd.toFixed(4)),
    networkCostUsd: Number(networkCostUsd.toFixed(4)),
    totalGpuWorkloadCostUsd: Number(totalGpuWorkloadCostUsd.toFixed(4)),
    inferenceCostUsd: Number(inferenceCostUsd.toFixed(4)),
    totalCostUsd: Number(totalCostUsd.toFixed(4)),
    breakdown: {
      billedHours,
      effectiveHourlyRateUsd: effectiveHourlyRate,
      gpuHourlyTotalUsd: Number((effectiveHourlyRate * (gpuInput?.gpuCount || 1)).toFixed(4)),
      inputTokensCostUsd: Number(inputTokensCostUsd.toFixed(4)),
      outputTokensCostUsd: Number(outputTokensCostUsd.toFixed(4)),
    },
    assumptions,
    priceSources,
  };
}

/**
 * Compares a baseline configuration with a proposed alternative.
 * Delta C = baseline cost - alternative cost
 */
export function compareFinOpsConfigurations(
  baselineResult: FinOpsCalculationResult,
  proposedResult: FinOpsCalculationResult,
  context?: {
    baselineGpuId?: string;
    proposedGpuId?: string;
    baselinePrecision?: string;
    proposedPrecision?: string;
    modelParamBillion?: number;
  }
): FinOpsComparisonResult {
  const deltaCostUsd = Number((baselineResult.totalCostUsd - proposedResult.totalCostUsd).toFixed(4));
  
  let percentageDifference = 0;
  if (baselineResult.totalCostUsd > 0) {
    percentageDifference = Number(
      (((baselineResult.totalCostUsd - proposedResult.totalCostUsd) / baselineResult.totalCostUsd) * 100).toFixed(2)
    );
  }

  const wasteDetections: FinOpsComparisonResult["wasteDetections"] = [];
  const feasibilityTradeoffs: string[] = [];
  const missingEvidenceWarnings: string[] = [];

  // Waste Detection 1: Overprovisioned GPU for small models
  if (context?.modelParamBillion && context.modelParamBillion <= 14) {
    if (context.baselineGpuId?.includes("h100") || context.baselineGpuId?.includes("b200")) {
      wasteDetections.push({
        category: "OVERPROVISIONED_GPU",
        severity: "HIGH",
        description: `Running a ${context.modelParamBillion}B model on flagship H100/B200 SXM GPUs leaves over 65% of tensor core compute and memory bandwidth unutilized.`,
        potentialWasteUsd: deltaCostUsd > 0 ? deltaCostUsd : 50.0,
        recommendation: "Migrate small models (<= 14B) to NVIDIA L40S (48GB) or A100 instances to cut hourly compute spend by 50-60%.",
      });
    }
  }

  // Waste Detection 2: Suboptimal Precision (FP32 vs FP16/BF16/FP8)
  if (context?.baselinePrecision === "FP32") {
    wasteDetections.push({
      category: "SUBOPTIMAL_PRECISION",
      severity: "CRITICAL",
      description: "Baseline uses FP32 single precision. Modern NVIDIA Tensor Cores are optimized for FP16, BF16, and FP8, which require 50% to 75% less VRAM and deliver up to 4x throughput.",
      potentialWasteUsd: Number((baselineResult.totalCostUsd * 0.4).toFixed(2)),
      recommendation: "Adopt BF16 or FP8 execution with FlashAttention / TensorRT-LLM.",
    });
  }

  // Feasibility Trade-offs
  if (deltaCostUsd > 0) {
    feasibilityTradeoffs.push(
      "Cost Reduction Notice: A lower hourly or token rate does not guarantee equal time-to-first-token (TTFT) or inference latency."
    );
    if (context?.proposedGpuId?.includes("l40s") && context?.baselineGpuId?.includes("h100")) {
      feasibilityTradeoffs.push(
        "Hardware Architecture Trade-off: L40S utilizes PCIe 4.0 (64 GB/s) rather than NVLink 4 (900 GB/s). Multi-GPU tensor parallel scaling will exhibit higher inter-node latency."
      );
    }
  } else if (deltaCostUsd < 0) {
    feasibilityTradeoffs.push(
      `Proposed configuration increases total spend by $${Math.abs(deltaCostUsd).toFixed(2)} (+${Math.abs(percentageDifference).toFixed(1)}%). Justify based on throughput requirements or SLA margins.`
    );
  }

  // Missing evidence documentation
  missingEvidenceWarnings.push("Price comparison is based on published spot/on-demand list prices. Enterprise volume discounts or committed use discounts are not applied.");
  missingEvidenceWarnings.push("Workload execution latency is assumed equivalent unless empirical benchmark logs are provided.");

  return {
    baseline: baselineResult,
    proposed: proposedResult,
    deltaCostUsd,
    percentageDifference,
    wasteDetections,
    feasibilityTradeoffs,
    missingEvidenceWarnings,
  };
}
