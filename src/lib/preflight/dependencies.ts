import { CheckResult, Finding, CheckStatus } from "@/types/runguard";
import { CUDA_PYTORCH_COMPATIBILITY_RULES } from "../constants";

export function checkDependencies(content?: string): CheckResult {
  const timestamp = new Date().toISOString();
  if (!content || content.trim().length === 0) {
    return {
      id: "check-dependencies",
      name: "Python Dependencies & PyTorch/CUDA Alignment",
      category: "DEPENDENCIES_CUDA",
      status: "UNKNOWN",
      isRuntimeTest: false,
      summary: "No requirements.txt or dependency file provided. Static dependency checks skipped.",
      findings: [],
      checkedAt: timestamp,
    };
  }

  const findings: Finding[] = [];
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("#"));

  const hasTorch = lines.some((l) => /^torch\b/i.test(l));
  const hasFlashAttn = lines.some((l) => /^flash-attn\b/i.test(l));
  const hasNinja = lines.some((l) => /^ninja\b/i.test(l));
  const hasVllm = lines.some((l) => /^vllm\b/i.test(l));
  const hasTriton = lines.some((l) => /^triton\b/i.test(l));

  // 1. PyTorch Presence and Pinning Check
  if (hasTorch) {
    const torchLine = lines.find((l) => /^torch\b/i.test(l)) || "";
    // Check if unpinned e.g., simply "torch"
    if (/^torch\s*$/i.test(torchLine)) {
      findings.push({
        id: "dep-unpinned-torch",
        category: "DEPENDENCIES_CUDA",
        severity: "HIGH",
        title: "Unpinned PyTorch Version Detected",
        description:
          "Installing 'torch' without an exact pinned version and CUDA wheel index can pull CPU-only wheels or unintended major version breaks at container build time.",
        evidence: torchLine,
        recommendedFix:
          "Pin exact torch version with CUDA index, e.g.: torch==2.4.1+cu124 --extra-index-url https://download.pytorch.org/whl/cu124",
        ruleReference: "PyTorch Official Distribution Guide",
      });
    }

    // Check version compatibility if version specified
    const match = torchLine.match(/torch\s*(?:==|>=|~=)\s*([0-9]+\.[0-9]+)/i);
    if (match) {
      const majorMinor = match[1];
      const rule = CUDA_PYTORCH_COMPATIBILITY_RULES.find((r) => r.pytorchVersion === majorMinor);
      if (rule) {
        // Evidence notes supported CUDA runtimes
        findings.push({
          id: `dep-torch-cuda-compat-${majorMinor}`,
          category: "DEPENDENCIES_CUDA",
          severity: "INFO",
          title: `PyTorch ${majorMinor} Compatibility Matrix`,
          description: `PyTorch ${majorMinor} is verified compatible with CUDA versions: ${rule.supportedCuda.join(", ")}. Recommended CUDA is ${rule.recommendedCuda}.`,
          evidence: `Declared: ${torchLine}`,
          recommendedFix: `Ensure container or host CUDA driver is at least CUDA ${rule.recommendedCuda}.`,
          ruleReference: rule.sourceDoc,
        });
      }
    }
  } else {
    // If vLLM or deepspeed is requested without torch
    if (hasVllm) {
      findings.push({
        id: "dep-missing-explicit-torch",
        category: "DEPENDENCIES_CUDA",
        severity: "MEDIUM",
        title: "Implicit PyTorch Dependency via vLLM",
        description:
          "vLLM requires a matching PyTorch and CUDA runtime. Relying on implicit transitive installation can lead to wheel resolution mismatches.",
        evidence: "Found vllm without explicit torch pin in requirements",
        recommendedFix: "Explicitly declare torch==2.4.0 (or vLLM bundled version) in dependencies.",
        ruleReference: "vLLM Installation Guidelines",
      });
    }
  }

  // 2. FlashAttention Build Dependencies
  if (hasFlashAttn) {
    if (!hasNinja) {
      findings.push({
        id: "dep-flash-attn-missing-ninja",
        category: "DEPENDENCIES_CUDA",
        severity: "HIGH",
        title: "flash-attn Declared Without Ninja Build System",
        description:
          "Building or installing flash-attn from source without 'ninja' installed causes the JIT compilation to fail or take over 45 minutes on cloud nodes.",
        evidence: "Found flash-attn without ninja in dependencies",
        recommendedFix: "Add 'ninja>=1.11.1' to your requirements file before flash-attn, or use pre-compiled wheels.",
        ruleReference: "Dao-AILab/flash-attention Build Specifications",
      });
    }
    // Check if flash-attn is unpinned
    const faLine = lines.find((l) => /^flash-attn\b/i.test(l)) || "";
    if (/^flash-attn\s*$/i.test(faLine)) {
      findings.push({
        id: "dep-unpinned-flash-attn",
        category: "DEPENDENCIES_CUDA",
        severity: "MEDIUM",
        title: "Unpinned flash-attn May Induce CUDA ABI Incompatibility",
        description:
          "FlashAttention C++ extensions are strictly tied to specific PyTorch and CUDA ABI releases.",
        evidence: faLine,
        recommendedFix: "Pin exact release, e.g., 'flash-attn==2.6.3 --no-build-isolation'.",
        ruleReference: "FlashAttention Release Notes",
      });
    }
  }

  // 3. Check for multiple conflicting torch packages (e.g. torch and torchvision incompatible)
  const hasTorchVision = lines.some((l) => /^torchvision\b/i.test(l));
  const hasTorchAudio = lines.some((l) => /^torchaudio\b/i.test(l));
  if (hasTorch && hasTorchVision && !hasTriton) {
    findings.push({
      id: "dep-triton-recommended",
      category: "DEPENDENCIES_CUDA",
      severity: "LOW",
      title: "Triton Compiler Not Explicitly Pinned",
      description: "Modern PyTorch 2.x compilation (torch.compile) relies heavily on matching Triton releases.",
      evidence: "PyTorch workload without explicit triton specification",
      recommendedFix: "Include matching triton version (e.g. triton>=3.0.0 for PyTorch 2.4).",
      ruleReference: "PyTorch 2.x Inductor & Triton Compiler Reference",
    });
  }

  let status: CheckStatus = "PASS";
  if (findings.some((f) => f.severity === "CRITICAL" || f.severity === "HIGH")) {
    status = "FAIL";
  }

  return {
    id: "check-dependencies",
    name: "Python Dependencies & PyTorch/CUDA Alignment",
    category: "DEPENDENCIES_CUDA",
    status,
    isRuntimeTest: false,
    summary:
      status === "PASS"
        ? "Dependency definitions appear sound with pinned ML packages."
        : `Found ${findings.filter((f) => f.severity === "HIGH" || f.severity === "CRITICAL").length} high-priority dependency constraint issue(s).`,
    findings,
    checkedAt: timestamp,
  };
}
