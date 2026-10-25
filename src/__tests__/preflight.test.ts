import { describe, it, expect } from "vitest";
import { runPreflightChecks } from "@/lib/preflight/engine";
import { checkDockerfile } from "@/lib/preflight/dockerfile";
import { checkDependencies } from "@/lib/preflight/dependencies";
import { checkWorkloadConfig } from "@/lib/preflight/workload-config";
import { analyzeDiagnosticLog } from "@/lib/preflight/log-analyzer";
import { estimateVram } from "@/lib/preflight/vram-estimator";
import { POST as handlePreflight } from "@/app/api/preflight/route";
import { NextRequest } from "next/server";

describe("Deterministic Preflight Engine", () => {
  it("assigns UNKNOWN to checks when inputs are omitted (NEVER defaults to PASS)", () => {
    const report = runPreflightChecks({
      projectName: "Empty Workload Test",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 1,
    });

    expect(report.overallStatus).toBe("UNKNOWN");
    expect(report.checks.every((c) => c.status === "UNKNOWN")).toBe(true);

    // Dockerfile check alone on empty input
    const emptyDocker = checkDockerfile("");
    expect(emptyDocker.status).toBe("UNKNOWN");
    expect(emptyDocker.isRuntimeTest).toBe(false);

    // Dependencies check alone on empty input
    const emptyDep = checkDependencies("");
    expect(emptyDep.status).toBe("UNKNOWN");

    // Workload config check alone on empty input
    const emptyCfg = checkWorkloadConfig("");
    expect(emptyCfg.status).toBe("UNKNOWN");

    // Diagnostic log check alone on empty input
    const emptyLog = analyzeDiagnosticLog("");
    expect(emptyLog.status).toBe("UNKNOWN");
    expect(emptyLog.isRuntimeTest).toBe(true); // Diagnostic log check is a runtime test
  });

  it("detects missing shared memory (/dev/shm) in Kubernetes pod and assigns FAIL", () => {
    const k8sNoShm = `apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  containers:
  - name: runner
    image: pytorch/pytorch:2.4.0-cuda12.4-cudnn9-devel
    resources:
      limits:
        nvidia.com/gpu: 1`;

    const result = checkWorkloadConfig(k8sNoShm, 1);
    expect(result.status).toBe("FAIL");
    expect(result.findings.some((f) => f.id === "cfg-missing-shm")).toBe(true);
    expect(result.findings.find((f) => f.id === "cfg-missing-shm")?.severity).toBe("CRITICAL");
  });

  it("detects CUDA OOM and DataLoader Bus error in runtime log and marks FAIL with evidence", () => {
    const log = `torch.OutOfMemoryError: CUDA out of memory. Tried to allocate 5.10 GiB (GPU 0; 79.15 GiB total capacity; 75.00 GiB already allocated)
RuntimeError: DataLoader worker (pid 220) is killed by signal: Bus error.`;

    const result = analyzeDiagnosticLog(log);
    expect(result.status).toBe("FAIL");
    expect(result.isRuntimeTest).toBe(true);
    expect(result.findings.some((f) => f.id === "log-cuda-oom")).toBe(true);
    expect(result.findings.some((f) => f.id === "log-dataloader-shm-bus-error")).toBe(true);
  });

  it("detects NCCL watchdog collective timeout in multi-GPU distributed log", () => {
    const log = `[E ProcessGroupNCCL.cpp:528] Watchdog caught collective operation timeout: WorkNCCL(OpType=ALLREDUCE, Timeout(ms)=600000)`;
    const result = analyzeDiagnosticLog(log);

    expect(result.status).toBe("FAIL");
    expect(result.findings.some((f) => f.id === "log-nccl-timeout")).toBe(true);
  });

  it("calculates VRAM estimation correctly and marks infeasible when memory overflows", () => {
    // 70B model in FP16 (weights ~130.4 GiB) on 1x 80GB H100
    const estimate = estimateVram({
      modelParamsBillion: 70,
      precision: "FP16",
      contextLengthTokens: 8192,
      batchSize: 8,
      targetGpuId: "nebius-h100-sxm",
      gpuCount: 1,
    });

    expect(estimate.isFeasible).toBe(false);
    expect(estimate.weightMemoryGb).toBeGreaterThan(120);
    expect(estimate.totalEstimatedVramGb).toBeGreaterThan(80);
    expect(estimate.notes.some((n) => n.includes("CRITICAL VRAM OVERFLOW"))).toBe(true);
  });

  it("marks VRAM estimation feasible when sharded across 8x H100 GPUs in FP8", () => {
    // 70B model in FP8 across 8x H100 GPUs (approx 8.1 GiB weights/GPU)
    const estimate = estimateVram({
      modelParamsBillion: 70,
      precision: "FP8",
      contextLengthTokens: 4096,
      batchSize: 4,
      targetGpuId: "nebius-h100-sxm",
      gpuCount: 8,
    });

    expect(estimate.isFeasible).toBe(true);
    expect(estimate.totalEstimatedVramGb).toBeLessThan(80);
    expect(estimate.weightMemoryGb).toBeCloseTo(8.15, 1);
  });

  it("generates a reviewable patch when missing shared memory is found in workload config", () => {
    const report = runPreflightChecks({
      projectName: "Patch Generation Test",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 1,
      workloadConfigContent: `services:\n  vllm:\n    image: vllm/vllm-openai:latest`,
    });

    expect(report.suggestedPatch).toBeDefined();
    expect(report.suggestedPatch?.targetFile).toBe("workload-config.yaml");
    expect(report.suggestedPatch?.status).toBe("GENERATED");
    expect(report.suggestedPatch?.patchedContent).toContain("shm_size: '16gb'");
    expect(report.suggestedPatch?.diff).toContain("+");
  });

  it("evaluates custom deterministic rules and reports FAIL on threshold violation", () => {
    const report = runPreflightChecks({
      projectName: "Custom Rule Violation Test",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 1,
      batchSize: 32,
      customRules: [
        {
          id: "rule-max-batch",
          name: "Max Concurrency Policy",
          category: "WORKLOAD_RESOURCES",
          field: "batch_size",
          operator: ">",
          threshold: "16",
          severity: "HIGH",
          description: "Batch size should not exceed 16 on single GPU",
          recommendedFix: "Lower batch size to <= 16",
          isEnabled: true,
        },
      ],
    });

    const customCheck = report.checks.find((c) => c.id === "custom-check-rule-max-batch");
    expect(customCheck).toBeDefined();
    expect(customCheck?.status).toBe("FAIL");
    expect(report.findings.some((f) => f.title.includes("Max Concurrency Policy"))).toBe(true);
  });

  it("evaluates custom deterministic rules and reports PASS when compliance holds", () => {
    const report = runPreflightChecks({
      projectName: "Custom Rule Compliance Test",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 1,
      batchSize: 8,
      customRules: [
        {
          id: "rule-max-batch-ok",
          name: "Max Concurrency Policy",
          category: "WORKLOAD_RESOURCES",
          field: "batch_size",
          operator: ">",
          threshold: "16",
          severity: "HIGH",
          description: "Batch size should not exceed 16 on single GPU",
          recommendedFix: "Lower batch size to <= 16",
          isEnabled: true,
        },
      ],
    });

    const customCheck = report.checks.find((c) => c.id === "custom-check-rule-max-batch-ok");
    expect(customCheck).toBeDefined();
    expect(customCheck?.status).toBe("PASS");
  });

  it("supports independent re-verification when a configuration patch is applied", () => {
    // 1. Initial bad configuration
    const initialReport = runPreflightChecks({
      projectName: "Patch Lifecycle Test",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 1,
      workloadConfigContent: `services:\n  vllm:\n    image: vllm/vllm-openai:latest`,
    });

    expect(initialReport.overallStatus).toBe("FAIL");
    expect(initialReport.suggestedPatch).toBeDefined();

    // 2. Simulate applying the patch
    const patchedConfig = initialReport.suggestedPatch?.patchedContent || "";
    expect(patchedConfig).toContain("shm_size: '16gb'");

    // 3. Re-verify patched configuration
    const reverifiedReport = runPreflightChecks({
      projectName: "Patch Lifecycle Test",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 1,
      workloadConfigContent: patchedConfig,
    });

    const shmCheck = reverifiedReport.checks.find((c) => c.id === "check-workload-config");
    expect(shmCheck?.status).toBe("PASS");
  });

  describe("Preflight API Route (/api/preflight)", () => {
    it("returns HTTP 200 for valid preflight evaluation request", async () => {
      const req = new NextRequest("http://localhost:3000/api/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: "Production Llama Serving",
          targetGpu: "nebius-h100-sxm",
          gpuCount: 8,
          workloadConfigContent: "shm_size: '16gb'\nipc: 'host'",
        }),
      });

      const res = await handlePreflight(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.projectName).toBe("Production Llama Serving");
      expect(data.checks).toBeDefined();
    });

    it("returns HTTP 400 for malformed JSON request", async () => {
      const req = new NextRequest("http://localhost:3000/api/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{malformed_json: true",
      });

      const res = await handlePreflight(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Malformed JSON");
    });

    it("returns HTTP 413 when payload exceeds safe size limit (5MB)", async () => {
      // Create a 5.5MB mock string
      const hugeLog = "X".repeat(5.5 * 1024 * 1024);

      const req = new NextRequest("http://localhost:3000/api/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticLogContent: hugeLog,
        }),
      });

      const res = await handlePreflight(req);
      const data = await res.json();

      expect(res.status).toBe(413);
      expect(data.error).toContain("exceeds safe maximum limit");
    });
  });
});
