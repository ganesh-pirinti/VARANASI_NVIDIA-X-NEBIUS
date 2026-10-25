import { describe, it, expect } from "vitest";
import { calculateFinOpsCost, compareFinOpsConfigurations } from "@/lib/finops/calculator";
import { VERIFIED_GPU_CATALOG } from "@/lib/constants";

describe("Audited FinOps Calculation Engine (https://nebius.com/prices)", () => {
  it("calculates exact Nebius H100 compute cost at official verified on-demand rate ($4.50/GPU-hr)", () => {
    // 8x H100 SXM for 100 hours @ official on-demand $4.50/hr
    const result = calculateFinOpsCost({
      gpuId: "nebius-h100-sxm",
      gpuCount: 8,
      billedHours: 100,
      pricingModel: "on-demand",
      billingUnit: "GPU-hour",
    });

    // 8 * 100 * 4.50 = 3600
    expect(result.gpuCostUsd).toBe(3600);
    expect(result.storageCostUsd).toBe(0);
    expect(result.networkCostUsd).toBe(0);
    expect(result.totalCostUsd).toBe(3600);
    expect(result.breakdown.gpuHourlyTotalUsd).toBe(36.0);
    expect(result.pricingModel).toBe("on-demand");
    expect(result.billingUnit).toBe("GPU-hour");
    expect(result.isPriceVerified).toBe(true);
    expect(result.missingPrice).toBe(false);

    // Source attribution verification
    expect(result.priceSources.length).toBe(1);
    expect(result.priceSources[0].sourceUrl).toBe("https://nebius.com/prices");
    expect(result.priceSources[0].lastVerifiedDate).toBe("2026-10-25");
    expect(result.priceSources[0].priceStatus).toBe("VERIFIED");
  });

  it("calculates exact Nebius H100 compute cost at official verified preemptible spot rate ($0.79/GPU-hr)", () => {
    // 8x H100 SXM for 100 hours @ official preemptible spot $0.79/hr
    const result = calculateFinOpsCost({
      gpuId: "nebius-h100-sxm",
      gpuCount: 8,
      billedHours: 100,
      pricingModel: "preemptible",
      billingUnit: "GPU-hour",
    });

    // 8 * 100 * 0.79 = 632
    expect(result.gpuCostUsd).toBe(632);
    expect(result.pricingModel).toBe("preemptible");
    expect(result.isPriceVerified).toBe(true);
    expect(result.priceSources[0].sourceUrl).toBe("https://nebius.com/prices");
    expect(result.priceSources[0].pricingModel).toBe("preemptible");
  });

  it("verifies GPU-hour versus Instance-hour unit calculations and conversions", () => {
    // AWS p5.48xlarge has 8 GPUs per instance.
    // Case 1: GPU-hour unit (8 GPUs * 10 hours * $4.12/GPU-hr = $329.60)
    const gpuHourResult = calculateFinOpsCost({
      gpuId: "aws-p5-h100",
      gpuCount: 8,
      billedHours: 10,
      billingUnit: "GPU-hour",
    });
    expect(gpuHourResult.gpuCostUsd).toBe(329.6);
    expect(gpuHourResult.breakdown.rateUnit).toBe("GPU-hour");

    // Case 2: Instance-hour unit (1 instance * 10 hours * $32.96/instance-hr = $329.60)
    const instanceHourResult = calculateFinOpsCost({
      gpuId: "aws-p5-h100",
      gpuCount: 8,
      billedHours: 10,
      billingUnit: "instance-hour",
    });
    expect(instanceHourResult.gpuCostUsd).toBe(329.6);
    expect(instanceHourResult.breakdown.instanceCount).toBe(1);
    expect(instanceHourResult.breakdown.rateUnit).toBe("instance-hour");

    // Case 3: 16 GPUs = 2 instances on instance-hour billing
    const multiInstanceResult = calculateFinOpsCost({
      gpuId: "aws-p5-h100",
      gpuCount: 16,
      billedHours: 10,
      billingUnit: "instance-hour",
    });
    // 2 instances * 10 hours * $32.96 = 659.20
    expect(multiInstanceResult.gpuCostUsd).toBe(659.2);
    expect(multiInstanceResult.breakdown.instanceCount).toBe(2);
  });

  it("marks unconfirmed rates as UNKNOWN and requires user-provided override", () => {
    // A100 is not listed on active self-serve nebius.com/prices
    const unconfirmedResult = calculateFinOpsCost({
      gpuId: "nebius-a100-80gb-sxm",
      gpuCount: 1,
      billedHours: 50,
      pricingModel: "on-demand",
    });

    expect(unconfirmedResult.missingPrice).toBe(true);
    expect(unconfirmedResult.isPriceVerified).toBe(false);
    expect(unconfirmedResult.gpuCostUsd).toBe(0);
    expect(unconfirmedResult.unresolvedPricingWarnings.length).toBeGreaterThan(0);
    expect(unconfirmedResult.unresolvedPricingWarnings[0]).toContain("UNKNOWN or unlisted");
    expect(unconfirmedResult.priceSources[0].priceStatus).toBe("UNKNOWN");
    expect(unconfirmedResult.priceSources[0].rate).toBeNull();

    // When user provides an override rate, spend is calculated but explicitly marked unverified
    const overrideResult = calculateFinOpsCost({
      gpuId: "nebius-a100-80gb-sxm",
      gpuCount: 1,
      billedHours: 50,
      customHourlyRateUsd: 2.15,
    });

    expect(overrideResult.gpuCostUsd).toBe(107.5); // 1 * 50 * 2.15
    expect(overrideResult.isPriceVerified).toBe(false);
    expect(overrideResult.priceSources[0].priceStatus).toBe("USER_OVERRIDE");
    expect(overrideResult.priceSources[0].sourceUrl).toContain("User-Supplied Override");
  });

  it("calculates token inference cost C_API accurately with verified Nebius Token Factory pricing", () => {
    // 10M input tokens @ $0.35/1M, 5M output tokens @ $0.90/1M on Nemotron 70B
    const result = calculateFinOpsCost(undefined, {
      modelName: "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF",
      inputTokensMillion: 10,
      outputTokensMillion: 5,
    });

    // 10 * 0.35 + 5 * 0.90 = 3.50 + 4.50 = 8.00
    expect(result.inferenceCostUsd).toBe(8.0);
    expect(result.breakdown.inputTokensCostUsd).toBe(3.5);
    expect(result.breakdown.outputTokensCostUsd).toBe(4.5);
    expect(result.totalCostUsd).toBe(8.0);
    expect(result.priceSources[0].sourceUrl).toBe("https://tokenfactory.nebius.com/pricing");
  });

  it("never claims cost savings based on unverified prices", () => {
    // Baseline: Verified AWS p5.48xlarge ($4.12/GPU-hr on-demand)
    const baseline = calculateFinOpsCost({
      gpuId: "aws-p5-h100",
      gpuCount: 8,
      billedHours: 100,
    }); // 8 * 100 * 4.12 = $3296

    // Proposed: User override on UNKNOWN A100 ($2.15/GPU-hr) -> UNVERIFIED
    const proposed = calculateFinOpsCost({
      gpuId: "nebius-a100-80gb-sxm",
      gpuCount: 8,
      billedHours: 100,
      customHourlyRateUsd: 2.15,
    }); // 8 * 100 * 2.15 = $1720

    const comparison = compareFinOpsConfigurations(baseline, proposed);

    // Delta is positive (3296 - 1720 = 1576), BUT savings must NOT be classified as verified!
    expect(comparison.deltaCostUsd).toBe(1576);
    expect(comparison.isSavingsVerified).toBe(false);
    expect(comparison.savingsClassification).toBe("UNVERIFIED_ESTIMATE");
    expect(comparison.missingEvidenceWarnings.some((w) => w.includes("UNVERIFIED PRICING WARNING"))).toBe(true);
  });

  it("classifies savings as VERIFIED_PUBLISHED only when both baseline and proposed rates match authoritative sources", () => {
    // Baseline: AWS p5.48xlarge ($4.12/GPU-hr) -> Verified on aws.amazon.com
    const baseline = calculateFinOpsCost({
      gpuId: "aws-p5-h100",
      gpuCount: 8,
      billedHours: 100,
    }); // $3296

    // Proposed: Nebius L40S ($1.55/GPU-hr on-demand) -> Verified on nebius.com/prices
    const proposed = calculateFinOpsCost({
      gpuId: "nebius-l40s",
      gpuCount: 8,
      billedHours: 100,
    }); // 8 * 100 * 1.55 = $1240

    const comparison = compareFinOpsConfigurations(baseline, proposed);

    expect(comparison.deltaCostUsd).toBe(2056); // 3296 - 1240
    expect(comparison.isSavingsVerified).toBe(true);
    expect(comparison.savingsClassification).toBe("VERIFIED_PUBLISHED");
    expect(comparison.missingEvidenceWarnings.some((w) => w.includes("UNVERIFIED PRICING WARNING"))).toBe(false);
  });

  it("always includes unmeasured workload performance notice when empirical benchmarks are absent", () => {
    const baseline = calculateFinOpsCost({ gpuId: "nebius-h100-sxm", gpuCount: 8, billedHours: 50 });
    const proposed = calculateFinOpsCost({ gpuId: "nebius-l40s", gpuCount: 8, billedHours: 50 });

    const comparison = compareFinOpsConfigurations(baseline, proposed);

    expect(comparison.performanceDisclaimer).toContain("UNMEASURED PERFORMANCE NOTICE");
    expect(comparison.performanceDisclaimer).toContain("identical completion runtime");
    expect(comparison.feasibilityTradeoffs.some((t) => t.includes("UNMEASURED PERFORMANCE NOTICE"))).toBe(true);
  });

  it("handles negative savings (proposed spend increases) transparently", () => {
    const baseline = calculateFinOpsCost({
      gpuId: "nebius-l40s",
      gpuCount: 1,
      billedHours: 10,
    }); // 1 * 10 * 1.55 = 15.50

    const proposed = calculateFinOpsCost({
      gpuId: "nebius-h100-sxm",
      gpuCount: 1,
      billedHours: 10,
    }); // 1 * 10 * 4.50 = 45.00

    const comparison = compareFinOpsConfigurations(baseline, proposed);

    expect(comparison.deltaCostUsd).toBe(-29.5);
    expect(comparison.savingsClassification).toBe("NEGATIVE_SAVINGS");
    expect(comparison.feasibilityTradeoffs.some((t) => t.includes("increases total spend"))).toBe(true);
  });
});
