import { describe, it, expect } from "vitest";
import { generateRunCostPassport, renderPassportHtml } from "@/lib/passport/generator";
import { runPreflightChecks } from "@/lib/preflight/engine";
import { calculateFinOpsCost, compareFinOpsConfigurations } from "@/lib/finops/calculator";
import { POST as handlePassport } from "@/app/api/passport/route";
import { NextRequest } from "next/server";

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
      pricingModel: "preemptible", // Preemptible spot $0.79/hr
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
    expect(passport.finopsSummary.baselineCostUsd).toBe(3296);
    expect(passport.finopsSummary.proposedCostUsd).toBe(632);
    expect(passport.finopsSummary.deltaSavingsUsd).toBe(2664);
    expect(passport.finopsSummary.isSavingsVerified).toBe(true);
    expect(passport.auditTrail.length).toBeGreaterThanOrEqual(1);

    // Verify SHA-256 integrity hash is 64 hex characters
    expect(passport.integrityHash).toBeDefined();
    expect(passport.integrityHash).toMatch(/^[a-f0-9]{64}$/);

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
    expect(html).toContain(passport.integrityHash!);
    expect(html).toContain("SHA-256 Integrity Hash");
  });

  describe("Passport API Route (/api/passport)", () => {
    it("returns HTTP 200 with JSON payload for standard passport request", async () => {
      const req = new NextRequest("http://localhost:3000/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: "Production Llama Manifest",
          targetGpu: "nebius-h100-sxm",
          gpuCount: 8,
          format: "json",
        }),
      });

      const res = await handlePassport(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBeDefined();
      expect(data.targetEnvironment.projectName).toBe("Production Llama Manifest");
      expect(data.integrityHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("returns HTTP 200 with HTML attachment when format is 'html'", async () => {
      const req = new NextRequest("http://localhost:3000/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: "Export HTML Test",
          targetGpu: "nebius-h100-sxm",
          gpuCount: 4,
          format: "html",
        }),
      });

      const res = await handlePassport(req);
      const htmlText = await res.text();

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
      expect(res.headers.get("Content-Disposition")).toContain("attachment;");
      expect(htmlText).toContain("<!DOCTYPE html>");
      expect(htmlText).toContain("Export HTML Test");
    });

    it("returns HTTP 400 when request body contains malformed JSON", async () => {
      const req = new NextRequest("http://localhost:3000/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "bad-json",
      });

      const res = await handlePassport(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Malformed JSON");
    });
  });
});
