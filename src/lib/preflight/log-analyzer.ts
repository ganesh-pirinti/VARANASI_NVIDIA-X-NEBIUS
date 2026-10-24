import { CheckResult, Finding, CheckStatus } from "@/types/runguard";

export function analyzeDiagnosticLog(content?: string): CheckResult {
  const timestamp = new Date().toISOString();
  if (!content || content.trim().length === 0) {
    return {
      id: "check-diagnostic-log",
      name: "Runtime Execution & Diagnostic Log Inspection",
      category: "VRAM_CAPACITY",
      status: "UNKNOWN",
      isRuntimeTest: true,
      summary: "No diagnostic or runtime log provided. Log-based failure identification skipped.",
      findings: [],
      checkedAt: timestamp,
    };
  }

  const findings: Finding[] = [];
  const log = content;

  // 1. CUDA Out of Memory (OOM)
  const oomRegex = /torch\.OutOfMemoryError:\s*CUDA\s*out\s*of\s*memory\.\s*Tried\s*to\s*allocate\s*([\d\.]+\s*(?:GiB|MiB|GB|MB))(?:\s*\(GPU\s*(\d+);\s*([\d\.]+\s*(?:GiB|MiB|GB|MB))\s*total\s*capacity;\s*([\d\.]+\s*(?:GiB|MiB|GB|MB))\s*already\s*allocated)?/i;
  const oomMatch = log.match(oomRegex);
  if (oomMatch || /CUDA\s*out\s*of\s*memory/i.test(log)) {
    const allocationTried = oomMatch ? oomMatch[1] : "unspecified allocation";
    const gpuIndex = oomMatch ? oomMatch[2] : "0";
    const totalCapacity = oomMatch ? oomMatch[3] : "device capacity";
    const alreadyAllocated = oomMatch ? oomMatch[4] : "majority of memory";

    findings.push({
      id: "log-cuda-oom",
      category: "VRAM_CAPACITY",
      severity: "CRITICAL",
      title: "CUDA Out Of Memory (OOM) Runtime Failure",
      description: `PyTorch failed to allocate ${allocationTried} on GPU ${gpuIndex} (Capacity: ${totalCapacity}, Already Allocated: ${alreadyAllocated}). This occurs when model weights, KV-cache, and activation tensors exceed physical HBM.`,
      evidence: oomMatch ? oomMatch[0] : "Found 'CUDA out of memory' in stack trace",
      recommendedFix:
        "1. Enable FlashAttention / SDPA\n2. Reduce micro-batch size or max_model_len\n3. Enable Activation Checkpointing (gradient checkpointing)\n4. Quantize weights to FP8/INT4 or increase Tensor Parallel GPUs.",
      ruleReference: "PyTorch Memory Management Guide & vLLM Memory Tuning",
    });
  }

  // 2. NCCL Collective Timeout / Watchdog Error
  if (/NCCL\s*error:\s*unhandled\s*system\s*error|Watchdog\s*caught\s*collective\s*operation\s*timeout/i.test(log) || /Call\s*to\s*connectReturned\s*\[\.\.\.\]\s*timed\s*out/i.test(log)) {
    findings.push({
      id: "log-nccl-timeout",
      category: "DISTRIBUTED_COMMUNICATION",
      severity: "CRITICAL",
      title: "NCCL Multi-GPU Distributed Communication Timeout",
      description:
        "Distributed collective operation stalled across ranks. Common root causes: asymmetric rank execution, blocked network port between nodes, mismatched NCCL interface (e.g. eth0 vs ib0), or insufficient shared memory.",
      evidence: "Watchdog collective timeout / NCCL unhandled system error in trace",
      recommendedFix:
        "Set 'export NCCL_DEBUG=INFO', verify network interfaces with 'NCCL_SOCKET_IFNAME', ensure firewall allows TCP ephemeral ports, and increase /dev/shm.",
      ruleReference: "NVIDIA NCCL Troubleshooting & Network Tuning Guide",
    });
  }

  // 3. CUDA Architecture Mismatch (e.g. no kernel image available)
  if (/no\s*kernel\s*image\s*is\s*available\s*for\s*execution\s*on\s*the\s*device/i.test(log) || /CUDA\s*error:\s*invalid\s*device\s*function/i.test(log)) {
    findings.push({
      id: "log-cuda-arch-mismatch",
      category: "DEPENDENCIES_CUDA",
      severity: "CRITICAL",
      title: "CUDA Compute Capability Architecture Mismatch",
      description:
        "The compiled binary or extension (e.g. FlashAttention or custom CUDA kernel) does not contain target PTX/SASS machine code for the host GPU compute capability (e.g., Hopper sm_90 compiled only for Ampere sm_80).",
      evidence: "Found 'no kernel image is available for execution on the device' in log",
      recommendedFix:
        "Recompile extension with TORCH_CUDA_ARCH_LIST='9.0;8.0' for Hopper/Ampere, or install pre-built wheels compiled for your GPU architecture.",
      ruleReference: "NVIDIA CUDA Compute Capability Guide",
    });
  }

  // 4. DataLoader Shared Memory Bus Error
  if (/DataLoader\s*worker\s*.*is\s*killed\s*by\s*signal:\s*Bus\s*error/i.test(log) || /RuntimeError:\s*DataLoader\s*worker\s*.*Bus\s*error/i.test(log)) {
    findings.push({
      id: "log-dataloader-shm-bus-error",
      category: "SHARED_MEMORY",
      severity: "CRITICAL",
      title: "PyTorch Multi-Processing /dev/shm Shared Memory Exhaustion",
      description:
        "PyTorch DataLoader worker crashed with SIGBUS (Bus error). Container ran out of POSIX shared memory (/dev/shm). Default 64MB Docker shm is exhausted when transferring tensors between worker processes.",
      evidence: "DataLoader worker killed by signal: Bus error",
      recommendedFix: "Launch container with '--shm-size=16g' or set Kubernetes volume emptyDir with medium: Memory.",
      ruleReference: "PyTorch Multi-processing Shared Memory Best Practices",
    });
  }

  // 5. Driver / Runtime Version Incompatibility
  if (/CUDA\s*driver\s*version\s*is\s*insufficient\s*for\s*CUDA\s*runtime\s*version/i.test(log) || /The\s*NVIDIA\s*driver\s*on\s*your\s*system\s*is\s*too\s*old/i.test(log)) {
    findings.push({
      id: "log-driver-version-insufficient",
      category: "DEPENDENCIES_CUDA",
      severity: "CRITICAL",
      title: "Host NVIDIA Driver Outdated for CUDA Runtime",
      description:
        "The host machine GPU driver version is lower than the minimum driver required by the CUDA toolkit bundled in the container (e.g., CUDA 12.4 requires driver >= 550.54.14).",
      evidence: "Found 'CUDA driver version is insufficient for CUDA runtime version'",
      recommendedFix: "Upgrade host NVIDIA driver or select a container image with a lower CUDA runtime (e.g. CUDA 12.1 or 11.8).",
      ruleReference: "NVIDIA CUDA Compatibility Matrix Table 2",
    });
  }

  // 6. Flash-attn / Ninja Compilation Failure
  if (/ninja:\s*build\s*stopped:\s*subcommand\s*failed/i.test(log) && /flash_attn/i.test(log)) {
    findings.push({
      id: "log-flash-attn-build-failed",
      category: "DEPENDENCIES_CUDA",
      severity: "HIGH",
      title: "FlashAttention JIT Build Failed",
      description:
        "FlashAttention failed to compile during package installation. Typically caused by missing nvcc compiler in runtime-only base images, insufficient RAM during parallel ninja jobs, or MAX_JOBS being unconstrained.",
      evidence: "ninja: build stopped: subcommand failed during flash_attn compilation",
      recommendedFix: "Use pre-built wheel: 'pip install flash-attn --no-build-isolation' or set 'MAX_JOBS=4' to prevent system OOM during compile.",
      ruleReference: "Dao-AILab/flash-attention Troubleshooting Guide",
    });
  }

  let status: CheckStatus = "PASS";
  if (findings.some((f) => f.severity === "CRITICAL" || f.severity === "HIGH")) {
    status = "FAIL";
  }

  return {
    id: "check-diagnostic-log",
    name: "Runtime Execution & Diagnostic Log Inspection",
    category: "VRAM_CAPACITY",
    status,
    isRuntimeTest: true, // This is an actual runtime diagnostic test!
    summary:
      status === "PASS"
        ? "No fatal runtime exceptions, OOM, or NCCL stalls detected in diagnostic log."
        : `Identified ${findings.length} critical runtime failure signature(s) in log trace.`,
    findings,
    checkedAt: timestamp,
  };
}
