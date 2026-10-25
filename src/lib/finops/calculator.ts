import {
  GpuWorkloadInput,
  ModelInferenceInput,
  FinOpsCalculationResult,
  FinOpsComparisonResult,
  PricingModel,
  BillingUnit,
  PriceVerificationStatus,
} from "@/types/finops";
import { VERIFIED_GPU_CATALOG, MODEL_TOKEN_RATES } from "../constants";

/**
 * Calculates deterministic GPU workload cost and/or token inference cost.
 * Audited against official Nebius AI Cloud pricing (https://nebius.com/prices).
 * Pure mathematical computation without LLM dependencies.
 */
export function calculateFinOpsCost(
  gpuInput?: GpuWorkloadInput,
  modelInput?: ModelInferenceInput
): FinOpsCalculationResult {
  const assumptions: string[] = [];
  const priceSources: FinOpsCalculationResult["priceSources"] = [];
  const unresolvedPricingWarnings: string[] = [];

  let gpuCostUsd = 0;
  let storageCostUsd = 0;
  let networkCostUsd = 0;
  let effectiveHourlyRate = 0;
  let billedHours = 0;
  let isPriceVerified = true;
  let missingPrice = false;

  const pricingModel: PricingModel = gpuInput?.pricingModel || "on-demand";
  const billingUnit: BillingUnit = gpuInput?.billingUnit || "GPU-hour";
  let instanceCount = 1;

  // 1. GPU Compute Cost Calculation
  if (gpuInput) {
    const catalogGpu = VERIFIED_GPU_CATALOG.find((g) => g.id === gpuInput.gpuId);
    billedHours = Math.max(0, gpuInput.billedHours);
    const gpuCount = Math.max(1, gpuInput.gpuCount);
    const gpusPerInstance = catalogGpu?.gpusPerInstance || 1;
    instanceCount = Math.max(1, Math.ceil(gpuCount / gpusPerInstance));

    // Handle user-entered overrides
    if (
      gpuInput.customHourlyRateUsd !== undefined &&
      gpuInput.customHourlyRateUsd !== null &&
      gpuInput.customHourlyRateUsd >= 0
    ) {
      effectiveHourlyRate = gpuInput.customHourlyRateUsd;
      isPriceVerified = false; // User override is an assumption, not an authoritative published rate

      priceSources.push({
        label: catalogGpu ? `${catalogGpu.name} (User Override)` : "Custom GPU Rate",
        rate: effectiveHourlyRate,
        unit: billingUnit === "instance-hour" ? "USD / instance-hour" : "USD / GPU-hour",
        pricingModel,
        billingUnit,
        isVerified: false,
        priceStatus: "USER_OVERRIDE",
        sourceUrl: "User-Supplied Override (Unverified)",
        lastVerifiedDate: new Date().toISOString().split("T")[0],
      });

      assumptions.push(
        `User Override Applied: $${effectiveHourlyRate.toFixed(2)}/${billingUnit} (${pricingModel}). Unverified against official cloud catalog.`
      );
    } else if (catalogGpu) {
      // Determine rate from verified catalog based on pricingModel
      let catalogRate: number | null = null;
      if (pricingModel === "preemptible") {
        catalogRate = catalogGpu.preemptibleHourlyRateUsd;
      } else {
        // Default on-demand
        catalogRate = catalogGpu.onDemandHourlyRateUsd;
      }

      if (catalogRate === null) {
        // UNKNOWN price - cannot be confirmed against official pricing page
        missingPrice = true;
        isPriceVerified = false;
        effectiveHourlyRate = 0;

        unresolvedPricingWarnings.push(
          `Official rate for ${catalogGpu.name} (${pricingModel}) is UNKNOWN or unlisted on ${catalogGpu.priceSourceUrl}. You must provide a custom hourly rate override to calculate spend.`
        );

        priceSources.push({
          label: `${catalogGpu.name} (${catalogGpu.provider})`,
          rate: null,
          unit: billingUnit === "instance-hour" ? "USD / instance-hour" : "USD / GPU-hour",
          pricingModel,
          billingUnit,
          isVerified: false,
          priceStatus: "UNKNOWN",
          sourceUrl: catalogGpu.priceSourceUrl,
          lastVerifiedDate: catalogGpu.lastVerifiedDate,
        });

        assumptions.push(
          `PRICE UNKNOWN: ${catalogGpu.name} rate requires binding contractual quote from ${catalogGpu.provider}. Spend cannot be verified.`
        );
      } else {
        // Authoritative verified price
        effectiveHourlyRate = catalogRate;
        isPriceVerified = catalogGpu.priceStatus === "VERIFIED";

        priceSources.push({
          label: `${catalogGpu.name} (${catalogGpu.provider} - ${pricingModel.toUpperCase()})`,
          rate: effectiveHourlyRate,
          unit: "USD / GPU-hour",
          pricingModel,
          billingUnit: "GPU-hour",
          isVerified: isPriceVerified,
          priceStatus: catalogGpu.priceStatus,
          sourceUrl: catalogGpu.priceSourceUrl,
          lastVerifiedDate: catalogGpu.lastVerifiedDate,
        });

        assumptions.push(
          `Authoritative Price: ${catalogGpu.provider} ${pricingModel} rate @ $${effectiveHourlyRate.toFixed(2)}/GPU-hr (Verified ${catalogGpu.lastVerifiedDate} via ${catalogGpu.priceSourceUrl}).`
        );
      }
    } else {
      // Unrecognized GPU identifier
      missingPrice = true;
      isPriceVerified = false;
      effectiveHourlyRate = 0;
      unresolvedPricingWarnings.push(`Unrecognized GPU identifier '${gpuInput.gpuId}'. Please provide a custom hourly rate.`);
    }

    // Calculate GPU compute spend taking into account billing unit (GPU-hour vs instance-hour)
    if (billingUnit === "instance-hour") {
      // If the catalog provides an explicit instance on-demand rate, use it, otherwise scale by GPUs per instance
      const instanceRate =
        catalogGpu?.instanceOnDemandRateUsd && pricingModel === "on-demand" && !gpuInput.customHourlyRateUsd
          ? catalogGpu.instanceOnDemandRateUsd
          : effectiveHourlyRate * gpusPerInstance;

      gpuCostUsd = instanceCount * billedHours * instanceRate;
      assumptions.push(
        `Instance Billing: ${instanceCount}x instance(s) (${gpusPerInstance} GPUs/inst) @ $${instanceRate.toFixed(2)}/instance-hr for ${billedHours} billed hour(s).`
      );
    } else {
      // Standard per-GPU hour billing
      gpuCostUsd = gpuCount * billedHours * effectiveHourlyRate;
      assumptions.push(
        `Compute Spend: ${gpuCount}x GPU(s) @ $${effectiveHourlyRate.toFixed(2)}/GPU-hr for ${billedHours} billed hour(s).`
      );
    }

    // Storage cost (e.g. fast NVMe scratch or persistent cloud volume)
    if (gpuInput.storageGb && gpuInput.storageRatePerGbMonthUsd) {
      const storageHourlyRate = (gpuInput.storageGb * gpuInput.storageRatePerGbMonthUsd) / 730;
      storageCostUsd = storageHourlyRate * billedHours;
    }

    // Network egress cost
    if (gpuInput.networkEgressGb && gpuInput.networkEgressRatePerGbUsd) {
      networkCostUsd = gpuInput.networkEgressGb * gpuInput.networkEgressRatePerGbUsd;
    }
  }

  // 2. Model Inference Cost Calculation
  // C_API = (input tokens * input-token rate + output tokens * output-token rate) / 1,000,000
  let inferenceCostUsd = 0;
  let inputTokensCostUsd = 0;
  let outputTokensCostUsd = 0;

  if (modelInput) {
    const catalogRate = MODEL_TOKEN_RATES.find((m) => m.modelId === modelInput.modelName);
    const inRate =
      modelInput.inputTokenRatePerMillionUsd !== undefined && modelInput.inputTokenRatePerMillionUsd !== null
        ? modelInput.inputTokenRatePerMillionUsd
        : catalogRate
        ? catalogRate.inputRatePerMillionUsd
        : 0.35;

    const outRate =
      modelInput.outputTokenRatePerMillionUsd !== undefined && modelInput.outputTokenRatePerMillionUsd !== null
        ? modelInput.outputTokenRatePerMillionUsd
        : catalogRate
        ? catalogRate.outputRatePerMillionUsd
        : 0.90;

    const inMillion = Math.max(0, modelInput.inputTokensMillion);
    const outMillion = Math.max(0, modelInput.outputTokensMillion);

    inputTokensCostUsd = inMillion * inRate;
    outputTokensCostUsd = outMillion * outRate;
    inferenceCostUsd = inputTokensCostUsd + outputTokensCostUsd;

    const tokenPriceVerified = Boolean(catalogRate?.isRateVerified && !modelInput.inputTokenRatePerMillionUsd);

    priceSources.push({
      label: `${modelInput.modelName} (Input Tokens)`,
      rate: inRate,
      unit: "USD / 1M input tokens",
      pricingModel: "on-demand",
      billingUnit: "GPU-hour",
      isVerified: tokenPriceVerified,
      priceStatus: tokenPriceVerified ? "VERIFIED" : "USER_OVERRIDE",
      sourceUrl: catalogRate ? catalogRate.priceSourceUrl : (modelInput.rateSourceUrl || "User assumption"),
      lastVerifiedDate: catalogRate ? catalogRate.lastVerifiedDate : (modelInput.lastVerifiedDate || new Date().toISOString().split("T")[0]),
    });

    priceSources.push({
      label: `${modelInput.modelName} (Output Tokens)`,
      rate: outRate,
      unit: "USD / 1M output tokens",
      pricingModel: "on-demand",
      billingUnit: "GPU-hour",
      isVerified: tokenPriceVerified,
      priceStatus: tokenPriceVerified ? "VERIFIED" : "USER_OVERRIDE",
      sourceUrl: catalogRate ? catalogRate.priceSourceUrl : (modelInput.rateSourceUrl || "User assumption"),
      lastVerifiedDate: catalogRate ? catalogRate.lastVerifiedDate : (modelInput.lastVerifiedDate || new Date().toISOString().split("T")[0]),
    });

    assumptions.push(
      `Token Inference: ${inMillion}M in @ $${inRate.toFixed(2)}/1M, ${outMillion}M out @ $${outRate.toFixed(2)}/1M.`
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
    pricingModel,
    billingUnit,
    isPriceVerified,
    missingPrice,
    breakdown: {
      billedHours,
      effectiveHourlyRateUsd: effectiveHourlyRate,
      rateUnit: billingUnit,
      gpuHourlyTotalUsd: Number((effectiveHourlyRate * (gpuInput?.gpuCount || 1)).toFixed(4)),
      instanceCount: billingUnit === "instance-hour" ? instanceCount : undefined,
      inputTokensCostUsd: Number(inputTokensCostUsd.toFixed(4)),
      outputTokensCostUsd: Number(outputTokensCostUsd.toFixed(4)),
    },
    assumptions,
    priceSources,
    unresolvedPricingWarnings,
  };
}

/**
 * Compares a baseline configuration with a proposed alternative.
 * Delta C = baseline cost - alternative cost
 *
 * Enforcement Rule: Never claim cost savings based on unverified prices or unmeasured workload performance.
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
    isEmpiricallyBenchmarked?: boolean;
  }
): FinOpsComparisonResult {
  const deltaCostUsd = Number((baselineResult.totalCostUsd - proposedResult.totalCostUsd).toFixed(4));

  let percentageDifference = 0;
  if (baselineResult.totalCostUsd > 0) {
    percentageDifference = Number(
      (((baselineResult.totalCostUsd - proposedResult.totalCostUsd) / baselineResult.totalCostUsd) * 100).toFixed(2)
    );
  }

  // Strict verification audit
  const isSavingsVerified =
    baselineResult.isPriceVerified &&
    proposedResult.isPriceVerified &&
    !baselineResult.missingPrice &&
    !proposedResult.missingPrice;

  let savingsClassification: FinOpsComparisonResult["savingsClassification"] = "UNVERIFIED_ESTIMATE";
  if (!isSavingsVerified) {
    savingsClassification = "UNVERIFIED_ESTIMATE";
  } else if (deltaCostUsd < 0) {
    savingsClassification = "NEGATIVE_SAVINGS";
  } else {
    savingsClassification = "VERIFIED_PUBLISHED";
  }

  const wasteDetections: FinOpsComparisonResult["wasteDetections"] = [];
  const feasibilityTradeoffs: string[] = [];
  const missingEvidenceWarnings: string[] = [];

  // Mandatory Unmeasured Performance Warning
  const performanceDisclaimer = context?.isEmpiricallyBenchmarked
    ? "Workload performance is empirically verified via benchmark logs."
    : "UNMEASURED PERFORMANCE NOTICE: Cost savings assume identical completion runtime. Hardware differences (such as PCIe vs NVLink bandwidth), GPU architectural memory throughput, and potential preemptible interruptions have not been empirically benchmarked. Realized savings must be confirmed via live telemetry.";

  if (!context?.isEmpiricallyBenchmarked) {
    feasibilityTradeoffs.push(performanceDisclaimer);
  }

  // Mandatory Unverified Pricing Warning
  if (!isSavingsVerified) {
    missingEvidenceWarnings.push(
      "UNVERIFIED PRICING WARNING: Cost delta incorporates unconfirmed catalog rates or user-supplied overrides. Do not commit financial resources without obtaining binding contractual quotes from cloud providers."
    );
  }

  // Waste Detection 1: Overprovisioned GPU for small models
  if (context?.modelParamBillion && context.modelParamBillion <= 14) {
    if (context.baselineGpuId?.includes("h100") || context.baselineGpuId?.includes("b200")) {
      wasteDetections.push({
        category: "OVERPROVISIONED_GPU",
        severity: "HIGH",
        description: `Running a ${context.modelParamBillion}B model on flagship H100/B200 SXM GPUs leaves over 65% of tensor core compute and memory bandwidth unutilized.`,
        potentialWasteUsd: deltaCostUsd > 0 ? deltaCostUsd : 50.0,
        recommendation: "Migrate small models (<= 14B) to NVIDIA L40S (48GB) instances to cut hourly compute spend while maintaining latency SLAs.",
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
      "Cost Reduction Notice: A lower hourly or token rate does not guarantee equal time-to-first-token (TTFT) or throughput."
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
    isSavingsVerified,
    savingsClassification,
    performanceDisclaimer,
    wasteDetections,
    feasibilityTradeoffs,
    missingEvidenceWarnings,
  };
}
