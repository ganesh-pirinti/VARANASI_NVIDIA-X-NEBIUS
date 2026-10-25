import { GpuSpec } from "@/types/finops";

/**
 * Audited Hardware Specifications and Official Pricing Catalog
 * Audited directly against official Nebius AI Cloud pricing: https://nebius.com/prices
 * Verification timestamp: 2026-02-20
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
    onDemandHourlyRateUsd: 4.50, // Official on-demand rate from nebius.com/prices
    preemptibleHourlyRateUsd: 0.79, // Official dynamic spot baseline from nebius.com/prices
    gpusPerInstance: 1,
    priceStatus: "VERIFIED",
    provider: "Nebius",
    priceSourceUrl: "https://nebius.com/prices",
    lastVerifiedDate: "2026-02-20",
    pricingNotes: "Verified on-demand ($4.50/GPU-hr) and dynamic preemptible spot (starts from $0.79/GPU-hr) from https://nebius.com/prices. Billed per second with 1-hr unit.",
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
    onDemandHourlyRateUsd: 5.40, // Official on-demand rate from nebius.com/prices
    preemptibleHourlyRateUsd: 0.79, // Official dynamic spot baseline from nebius.com/prices
    gpusPerInstance: 1,
    priceStatus: "VERIFIED",
    provider: "Nebius",
    priceSourceUrl: "https://nebius.com/prices",
    lastVerifiedDate: "2026-02-20",
    pricingNotes: "Verified on-demand ($5.40/GPU-hr) and dynamic preemptible spot (starts from $0.79/GPU-hr) from https://nebius.com/prices.",
  },
  {
    id: "nebius-l40s",
    name: "NVIDIA L40S 48GB (Intel CPU)",
    architecture: "Ada Lovelace",
    vramGb: 48,
    memoryBandwidthTbSec: 0.864,
    fp16Tflops: 366,
    fp8Tflops: 733,
    interconnect: "PCIe 4.0 x16 (64 GB/s)",
    onDemandHourlyRateUsd: 1.55, // Official on-demand rate from nebius.com/prices
    preemptibleHourlyRateUsd: 0.74, // Official flat preemptible rate from nebius.com/prices
    gpusPerInstance: 1,
    priceStatus: "VERIFIED",
    provider: "Nebius",
    priceSourceUrl: "https://nebius.com/prices",
    lastVerifiedDate: "2026-02-20",
    pricingNotes: "Verified Intel CPU configuration: $1.55 on-demand / $0.74 preemptible flat rate from https://nebius.com/prices.",
  },
  {
    id: "nebius-l40s-amd",
    name: "NVIDIA L40S 48GB (AMD CPU)",
    architecture: "Ada Lovelace",
    vramGb: 48,
    memoryBandwidthTbSec: 0.864,
    fp16Tflops: 366,
    fp8Tflops: 733,
    interconnect: "PCIe 4.0 x16 (64 GB/s)",
    onDemandHourlyRateUsd: 1.82, // Official on-demand rate from nebius.com/prices
    preemptibleHourlyRateUsd: 0.90, // Official flat preemptible rate from nebius.com/prices
    gpusPerInstance: 1,
    priceStatus: "VERIFIED",
    provider: "Nebius",
    priceSourceUrl: "https://nebius.com/prices",
    lastVerifiedDate: "2026-02-20",
    pricingNotes: "Verified AMD CPU configuration: $1.82 on-demand / $0.90 preemptible flat rate from https://nebius.com/prices.",
  },
  {
    id: "nebius-a100-80gb-sxm",
    name: "NVIDIA A100 SXM4 80GB",
    architecture: "Ampere",
    vramGb: 80,
    memoryBandwidthTbSec: 2.039,
    fp16Tflops: 312,
    interconnect: "NVLink 3 (600 GB/s)",
    onDemandHourlyRateUsd: null, // UNKNOWN: unlisted on current public self-serve page
    preemptibleHourlyRateUsd: null, // UNKNOWN
    gpusPerInstance: 1,
    priceStatus: "UNKNOWN",
    provider: "Nebius",
    priceSourceUrl: "https://nebius.com/prices (Unlisted SKU / Requires Quote)",
    lastVerifiedDate: "2026-02-20",
    pricingNotes: "A100 is not listed on active self-serve public pricing on nebius.com/prices. Requires user-supplied quote.",
  },
  {
    id: "nebius-b200-sxm",
    name: "NVIDIA Blackwell B200 192GB",
    architecture: "Blackwell",
    vramGb: 192,
    memoryBandwidthTbSec: 8.0,
    fp16Tflops: 2250,
    fp8Tflops: 4500,
    interconnect: "NVLink 5 (1.8 TB/s)",
    onDemandHourlyRateUsd: null, // UNKNOWN: public self-serve list price requires commitment quote
    preemptibleHourlyRateUsd: 3.95, // Dynamic spot baseline indicator
    gpusPerInstance: 1,
    priceStatus: "UNKNOWN",
    provider: "Nebius",
    priceSourceUrl: "https://nebius.com/prices (Requires Enterprise Reservation Quote)",
    lastVerifiedDate: "2026-02-20",
    pricingNotes: "Blackwell on-demand rate requires dedicated reservation contract. Mark rate as UNKNOWN unless supplied by user.",
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
    onDemandHourlyRateUsd: 4.12, // $32.96 / 8 GPUs = $4.12 per GPU-hour
    preemptibleHourlyRateUsd: null, // Spot availability constrained
    gpusPerInstance: 8,
    instanceOnDemandRateUsd: 32.96, // $32.96 per instance-hour
    priceStatus: "VERIFIED",
    provider: "AWS",
    priceSourceUrl: "https://aws.amazon.com/ec2/pricing/on-demand/",
    lastVerifiedDate: "2026-02-20",
    pricingNotes: "Official AWS on-demand pricing: $32.96 per instance-hour for 8x H100 ($4.12/GPU-hour equivalent).",
  }
];

export const MODEL_TOKEN_RATES = [
  {
    modelId: "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF",
    name: "NVIDIA Llama 3.1 Nemotron 70B Instruct",
    inputRatePerMillionUsd: 0.35,
    outputRatePerMillionUsd: 0.90,
    isRateVerified: true,
    provider: "Nebius Token Factory",
    priceSourceUrl: "https://tokenfactory.nebius.com/pricing",
    lastVerifiedDate: "2026-02-20",
  },
  {
    modelId: "nvidia/Nemotron-3_5-Lightning",
    name: "NVIDIA Nemotron 3.5 Lightning",
    inputRatePerMillionUsd: 0.15,
    outputRatePerMillionUsd: 0.40,
    isRateVerified: true,
    provider: "Nebius Token Factory",
    priceSourceUrl: "https://tokenfactory.nebius.com/pricing",
    lastVerifiedDate: "2026-02-20",
  },
  {
    modelId: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    name: "Meta Llama 3.1 8B Instruct",
    inputRatePerMillionUsd: 0.06,
    outputRatePerMillionUsd: 0.18,
    isRateVerified: true,
    provider: "Nebius Token Factory",
    priceSourceUrl: "https://tokenfactory.nebius.com/pricing",
    lastVerifiedDate: "2026-02-20",
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
