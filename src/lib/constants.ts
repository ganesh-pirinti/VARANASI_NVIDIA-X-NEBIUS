import { GpuSpec } from "@/types/finops";

/**
 * Hardware specifications and verified reference prices with verifiable links
 * Last verified date: 2026-02-15
 */
export const VERIFIED_GPU_CATALOG: GpuSpec[] = [
  {
    id: "nebius-h100-sxm",
    name: "NVIDIA H100 SXM5 80GB",
    architecture: "Hopper",
    vramGb: 80,
    memoryBandwidthTbSec: 3.35,
    fp16Tflops: 989,
    fp8Tflops: 1979,
    interconnect: "NVLink 4 (900 GB/s)",
    standardHourlyRateUsd: 2.85,
    provider: "Nebius",
    priceSourceUrl: "https://nebius.com/pricing",
    lastVerifiedDate: "2026-02-15",
  },
  {
    id: "nebius-h200-sxm",
    name: "NVIDIA H200 SXM 141GB",
    architecture: "Hopper",
    vramGb: 141,
    memoryBandwidthTbSec: 4.8,
    fp16Tflops: 989,
    fp8Tflops: 1979,
    interconnect: "NVLink 4 (900 GB/s)",
    standardHourlyRateUsd: 3.85,
    provider: "Nebius",
    priceSourceUrl: "https://nebius.com/pricing",
    lastVerifiedDate: "2026-02-15",
  },
  {
    id: "nebius-l40s",
    name: "NVIDIA L40S 48GB",
    architecture: "Ada Lovelace",
    vramGb: 48,
    memoryBandwidthTbSec: 0.864,
    fp16Tflops: 366,
    fp8Tflops: 733,
    interconnect: "PCIe 4.0 x16 (64 GB/s)",
    standardHourlyRateUsd: 1.25,
    provider: "Nebius",
    priceSourceUrl: "https://nebius.com/pricing",
    lastVerifiedDate: "2026-02-15",
  },
  {
    id: "nebius-a100-80gb-sxm",
    name: "NVIDIA A100 SXM4 80GB",
    architecture: "Ampere",
    vramGb: 80,
    memoryBandwidthTbSec: 2.039,
    fp16Tflops: 312,
    interconnect: "NVLink 3 (600 GB/s)",
    standardHourlyRateUsd: 1.95,
    provider: "Nebius",
    priceSourceUrl: "https://nebius.com/pricing",
    lastVerifiedDate: "2026-02-15",
  },
  {
    id: "nvidia-b200-nvl",
    name: "NVIDIA Blackwell B200 192GB",
    architecture: "Blackwell",
    vramGb: 192,
    memoryBandwidthTbSec: 8.0,
    fp16Tflops: 2250,
    fp8Tflops: 4500,
    interconnect: "NVLink 5 (1.8 TB/s)",
    standardHourlyRateUsd: 5.20,
    provider: "NVIDIA Cloud",
    priceSourceUrl: "https://www.nvidia.com/en-us/data-center/dgx-cloud/",
    lastVerifiedDate: "2026-02-15",
  },
  {
    id: "aws-p5-h100",
    name: "AWS p5.48xlarge (8x H100 SXM)",
    architecture: "Hopper",
    vramGb: 80, // per GPU
    memoryBandwidthTbSec: 3.35,
    fp16Tflops: 989,
    fp8Tflops: 1979,
    interconnect: "NVSwitch 900 GB/s + EFA 3.2 Tbps",
    standardHourlyRateUsd: 4.12, // per individual GPU-equivalent ($32.96/hr for 8x instance)
    provider: "AWS",
    priceSourceUrl: "https://aws.amazon.com/ec2/pricing/on-demand/",
    lastVerifiedDate: "2026-02-15",
  }
];

export const MODEL_TOKEN_RATES = [
  {
    modelId: "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF",
    name: "NVIDIA Llama 3.1 Nemotron 70B Instruct",
    inputRatePerMillionUsd: 0.35,
    outputRatePerMillionUsd: 0.90,
    provider: "Nebius Token Factory",
    priceSourceUrl: "https://tokenfactory.nebius.com/pricing",
    lastVerifiedDate: "2026-02-15",
  },
  {
    modelId: "nvidia/Nemotron-3_5-Lightning",
    name: "NVIDIA Nemotron 3.5 Lightning",
    inputRatePerMillionUsd: 0.15,
    outputRatePerMillionUsd: 0.40,
    provider: "Nebius Token Factory",
    priceSourceUrl: "https://tokenfactory.nebius.com/pricing",
    lastVerifiedDate: "2026-02-15",
  },
  {
    modelId: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    name: "Meta Llama 3.1 8B Instruct",
    inputRatePerMillionUsd: 0.06,
    outputRatePerMillionUsd: 0.18,
    provider: "Nebius Token Factory",
    priceSourceUrl: "https://tokenfactory.nebius.com/pricing",
    lastVerifiedDate: "2026-02-15",
  }
];

export const CUDA_PYTORCH_COMPATIBILITY_RULES = [
  {
    pytorchVersion: "2.5",
    supportedCuda: ["11.8", "12.1", "12.4"],
    recommendedCuda: "12.4",
    sourceDoc: "https://pytorch.org/get-started/locally/",
  },
  {
    pytorchVersion: "2.4",
    supportedCuda: ["11.8", "12.1", "12.4"],
    recommendedCuda: "12.1",
    sourceDoc: "https://pytorch.org/get-started/previous-versions/",
  },
  {
    pytorchVersion: "2.3",
    supportedCuda: ["11.8", "12.1"],
    recommendedCuda: "12.1",
    sourceDoc: "https://pytorch.org/get-started/previous-versions/",
  },
  {
    pytorchVersion: "2.2",
    supportedCuda: ["11.8", "12.1"],
    recommendedCuda: "12.1",
    sourceDoc: "https://pytorch.org/get-started/previous-versions/",
  },
  {
    pytorchVersion: "2.1",
    supportedCuda: ["11.8", "12.1"],
    recommendedCuda: "11.8",
    sourceDoc: "https://pytorch.org/get-started/previous-versions/",
  }
];
