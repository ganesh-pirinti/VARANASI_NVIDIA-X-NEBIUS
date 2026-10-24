import { describe, it, expect } from "vitest";
import { runPreflightChecks } from "@/lib/preflight/engine";
import { checkDockerfile } from "@/lib/preflight/dockerfile";
import { checkDependencies } from "@/lib/preflight/dependencies";
import { checkWorkloadConfig } from "@/lib/preflight/workload-config";
import { analyzeDiagnosticLog } from "@/lib/preflight/log-analyzer";
import { estimateVram } from "@/lib/preflight/vram-estimator";

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
});
