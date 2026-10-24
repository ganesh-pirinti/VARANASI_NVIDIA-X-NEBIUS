import { PreflightInputs, PreflightReport, CheckResult, Finding, ProposedPatch, CheckStatus } from "@/types/runguard";
import { checkDockerfile } from "./dockerfile";
import { checkDependencies } from "./dependencies";
import { checkWorkloadConfig } from "./workload-config";
import { analyzeDiagnosticLog } from "./log-analyzer";
import { estimateVram } from "./vram-estimator";

export function runPreflightChecks(inputs: PreflightInputs): PreflightReport {
  const timestamp = new Date().toISOString();
  const checks: CheckResult[] = [];
  const findings: Finding[] = [];
  const unresolvedRisks: string[] = [];

  // 1. Dockerfile check
  const dockerResult = checkDockerfile(inputs.dockerfileContent);
  checks.push(dockerResult);
  findings.push(...dockerResult.findings);

  // 2. Dependencies check
  const depResult = checkDependencies(inputs.requirementsContent);
  checks.push(depResult);
  findings.push(...depResult.findings);

  // 3. Workload configuration check
  const configResult = checkWorkloadConfig(inputs.workloadConfigContent, inputs.gpuCount || 1);
  checks.push(configResult);
  findings.push(...configResult.findings);

  // 4. Runtime log analysis (distinguished as runtime check)
  const logResult = analyzeDiagnosticLog(inputs.diagnosticLogContent);
  checks.push(logResult);
  findings.push(...logResult.findings);

  // 5. VRAM estimation if model size provided
  let vramEstimate;
  if (inputs.estimatedModelParamsBillion && inputs.estimatedModelParamsBillion > 0) {
    vramEstimate = estimateVram({
      modelParamsBillion: inputs.estimatedModelParamsBillion,
      precision: inputs.precision || "FP16",
      contextLengthTokens: inputs.contextLengthTokens || 4096,
      batchSize: inputs.batchSize || 1,
      targetGpuId: inputs.targetGpu || "nebius-h100-sxm",
      gpuCount: inputs.gpuCount || 1,
    });

    if (!vramEstimate.isFeasible) {
      findings.push({
        id: "vram-capacity-exceeded",
        category: "VRAM_CAPACITY",
        severity: "CRITICAL",
        title: "Calculated VRAM Exceeds Physical Device Memory",
        description: `Workload requires an estimated ${vramEstimate.totalEstimatedVramGb} GiB VRAM per GPU, but target GPU provides only ${vramEstimate.gpuMemoryAvailableGb} GiB.`,
        evidence: `Weights: ${vramEstimate.weightMemoryGb} GiB, KV Cache: ${vramEstimate.kvCacheMemoryGb} GiB, Overhead: ${vramEstimate.runtimeOverheadGb} GiB across ${vramEstimate.gpuCount} GPU(s).`,
        recommendedFix: "Increase GPU count for Tensor Parallelism (TP), quantize to FP8/INT4, or reduce context length/batch size.",
        ruleReference: "NVIDIA TensorRT-LLM & vLLM Capacity Sizing Guide",
      });
    }
  } else {
    unresolvedRisks.push("Model parameter count not specified: VRAM and KV-cache capacity not evaluated.");
  }

  // Derive overall status:
  // If any check FAIL -> FAIL
  // If all provided checks PASS and at least one was executed -> PASS
  // If all were UNKNOWN -> UNKNOWN
  const hasFail = checks.some((c) => c.status === "FAIL");
  const executedChecks = checks.filter((c) => c.status !== "UNKNOWN");
  let overallStatus: CheckStatus = "UNKNOWN";

  if (hasFail) {
    overallStatus = "FAIL";
  } else if (executedChecks.length > 0 && executedChecks.every((c) => c.status === "PASS")) {
    overallStatus = "PASS";
  }

  // Generate deterministic proposed patch if critical issues are found in provided files
  let suggestedPatch: ProposedPatch | undefined;

  // Case A: Missing shared memory in workload config
  if (inputs.workloadConfigContent && findings.some((f) => f.id === "cfg-missing-shm")) {
    const orig = inputs.workloadConfigContent;
    let patched = orig;
    const explanations: string[] = [];

    if (/services:/i.test(orig)) {
      // Docker compose patch
      patched = orig.replace(
        /(\s+)(image:[^\n]+)/i,
        `$1$2\n$1shm_size: '16gb'\n$1ipc: 'host'`
      );
      explanations.push("Configured 'shm_size: 16gb' and 'ipc: host' to prevent PyTorch DataLoader SIGBUS bus errors.");
    } else if (/spec:/i.test(orig)) {
      // Kubernetes pod patch
      patched = orig.replace(
        /(\s+)(containers:)/i,
        `$1volumes:\n$1- name: dshm\n$1  emptyDir:\n$1    medium: Memory\n$1    sizeLimit: 16Gi\n$1$2`
      );
      explanations.push("Mounted emptyDir volume with medium: Memory at /dev/shm in Kubernetes pod spec.");
    }

    if (patched !== orig) {
      suggestedPatch = {
        id: `patch-${Date.now()}`,
        title: "Remediate Container Shared Memory (/dev/shm) Starvation",
        targetFile: "workload-config.yaml",
        originalContent: orig,
        patchedContent: patched,
        diff: generateSimpleDiff("workload-config.yaml", orig, patched),
        explanation: explanations,
        status: "GENERATED",
        createdAt: timestamp,
      };
    }
  }

  // Case B: Dockerfile missing NVIDIA env variables
  if (!suggestedPatch && inputs.dockerfileContent && findings.some((f) => f.id === "dock-missing-driver-caps")) {
    const orig = inputs.dockerfileContent;
    const patchHeader = "ENV NVIDIA_VISIBLE_DEVICES=all\nENV NVIDIA_DRIVER_CAPABILITIES=compute,utility\n";
    const patched = `${orig}\n\n# Added by VARANASI RunGuard\n${patchHeader}`;
    suggestedPatch = {
      id: `patch-${Date.now()}`,
      title: "Add NVIDIA Container Runtime Capability Flags",
      targetFile: "Dockerfile",
      originalContent: orig,
      patchedContent: patched,
      diff: generateSimpleDiff("Dockerfile", orig, patched),
      explanation: [
        "Added NVIDIA_VISIBLE_DEVICES=all and NVIDIA_DRIVER_CAPABILITIES=compute,utility so containers can access host GPUs and CUDA driver libraries.",
      ],
      status: "GENERATED",
      createdAt: timestamp,
    };
  }

  // Case C: Requirements missing ninja for flash-attn
  if (!suggestedPatch && inputs.requirementsContent && findings.some((f) => f.id === "dep-flash-attn-missing-ninja")) {
    const orig = inputs.requirementsContent;
    const patched = `ninja>=1.11.1\npackaging>=24.0\n${orig}`;
    suggestedPatch = {
      id: `patch-${Date.now()}`,
      title: "Inject Ninja & Packaging for FlashAttention Compilation",
      targetFile: "requirements.txt",
      originalContent: orig,
      patchedContent: patched,
      diff: generateSimpleDiff("requirements.txt", orig, patched),
      explanation: [
        "Pre-pended 'ninja' and 'packaging' build-time dependencies so FlashAttention JIT compiles cleanly and efficiently.",
      ],
      status: "GENERATED",
      createdAt: timestamp,
    };
  }

  // Unresolved risks documentation
  if (!inputs.diagnosticLogContent) {
    unresolvedRisks.push("No runtime diagnostic logs analyzed. Dynamic memory allocation and NCCL communication not verified.");
  }
  if (!inputs.workloadConfigContent) {
    unresolvedRisks.push("No cluster configuration analyzed. Shared memory and GPU allocation limits remain unverified.");
  }

  return {
    id: `preflight-${Date.now()}`,
    projectName: inputs.projectName || "Unnamed AI Workload",
    timestamp,
    overallStatus,
    checks,
    findings,
    vramEstimate,
    suggestedPatch,
    unresolvedRisks,
  };
}

function generateSimpleDiff(fileName: string, orig: string, patched: string): string {
  const origLines = orig.split(/\r?\n/);
  const patchLines = patched.split(/\r?\n/);

  const diffHeader = `--- a/${fileName}\n+++ b/${fileName}\n@@ -1,${origLines.length} +1,${patchLines.length} @@\n`;
  const diffBody: string[] = [];

  const maxLen = Math.max(origLines.length, patchLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const p = patchLines[i];

    if (o === p) {
      if (o !== undefined) diffBody.push(`  ${o}`);
    } else {
      if (o !== undefined) diffBody.push(`- ${o}`);
      if (p !== undefined) diffBody.push(`+ ${p}`);
    }
  }

  return diffHeader + diffBody.join("\n");
}
