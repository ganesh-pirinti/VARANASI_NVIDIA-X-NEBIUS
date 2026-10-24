export interface DemoFixture {
  id: string;
  name: string;
  tagline: string;
  isSimulated: true;
  inputs: {
    projectName: string;
    targetGpu: string;
    gpuCount: number;
    estimatedModelParamsBillion: number;
    precision: "FP32" | "FP16" | "BF16" | "FP8" | "INT4";
    contextLengthTokens: number;
    batchSize: number;
    dockerfileContent: string;
    requirementsContent: string;
    workloadConfigContent: string;
    diagnosticLogContent: string;
  };
  finopsDefaults: {
    baselineGpuId: string;
    baselineGpuCount: number;
    baselineHours: number;
    proposedGpuId: string;
    proposedGpuCount: number;
    proposedHours: number;
    inputTokensMillion: number;
    outputTokensMillion: number;
  };
}

export const DEMO_FIXTURES: DemoFixture[] = [
  {
    id: "fixture-vllm-oom-shm",
    name: "vLLM 70B: CUDA OOM & Missing Shared Memory (/dev/shm)",
    tagline: "[Simulated Fixture] Single GPU overload with default container shm crash",
    isSimulated: true,
    inputs: {
      projectName: "Nemotron-70B-Inference-Service",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 1,
      estimatedModelParamsBillion: 70,
      precision: "FP16",
      contextLengthTokens: 8192,
      batchSize: 16,
      dockerfileContent: `FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04
WORKDIR /app
COPY requirements.txt .
RUN apt-get update && apt-get install -y python3-pip
RUN pip install -r requirements.txt
COPY . .
CMD ["python3", "-m", "vllm.entrypoints.openai.api_server", "--model", "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF"]`,
      requirementsContent: `torch
vllm==0.6.2
transformers>=4.44.0
accelerate`,
      workloadConfigContent: `apiVersion: v1
kind: Pod
metadata:
  name: nemotron-inference-pod
spec:
  containers:
  - name: vllm-server
    image: myregistry.io/nemotron-serve:latest
    resources:
      limits:
        nvidia.com/gpu: 1
    ports:
    - containerPort: 8000`,
      diagnosticLogContent: `[2026-02-14 10:14:02,112] INFO [vllm.engine.async_llm_engine] Initializing model 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF'
Loading checkpoint shards: 100%|██████████| 4/4 [00:19<00:00,  4.92s/it]
[2026-02-14 10:14:24,809] ERROR [vllm.worker.model_runner] Exception in model execution
Traceback (most recent call last):
  File "/usr/local/lib/python3.10/dist-packages/vllm/worker/model_runner.py", line 452, in capture_model
    torch.cuda.synchronize()
  File "/usr/local/lib/python3.10/dist-packages/torch/cuda/__init__.py", line 298, in synchronize
    return torch._C._cuda_synchronize()
torch.OutOfMemoryError: CUDA out of memory. Tried to allocate 4.20 GiB (GPU 0; 79.15 GiB total capacity; 76.85 GiB already allocated; 1.45 GiB free; 77.20 GiB reserved in total by PyTorch)
RuntimeError: DataLoader worker (pid 142) is killed by signal: Bus error. It is possible that dataloader's workers are out of shared memory. Please try to raise your shared memory limit.`,
    },
    finopsDefaults: {
      baselineGpuId: "aws-p5-h100",
      baselineGpuCount: 8,
      baselineHours: 720,
      proposedGpuId: "nebius-h100-sxm",
      proposedGpuCount: 4, // FP8 4x H100 with TP=4
      proposedHours: 720,
      inputTokensMillion: 25.0,
      outputTokensMillion: 12.5,
    },
  },
  {
    id: "fixture-nccl-distributed-hang",
    name: "DeepSpeed ZeRO-3: Multi-Node NCCL Communication Timeout",
    tagline: "[Simulated Fixture] 8x GPU cluster collective hang without network flags",
    isSimulated: true,
    inputs: {
      projectName: "Distributed-Nemotron-FineTuning",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 8,
      estimatedModelParamsBillion: 70,
      precision: "BF16",
      contextLengthTokens: 4096,
      batchSize: 4,
      dockerfileContent: `FROM nvidia/cuda:12.1.1-devel-ubuntu22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y git python3-pip && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt`,
      requirementsContent: `torch==2.3.1
deepspeed==0.14.4
transformers==4.41.2
ninja>=1.11.1
flash-attn==2.5.8`,
      workloadConfigContent: `{
  "train_batch_size": 32,
  "zero_optimization": {
    "stage": 3,
    "offload_optimizer": {
      "device": "none"
    }
  },
  "bf16": {
    "enabled": true
  }
}`,
      diagnosticLogContent: `[Rank 0] Initializing torch.distributed with backend=nccl
[Rank 1] Initializing torch.distributed with backend=nccl
[Rank 2] Initializing torch.distributed with backend=nccl
[Rank 3] Initializing torch.distributed with backend=nccl
[Rank 4] Initializing torch.distributed with backend=nccl
[Rank 5] Initializing torch.distributed with backend=nccl
[Rank 6] Initializing torch.distributed with backend=nccl
[Rank 7] Initializing torch.distributed with backend=nccl
[E ProcessGroupNCCL.cpp:528] [Rank 3] Watchdog caught collective operation timeout: WorkNCCL(OpType=ALLREDUCE, Timeout(ms)=600000) ran for 600008 milliseconds before timing out.
[E ProcessGroupNCCL.cpp:542] Some NCCL operations have failed or timed out. Due to the asynchronous nature of CUDA kernels, subsequent GPU operations might run on corrupted/incomplete data.
RuntimeError: NCCL error: unhandled system error / Call to connectReturned [...] timed out`,
    },
    finopsDefaults: {
      baselineGpuId: "nebius-h100-sxm",
      baselineGpuCount: 8,
      baselineHours: 120,
      proposedGpuId: "nebius-h100-sxm",
      proposedGpuCount: 8,
      proposedHours: 85, // 30% speedup from resolving network bottlenecks
      inputTokensMillion: 5.0,
      outputTokensMillion: 2.0,
    },
  },
  {
    id: "fixture-flash-attn-build-mismatch",
    name: "FlashAttention Build Failure: Missing Ninja & Arch Mismatch",
    tagline: "[Simulated Fixture] Unpinned build dependencies stalling container build",
    isSimulated: true,
    inputs: {
      projectName: "Llama-Vision-Agent-Pipeline",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 2,
      estimatedModelParamsBillion: 11,
      precision: "BF16",
      contextLengthTokens: 2048,
      batchSize: 8,
      dockerfileContent: `FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04
RUN apt-get update && apt-get install -y python3-pip
RUN pip install torch==2.4.0
RUN pip install flash-attn`,
      requirementsContent: `torch==2.4.0
flash-attn`,
      workloadConfigContent: `services:
  agent-runner:
    image: agent-runner:latest
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 2
              capabilities: [gpu]`,
      diagnosticLogContent: `Running setup.py install for flash-attn ... error
  error: subprocess-exited-with-error
  running bdist_wheel
  running build
  running build_py
  creating build/lib.linux-x86_64-cpython-310/flash_attn
  running build_ext
  Traceback (most recent call last):
    File "/tmp/pip-install/setup.py", line 124, in <module>
      raise RuntimeError("Ninja is required to load C++ extensions")
  RuntimeError: Ninja is required to load C++ extensions
  ninja: build stopped: subcommand failed during flash_attn compilation`,
    },
    finopsDefaults: {
      baselineGpuId: "nebius-h100-sxm",
      baselineGpuCount: 2,
      baselineHours: 400,
      proposedGpuId: "nebius-l40s",
      proposedGpuCount: 2,
      proposedHours: 400,
      inputTokensMillion: 10.0,
      outputTokensMillion: 5.0,
    },
  },
  {
    id: "fixture-clean-production",
    name: "Production Ready: 8x H100 SXM vLLM Multi-GPU Spec",
    tagline: "[Simulated Reference] Fully compliant high-performance configuration",
    isSimulated: true,
    inputs: {
      projectName: "Enterprise-Nemotron-Service",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 8,
      estimatedModelParamsBillion: 70,
      precision: "FP8",
      contextLengthTokens: 16384,
      batchSize: 32,
      dockerfileContent: `FROM nvcr.io/nvidia/pytorch:24.08-py3
ENV DEBIAN_FRONTEND=noninteractive
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
WORKDIR /workspace
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .`,
      requirementsContent: `torch==2.4.1+cu124
ninja>=1.11.1
flash-attn==2.6.3 --no-build-isolation
vllm==0.6.3
triton>=3.0.0`,
      workloadConfigContent: `apiVersion: v1
kind: Pod
metadata:
  name: enterprise-vllm-nemotron
spec:
  volumes:
  - name: dshm
    emptyDir:
      medium: Memory
      sizeLimit: 32Gi
  containers:
  - name: vllm-runner
    image: nvcr.io/nvidia/pytorch:24.08-py3
    volumeMounts:
    - mountPath: /dev/shm
      name: dshm
    env:
    - name: NCCL_DEBUG
      value: "INFO"
    - name: NCCL_IB_DISABLE
      value: "0"
    resources:
      limits:
        nvidia.com/gpu: 8`,
      diagnosticLogContent: `[INFO] Initialized vLLM Engine on 8x NVIDIA H100 SXM5 GPUs
[INFO] Tensor Parallel Size: 8, Pipeline Parallel Size: 1
[INFO] Model Weights loaded in FP8 (e4m3fn). Total Weight VRAM: 72.4 GiB across 8 GPUs (9.05 GiB/GPU).
[INFO] KV Cache allocation: 64.2 GiB available per GPU. Maximum concurrency: 128 streams.
[INFO] NCCL ring initialized over NVLink 4 (900 GB/s inter-GPU bandwidth).
[INFO] Service health status: READY. Listening on port 8000.`,
    },
    finopsDefaults: {
      baselineGpuId: "aws-p5-h100",
      baselineGpuCount: 8,
      baselineHours: 730,
      proposedGpuId: "nebius-h100-sxm",
      proposedGpuCount: 8,
      proposedHours: 730,
      inputTokensMillion: 50.0,
      outputTokensMillion: 25.0,
    },
  },
];
