import { describe, it, expect } from "vitest";
import { generateRunCostPassport, renderPassportHtml } from "@/lib/passport/generator";
import { runPreflightChecks } from "@/lib/preflight/engine";
import { calculateFinOpsCost, compareFinOpsConfigurations } from "@/lib/finops/calculator";

describe("Run & Cost Passport Generation", () => {
  it("generates a complete structured passport with audit trail and calculations", () => {
    const preflight = runPreflightChecks({
      projectName: "Nemotron Production Cluster",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 8,
      estimatedModelParamsBillion: 70,
      precision: "FP8",
      workloadConfigContent: `services:\n  worker:\n    image: vllm:latest\n    shm_size: '16g'`,
    });

    const baseline = calculateFinOpsCost({
      gpuId: "aws-p5-h100",
      gpuCount: 8,
      billedHours: 100,
    });
    const proposed = calculateFinOpsCost({
      gpuId: "nebius-h100-sxm",
      gpuCount: 8,
      billedHours: 100,
    });
    const comparison = compareFinOpsConfigurations(baseline, proposed);

    const passport = generateRunCostPassport({
      projectName: "Nemotron Production Cluster",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 8,
      preflightReport: preflight,
      finopsComparison: comparison,
    });

    expect(passport.id).toBeDefined();
    expect(passport.targetEnvironment.projectName).toBe("Nemotron Production Cluster");
    expect(passport.finopsSummary.baselineCostUsd).toBeGreaterThan(0);
    expect(passport.finopsSummary.deltaSavingsUsd).toBeGreaterThan(0);
    expect(passport.auditTrail.length).toBeGreaterThanOrEqual(1);

    // Verify secrets are NOT exposed
    const passportJson = JSON.stringify(passport);
    expect(passportJson).not.toContain("sk-");
    expect(passportJson).not.toContain("NEBIUS_API_KEY");
    expect(passportJson).not.toContain("TAVILY_API_KEY");
  });

  it("renders a standalone valid HTML report with correct meta fields", () => {
    const preflight = runPreflightChecks({
      projectName: "HTML Report Test",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 4,
    });

    const passport = generateRunCostPassport({
      projectName: "HTML Report Test",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 4,
      preflightReport: preflight,
    });

    const html = renderPassportHtml(passport);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("VARANASI — Autonomous GPU RunGuard & FinOps Margin Engine");
    expect(html).toContain("HTML Report Test");
    expect(html).toContain(passport.id);
  });
});
