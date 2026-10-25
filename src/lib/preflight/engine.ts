import { PreflightInputs, PreflightReport, CheckResult, Finding, ProposedPatch, CheckStatus, CustomValidationRule } from "@/types/runguard";
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
  dockerResult.ruleDetails = "Scans Dockerfile for base CUDA runtime image, root non-user security, apt cache purge, and NVIDIA driver capabilities.";
  checks.push(dockerResult);
  findings.push(...dockerResult.findings);

  // 2. Dependencies check
  const depResult = checkDependencies(inputs.requirementsContent);
  depResult.ruleDetails = "Validates Python dependencies for torch-CUDA compatibility, conflicting pinned packages, and FlashAttention build prerequisites (ninja, packaging).";
  checks.push(depResult);
  findings.push(...depResult.findings);

  // 3. Workload configuration check
  const configResult = checkWorkloadConfig(inputs.workloadConfigContent, inputs.gpuCount || 1);
  configResult.ruleDetails = "Verifies container /dev/shm shared memory allocation (min 16GB or IPC: host), GPU resource limits, and multi-GPU environment parameters.";
  checks.push(configResult);
  findings.push(...configResult.findings);

  // 4. Runtime log analysis (distinguished as runtime check)
  const logResult = analyzeDiagnosticLog(inputs.diagnosticLogContent);
  logResult.ruleDetails = "Parses runtime crash traces for CUDA OOM, PyTorch DataLoader Bus errors, NCCL watchdog timeouts, and CUDA capability mismatch signatures.";
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
        isActionable: true,
      });
    }
  } else {
    unresolvedRisks.push("Model parameter count not specified: VRAM and KV-cache capacity not evaluated.");
  }

  // 6. Custom User-Defined Deterministic Rules (if any)
  if (inputs.customRules && inputs.customRules.length > 0) {
    for (const rule of inputs.customRules) {
      if (!rule.isEnabled) continue;
      const customRes = evaluateCustomRule(rule, inputs, vramEstimate);
      checks.push(customRes);
      findings.push(...customRes.findings);
    }
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

export function evaluateCustomRule(
  rule: CustomValidationRule,
  inputs: PreflightInputs,
  vramEstimate?: any
): CheckResult {
  const timestamp = new Date().toISOString();
  let status: CheckStatus = "UNKNOWN";
  let summary = "";
  const findings: Finding[] = [];

  let actualValue: number | string | null = null;
  let hasInput = false;

  switch (rule.field) {
    case "vram_allocated_gib":
      if (vramEstimate) {
        actualValue = vramEstimate.totalEstimatedVramGb;
        hasInput = true;
      }
      break;
    case "batch_size":
      if (inputs.batchSize !== undefined) {
        actualValue = inputs.batchSize;
        hasInput = true;
      }
      break;
    case "context_length":
      if (inputs.contextLengthTokens !== undefined) {
        actualValue = inputs.contextLengthTokens;
        hasInput = true;
      }
      break;
    case "gpu_count":
      if (inputs.gpuCount !== undefined) {
        actualValue = inputs.gpuCount;
        hasInput = true;
      }
      break;
    case "shm_size_gib":
      if (inputs.workloadConfigContent) {
        hasInput = true;
        const match =
          inputs.workloadConfigContent.match(/shm_size:\s*['"]?(\d+)([a-zA-Z]+)?/i) ||
          inputs.workloadConfigContent.match(/sizeLimit:\s*['"]?(\d+)([a-zA-Z]+)?/i);
        if (match) {
          const val = parseInt(match[1], 10);
          const unit = (match[2] || "g").toLowerCase();
          actualValue = unit.startsWith("m") ? val / 1024 : val;
        } else {
          actualValue = 0;
        }
      }
      break;
    case "dockerfile_content":
      if (inputs.dockerfileContent) {
        actualValue = inputs.dockerfileContent;
        hasInput = true;
      }
      break;
    case "requirements_content":
      if (inputs.requirementsContent) {
        actualValue = inputs.requirementsContent;
        hasInput = true;
      }
      break;
    case "log_content":
      if (inputs.diagnosticLogContent) {
        actualValue = inputs.diagnosticLogContent;
        hasInput = true;
      }
      break;
  }

  if (!hasInput || actualValue === null) {
    return {
      id: `custom-check-${rule.id}`,
      name: `Custom Rule: ${rule.name}`,
      category: "CUSTOM_RULE",
      status: "UNKNOWN",
      isRuntimeTest: rule.field === "log_content",
      summary: `Input for evaluation field '${rule.field}' is missing or not configured.`,
      findings: [],
      checkedAt: timestamp,
      ruleDetails: `Rule [${rule.name}]: Condition (${rule.field} ${rule.operator} ${rule.threshold}) cannot be tested without input.`,
    };
  }

  let isViolation = false;
  const numActual = typeof actualValue === "number" ? actualValue : parseFloat(String(actualValue));
  const numThreshold = parseFloat(rule.threshold);

  if (!isNaN(numActual) && !isNaN(numThreshold)) {
    switch (rule.operator) {
      case ">":
        isViolation = numActual > numThreshold;
        break;
      case "<":
        isViolation = numActual < numThreshold;
        break;
      case ">=":
        isViolation = numActual >= numThreshold;
        break;
      case "<=":
        isViolation = numActual <= numThreshold;
        break;
      case "==":
        isViolation = Math.abs(numActual - numThreshold) < 0.0001;
        break;
      case "!=":
        isViolation = Math.abs(numActual - numThreshold) >= 0.0001;
        break;
      default:
        isViolation = false;
    }
  } else {
    const strActual = String(actualValue).toLowerCase();
    const strThreshold = rule.threshold.toLowerCase();
    switch (rule.operator) {
      case "contains":
        isViolation = strActual.includes(strThreshold);
        break;
      case "missing":
        isViolation = !strActual.includes(strThreshold);
        break;
      case "==":
        isViolation = strActual.trim() === strThreshold.trim();
        break;
      case "!=":
        isViolation = strActual.trim() !== strThreshold.trim();
        break;
      default:
        isViolation = false;
    }
  }

  if (isViolation) {
    status = "FAIL";
    summary = `Violated custom threshold: ${rule.field} (${actualValue}) ${rule.operator} ${rule.threshold}.`;
    findings.push({
      id: `custom-finding-${rule.id}`,
      category: "CUSTOM_RULE",
      severity: rule.severity,
      title: `Custom Rule Violation: ${rule.name}`,
      description: rule.description || `Rule condition '${rule.field} ${rule.operator} ${rule.threshold}' was triggered.`,
      evidence: `Evaluated ${rule.field} = ${
        typeof actualValue === "string" ? actualValue.slice(0, 100) : actualValue
      }; threshold: ${rule.threshold}`,
      recommendedFix: rule.recommendedFix || "Adjust workload configuration to comply with team constraint.",
      ruleReference: `Custom Policy ID: ${rule.id}`,
      isActionable: true,
    });
  } else {
    status = "PASS";
    summary = `Complies with custom threshold: ${rule.field} (${actualValue}) within policy limits.`;
  }

  return {
    id: `custom-check-${rule.id}`,
    name: `Custom Rule: ${rule.name}`,
    category: "CUSTOM_RULE",
    status,
    isRuntimeTest: rule.field === "log_content",
    summary,
    findings,
    checkedAt: timestamp,
    ruleDetails: `Custom condition: ${rule.field} ${rule.operator} ${rule.threshold}`,
  };
}
