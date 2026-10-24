import { VramEstimate } from "@/types/runguard";
import { VERIFIED_GPU_CATALOG } from "../constants";

export interface VramCalculationParams {
  modelParamsBillion: number;
  precision: "FP32" | "FP16" | "BF16" | "FP8" | "INT4";
  contextLengthTokens: number;
  batchSize: number;
  targetGpuId: string;
  gpuCount: number;
  numLayers?: number;
  hiddenDimension?: number;
  numAttentionHeads?: number;
  numKvHeads?: number; // For Grouped Query Attention (GQA) like Llama 3 / Nemotron
}

export function estimateVram(params: VramCalculationParams): VramEstimate {
  const {
    modelParamsBillion,
    precision,
    contextLengthTokens,
    batchSize,
    targetGpuId,
    gpuCount = 1,
    numLayers,
    hiddenDimension,
    numKvHeads,
    numAttentionHeads,
  } = params;

  const notes: string[] = [];

  // Bytes per parameter for weights
  let bytesPerWeight = 2; // Default FP16/BF16
  if (precision === "FP32") bytesPerWeight = 4;
  else if (precision === "FP16" || precision === "BF16") bytesPerWeight = 2;
  else if (precision === "FP8") bytesPerWeight = 1;
  else if (precision === "INT4") bytesPerWeight = 0.5;

  // Weight Memory (GiB)
  // 1 Billion parameters = 10^9 params
  // 1 GiB = 1024^3 bytes = 1,073,741,824 bytes
  const totalWeightBytes = modelParamsBillion * 1e9 * bytesPerWeight;
  const totalWeightMemoryGb = totalWeightBytes / (1024 * 1024 * 1024);

  // Per GPU weight memory assuming tensor parallelism sharding across gpuCount
  const weightMemoryPerGpuGb = totalWeightMemoryGb / Math.max(1, gpuCount);

  // KV Cache calculation
  // Formula for standard Multi-Head Attention (MHA) or Grouped-Query Attention (GQA):
  // KV bytes per token per layer = 2 * (num_kv_heads * head_dim) * bytes_per_element
  // If exact architecture dimensions not provided, use standard transformer empirical scaling:
  // For standard 7B to 70B models, KV cache in FP16 is approx 0.5MB to 1.5MB per 1k tokens per batch
  let kvCacheMemoryTotalGb = 0;
  const bytesPerKvElement = precision === "FP8" ? 1 : 2; // KV cache usually FP16 or FP8

  if (numLayers && hiddenDimension) {
    // Exact architectural formula
    const kvDimension = numKvHeads && numAttentionHeads 
      ? (hiddenDimension * numKvHeads) / numAttentionHeads 
      : hiddenDimension;
    const kvBytesPerToken = 2 * numLayers * kvDimension * bytesPerKvElement;
    const totalKvBytes = kvBytesPerToken * contextLengthTokens * batchSize;
    kvCacheMemoryTotalGb = totalKvBytes / (1024 * 1024 * 1024);
    notes.push(`Exact KV-cache calculated from architecture (${numLayers} layers, ${hiddenDimension} hidden dim).`);
  } else {
    // Empirical estimate based on parameter scaling (Llama / Nemotron style GQA architecture)
    // 70B model with GQA has ~8 KV heads vs 64 Q heads (~1/8th MHA size)
    const gqaFactor = modelParamsBillion > 30 ? 0.25 : 0.5;
    const kvEstimateBytes = 2 * 2 * (modelParamsBillion * 1e9 * 0.000075 * gqaFactor) * contextLengthTokens * batchSize * (bytesPerKvElement / 2);
    kvCacheMemoryTotalGb = Math.max(0.2, kvEstimateBytes / (1024 * 1024 * 1024));
    notes.push("Architectural details (layers/hidden_dim) omitted: KV-cache estimated using verified GQA transformer baseline.");
  }

  const kvCachePerGpuGb = kvCacheMemoryTotalGb / Math.max(1, gpuCount);

  // CUDA runtime overhead + PyTorch memory allocator reserve buffer
  // Typically 1.5 GiB for CUDA context, NCCL communication buffers, and CUDA graph allocation
  const runtimeOverheadPerGpuGb = gpuCount > 1 ? 2.2 : 1.6;

  const totalEstimatedVramPerGpuGb = weightMemoryPerGpuGb + kvCachePerGpuGb + runtimeOverheadPerGpuGb;

  // Resolve GPU hardware specs
  const matchedGpu = VERIFIED_GPU_CATALOG.find((g) => g.id === targetGpuId) || VERIFIED_GPU_CATALOG[0];
  const availableVramGb = matchedGpu.vramGb;

  const isFeasible = totalEstimatedVramPerGpuGb <= availableVramGb * 0.95; // 5% safety margin for fragmentation

  if (!isFeasible) {
    notes.push(
      `CRITICAL VRAM OVERFLOW: Estimated required VRAM (${totalEstimatedVramPerGpuGb.toFixed(1)} GiB/GPU) exceeds available VRAM (${availableVramGb} GiB) on ${matchedGpu.name}.`
    );
  } else {
    notes.push(
      `Feasible: Estimated usage (${totalEstimatedVramPerGpuGb.toFixed(1)} GiB/GPU) fits within ${availableVramGb} GiB capacity (${((totalEstimatedVramPerGpuGb / availableVramGb) * 100).toFixed(1)}% utilization).`
    );
  }

  return {
    modelParamsBillion,
    precision,
    contextLengthTokens,
    batchSize,
    numLayers,
    hiddenDimension,
    numAttentionHeads,
    weightMemoryGb: Number(weightMemoryPerGpuGb.toFixed(2)),
    kvCacheMemoryGb: Number(kvCachePerGpuGb.toFixed(2)),
    runtimeOverheadGb: Number(runtimeOverheadPerGpuGb.toFixed(2)),
    totalEstimatedVramGb: Number(totalEstimatedVramPerGpuGb.toFixed(2)),
    gpuMemoryAvailableGb: availableVramGb,
    gpuCount,
    isFeasible,
    notes,
  };
}
