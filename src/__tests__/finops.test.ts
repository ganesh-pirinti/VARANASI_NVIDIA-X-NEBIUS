import { describe, it, expect } from "vitest";
import { calculateFinOpsCost, compareFinOpsConfigurations } from "@/lib/finops/calculator";
import { VERIFIED_GPU_CATALOG } from "@/lib/constants";

describe("FinOps Calculation Engine", () => {
  it("calculates exact GPU compute cost C_GPU = count * hours * hourly_rate", () => {
    // 8x H100 SXM for 100 hours @ $2.85/hr
    const result = calculateFinOpsCost({
      gpuId: "nebius-h100-sxm",
      gpuCount: 8,
      billedHours: 100,
    });

    // 8 * 100 * 2.85 = 2280
    expect(result.gpuCostUsd).toBe(2280);
    expect(result.storageCostUsd).toBe(0);
    expect(result.networkCostUsd).toBe(0);
    expect(result.totalCostUsd).toBe(2280);
    expect(result.breakdown.gpuHourlyTotalUsd).toBe(22.8);
    expect(result.priceSources.length).toBeGreaterThan(0);
    expect(result.priceSources[0].sourceUrl).toContain("nebius.com");
  });

  it("calculates GPU compute cost with storage and network egress", () => {
    // 4x L40S ($1.25/hr) for 50 hours + 1000 GB storage ($0.10/GB-mo) + 500 GB network egress ($0.05/GB)
    const result = calculateFinOpsCost({
      gpuId: "nebius-l40s",
      gpuCount: 4,
      billedHours: 50,
      customHourlyRateUsd: 1.25,
      storageGb: 1000,
      storageRatePerGbMonthUsd: 0.10,
      networkEgressGb: 500,
      networkEgressRatePerGbUsd: 0.05,
    });

    const expectedGpu = 4 * 50 * 1.25; // 250
    const expectedStorage = (1000 * 0.10 / 730) * 50; // ~6.8493
    const expectedNetwork = 500 * 0.05; // 25
    const expectedTotal = expectedGpu + expectedStorage + expectedNetwork;

    expect(result.gpuCostUsd).toBe(250);
    expect(result.networkCostUsd).toBe(25);
    expect(result.totalCostUsd).toBeCloseTo(expectedTotal, 2);
  });

  it("calculates token inference cost C_API = (in_tokens * in_rate + out_tokens * out_rate) / 1,000,000", () => {
    // 10 Million input tokens @ $0.35/1M, 5 Million output tokens @ $0.90/1M
    const result = calculateFinOpsCost(undefined, {
      modelName: "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF",
      inputTokensMillion: 10,
      outputTokensMillion: 5,
      inputTokenRatePerMillionUsd: 0.35,
      outputTokenRatePerMillionUsd: 0.90,
    });

    // 10 * 0.35 + 5 * 0.90 = 3.50 + 4.50 = 8.00
    expect(result.inferenceCostUsd).toBe(8.0);
    expect(result.breakdown.inputTokensCostUsd).toBe(3.5);
    expect(result.breakdown.outputTokensCostUsd).toBe(4.5);
    expect(result.totalCostUsd).toBe(8.0);
  });

  it("calculates Delta C = baseline cost - alternative cost and percentage difference", () => {
    const baseline = calculateFinOpsCost({
      gpuId: "aws-p5-h100",
      gpuCount: 8,
      billedHours: 100,
      customHourlyRateUsd: 4.12,
    }); // 8 * 100 * 4.12 = 3296

    const proposed = calculateFinOpsCost({
      gpuId: "nebius-h100-sxm",
      gpuCount: 8,
      billedHours: 100,
      customHourlyRateUsd: 2.85,
    }); // 8 * 100 * 2.85 = 2280

    const comparison = compareFinOpsConfigurations(baseline, proposed);

    // Delta = 3296 - 2280 = 1016
    expect(comparison.deltaCostUsd).toBe(1016);
    expect(comparison.percentageDifference).toBeCloseTo((1016 / 3296) * 100, 2);
    expect(comparison.feasibilityTradeoffs.length).toBeGreaterThan(0);
    expect(comparison.missingEvidenceWarnings.length).toBeGreaterThan(0);
  });

  it("handles negative savings (proposed is more expensive) transparently", () => {
    const baseline = calculateFinOpsCost({
      gpuId: "nebius-l40s",
      gpuCount: 1,
      billedHours: 10,
      customHourlyRateUsd: 1.25,
    }); // 12.50

    const proposed = calculateFinOpsCost({
      gpuId: "nebius-h100-sxm",
      gpuCount: 1,
      billedHours: 10,
      customHourlyRateUsd: 2.85,
    }); // 28.50

    const comparison = compareFinOpsConfigurations(baseline, proposed);

    expect(comparison.deltaCostUsd).toBe(-16.0);
    expect(comparison.percentageDifference).toBe(-128);
    expect(comparison.feasibilityTradeoffs.some((t) => t.includes("increases total spend"))).toBe(true);
  });

  it("detects overprovisioned GPU waste for small models", () => {
    const baseline = calculateFinOpsCost({
      gpuId: "nebius-h100-sxm",
      gpuCount: 4,
      billedHours: 200,
    });
    const proposed = calculateFinOpsCost({
      gpuId: "nebius-l40s",
      gpuCount: 2,
      billedHours: 200,
    });

    const comparison = compareFinOpsConfigurations(baseline, proposed, {
      modelParamBillion: 8,
      baselineGpuId: "nebius-h100-sxm",
      proposedGpuId: "nebius-l40s",
    });

    expect(comparison.wasteDetections.some((w) => w.category === "OVERPROVISIONED_GPU")).toBe(true);
  });
});
