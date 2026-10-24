import { CheckResult, Finding, CheckStatus } from "@/types/runguard";

export function checkWorkloadConfig(content?: string, declaredGpuCount = 1): CheckResult {
  const timestamp = new Date().toISOString();
  if (!content || content.trim().length === 0) {
    return {
      id: "check-workload-config",
      name: "Cluster & Workload Runtime Configuration",
      category: "WORKLOAD_RESOURCES",
      status: "UNKNOWN",
      isRuntimeTest: false,
      summary: "No workload configuration provided (Slurm, Kubernetes, or Docker Compose). Static runtime checks skipped.",
      findings: [],
      checkedAt: timestamp,
    };
  }

  const findings: Finding[] = [];

  // Detect format (K8s / Slurm / Docker Compose / vLLM / DeepSpeed)
  const isK8s = /apiVersion:|kind:\s*(?:Pod|Job|Deployment|DaemonSet)/i.test(content);
  const isSlurm = /#SBATCH\b/i.test(content);
  const isCompose = /services:|docker-compose/i.test(content);
  const isDeepSpeed = /zero_optimization|fp16|bf16|gradient_accumulation_steps/i.test(content);
  const isVllm = /tensor_parallel_size|pipeline_parallel_size|max_model_len/i.test(content);

  // 1. Shared Memory (/dev/shm) Check - #1 cause of silent PyTorch DataLoader crash!
  let hasShmConfigured = false;
  if (isK8s) {
    hasShmConfigured = /mountPath:\s*\/dev\/shm/i.test(content) || /medium:\s*Memory/i.test(content);
  } else if (isCompose) {
    hasShmConfigured = /shm_size:\s*['"]?[0-9]+[gGmM]/i.test(content) || /ipc:\s*host/i.test(content);
  } else if (isSlurm) {
    hasShmConfigured = true; // Slurm nodes share host IPC by default
  } else {
    // Generic script / docker run
    hasShmConfigured = /--shm-size|--ipc=host/i.test(content);
  }

  if (!hasShmConfigured && (isK8s || isCompose)) {
    findings.push({
      id: "cfg-missing-shm",
      category: "SHARED_MEMORY",
      severity: "CRITICAL",
      title: "Default Shared Memory Limit (/dev/shm 64MB) Detected",
      description:
        "Standard container runtimes default to 64MB of shared memory. PyTorch DataLoader with num_workers > 0 and NCCL inter-GPU rings allocate shared memory buffers and will crash with 'RuntimeError: DataLoader worker is killed by signal: Bus error' or NCCL ring timeouts.",
      evidence: "No emptyDir/Memory volume or shm_size allocation detected in configuration",
      recommendedFix: isK8s
        ? "Add an emptyDir volume with medium: Memory mounted at /dev/shm in pod spec."
        : "Add 'shm_size: 16g' or 'ipc: host' to your service configuration.",
      ruleReference: "Kubernetes GPU Workload Best Practices & PyTorch Multi-Processing Guide",
    });
  }

  // 2. GPU Count and Request Consistency
  if (isK8s) {
    const gpuMatch = content.match(/nvidia\.com\/gpu:\s*['"]?([0-9]+)['"]?/i);
    if (!gpuMatch) {
      findings.push({
        id: "cfg-k8s-missing-gpu-request",
        category: "WORKLOAD_RESOURCES",
        severity: "HIGH",
        title: "Kubernetes Pod Does Not Request nvidia.com/gpu Resources",
        description:
          "Without 'resources.limits.nvidia.com/gpu', the Kubernetes scheduler cannot attach GPU devices through the NVIDIA device plugin.",
        evidence: "Missing 'nvidia.com/gpu' in resources specification",
        recommendedFix: `Specify: resources: { limits: { nvidia.com/gpu: ${declaredGpuCount} } }`,
        ruleReference: "NVIDIA K8s Device Plugin Specification",
      });
    }
  }

  if (isSlurm) {
    const slurmGpu = content.match(/#SBATCH\s+(?:--gpus=|--gres=gpu:)([0-9]+)/i);
    if (!slurmGpu) {
      findings.push({
        id: "cfg-slurm-missing-gpu",
        category: "WORKLOAD_RESOURCES",
        severity: "HIGH",
        title: "Slurm Script Missing Explicit GPU Resource Request",
        description: "Job will run on standard CPU queue unless #SBATCH --gpus=<count> is allocated.",
        evidence: "No #SBATCH --gpus= or --gres=gpu: directive found",
        recommendedFix: `#SBATCH --gpus=${declaredGpuCount}`,
        ruleReference: "Slurm Workload Manager GPU Scheduling Guide",
      });
    }
  }

  // 3. Multi-GPU NCCL Environment Tuning
  if (declaredGpuCount > 1) {
    const hasNcclDebug = /NCCL_DEBUG\b/i.test(content);
    if (!hasNcclDebug) {
      findings.push({
        id: "cfg-nccl-debug-recommended",
        category: "DISTRIBUTED_COMMUNICATION",
        severity: "LOW",
        title: "NCCL_DEBUG Diagnostics Not Enabled for Multi-GPU Job",
        description:
          "Setting 'NCCL_DEBUG=INFO' and 'NCCL_DEBUG_SUBSYS=INIT,ENV' provides essential diagnostic telemetry if an NCCL collective hang occurs without degrading throughput.",
        evidence: `GPU count is ${declaredGpuCount}, but NCCL_DEBUG is not configured`,
        recommendedFix: "Set environment variable: NCCL_DEBUG=INFO",
        ruleReference: "NVIDIA NCCL Diagnostics Guide",
      });
    }
  }

  // 4. vLLM Tensor Parallelism Check
  if (isVllm) {
    const tpMatch = content.match(/tensor[-_]parallel[-_]size\s*[:=]\s*([0-9]+)/i);
    if (tpMatch) {
      const tpSize = parseInt(tpMatch[1], 10);
      if (tpSize !== declaredGpuCount) {
        findings.push({
          id: "cfg-vllm-tp-mismatch",
          category: "WORKLOAD_RESOURCES",
          severity: "HIGH",
          title: "vLLM Tensor Parallel Size Mismatch with Target GPU Allocation",
          description: `vLLM configured tensor_parallel_size (${tpSize}) does not equal the target allocated GPU count (${declaredGpuCount}).`,
          evidence: `tensor_parallel_size: ${tpSize} vs target GPUs: ${declaredGpuCount}`,
          recommendedFix: `Align tensor_parallel_size with allocated GPUs: ${declaredGpuCount}, or adjust cluster allocation.`,
          ruleReference: "vLLM Distributed Serving Architecture",
        });
      }
    }
  }

  // 5. DeepSpeed ZeRO Checks
  if (isDeepSpeed) {
    const zeroStageMatch = content.match(/"stage":\s*([0-3])/i);
    if (zeroStageMatch) {
      const stage = parseInt(zeroStageMatch[1], 10);
      if (stage === 3 && declaredGpuCount === 1) {
        findings.push({
          id: "cfg-deepspeed-zero3-single-gpu",
          category: "WORKLOAD_RESOURCES",
          severity: "MEDIUM",
          title: "DeepSpeed ZeRO-3 Configured on Single GPU",
          description:
            "ZeRO-3 shards optimizer states, gradients, and model parameters across multiple GPUs. Running ZeRO-3 on 1 GPU introduces massive CPU-GPU offloading overhead without multi-node benefits.",
          evidence: "DeepSpeed stage 3 detected with GPU count = 1",
          recommendedFix: "Use ZeRO-2 or ZeRO-1 for single-GPU setups, or allocate multi-GPU instances.",
          ruleReference: "DeepSpeed ZeRO Memory Optimization Tutorial",
        });
      }
    }
  }

  let status: CheckStatus = "PASS";
  if (findings.some((f) => f.severity === "CRITICAL" || f.severity === "HIGH")) {
    status = "FAIL";
  }

  return {
    id: "check-workload-config",
    name: "Cluster & Workload Runtime Configuration",
    category: "WORKLOAD_RESOURCES",
    status,
    isRuntimeTest: false,
    summary:
      status === "PASS"
        ? "Workload and cluster resource definitions pass verification."
        : `Detected ${findings.length} workload orchestration hazard(s).`,
    findings,
    checkedAt: timestamp,
  };
}
