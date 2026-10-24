import { CheckResult, Finding, CheckStatus } from "@/types/runguard";

export function checkDockerfile(content?: string): CheckResult {
  const timestamp = new Date().toISOString();
  if (!content || content.trim().length === 0) {
    return {
      id: "check-dockerfile",
      name: "Dockerfile GPU Readiness & Best Practices",
      category: "DOCKER_CONTAINER",
      status: "UNKNOWN",
      isRuntimeTest: false,
      summary: "No Dockerfile provided. Static container checks skipped.",
      findings: [],
      checkedAt: timestamp,
    };
  }

  const findings: Finding[] = [];
  const lines = content.split(/\r?\n/);

  // 1. Check Base Image
  const fromLines = lines.filter((l) => l.trim().toUpperCase().startsWith("FROM"));
  const hasNvidiaBase = fromLines.some((l) =>
    /nvidia\/cuda|pytorch\/pytorch|nvcr\.io\/nvidia/i.test(l)
  );

  if (!hasNvidiaBase) {
    findings.push({
      id: "dock-base-missing-cuda",
      category: "DOCKER_CONTAINER",
      severity: "HIGH",
      title: "Non-NVIDIA or Unverified Base Image Detected",
      description:
        "The Dockerfile FROM instruction does not use an official nvidia/cuda, nvcr.io/nvidia, or pytorch/pytorch runtime or devel image.",
      evidence: fromLines.join(" | ") || "No FROM line found",
      recommendedFix:
        "Use official NVIDIA images, e.g., 'FROM nvidia/cuda:12.4.1-devel-ubuntu22.04' or 'FROM pytorch/pytorch:2.4.0-cuda12.4-cudnn9-devel'.",
      ruleReference: "NVIDIA Container Toolkit Specification v1.14",
    });
  }

  // 2. Check NVIDIA driver capabilities & visible devices
  const hasVisibleDevices = /ENV\s+NVIDIA_VISIBLE_DEVICES\b/i.test(content) || /NVIDIA_VISIBLE_DEVICES=all/i.test(content);
  const hasDriverCaps = /ENV\s+NVIDIA_DRIVER_CAPABILITIES\b/i.test(content) || /compute,utility/i.test(content);

  if (!hasVisibleDevices || !hasDriverCaps) {
    findings.push({
      id: "dock-missing-driver-caps",
      category: "DOCKER_CONTAINER",
      severity: "MEDIUM",
      title: "Missing NVIDIA Container Runtime Environment Flags",
      description:
        "Without NVIDIA_VISIBLE_DEVICES and NVIDIA_DRIVER_CAPABILITIES, containerized workloads may fail to discover CUDA drivers or GPU devices on standard container runtimes.",
      evidence: `NVIDIA_VISIBLE_DEVICES defined: ${hasVisibleDevices}, NVIDIA_DRIVER_CAPABILITIES defined: ${hasDriverCaps}`,
      recommendedFix:
        "Add: ENV NVIDIA_VISIBLE_DEVICES=all\nENV NVIDIA_DRIVER_CAPABILITIES=compute,utility",
      ruleReference: "NVIDIA Container Runtime Environment Standard",
    });
  }

  // 3. Check DEBIAN_FRONTEND noninteractive
  const hasAptGet = /apt-get\s+install/i.test(content);
  const hasNonInteractive = /DEBIAN_FRONTEND=noninteractive/i.test(content);
  if (hasAptGet && !hasNonInteractive) {
    findings.push({
      id: "dock-debian-frontend",
      category: "DOCKER_CONTAINER",
      severity: "LOW",
      title: "Unset DEBIAN_FRONTEND May Cause Interactive Build Hangs",
      description:
        "Package installations using apt-get without noninteractive mode can stall indefinitely during automated cloud image builds.",
      evidence: "Found apt-get install without DEBIAN_FRONTEND=noninteractive",
      recommendedFix: "Set 'ENV DEBIAN_FRONTEND=noninteractive' before apt-get commands.",
      ruleReference: "Docker Build Best Practices RFC-89",
    });
  }

  // 4. Check apt lists cleanup
  if (hasAptGet && !/rm -rf \/var\/lib\/apt\/lists\/\*/i.test(content)) {
    findings.push({
      id: "dock-apt-cache-bloat",
      category: "DOCKER_CONTAINER",
      severity: "LOW",
      title: "Apt Package Cache Not Purged",
      description:
        "Failing to remove /var/lib/apt/lists/* increases container image size by hundreds of megabytes, slowing cloud node image pull times on GPU clusters.",
      evidence: "apt-get without cleanup layer",
      recommendedFix: "Append '&& rm -rf /var/lib/apt/lists/*' to your apt-get RUN instruction.",
      ruleReference: "Container Layer Optimization Guideline",
    });
  }

  // Determine check status
  let status: CheckStatus = "PASS";
  if (findings.some((f) => f.severity === "CRITICAL" || f.severity === "HIGH")) {
    status = "FAIL";
  }

  return {
    id: "check-dockerfile",
    name: "Dockerfile GPU Readiness & Best Practices",
    category: "DOCKER_CONTAINER",
    status,
    isRuntimeTest: false,
    summary:
      status === "PASS"
        ? "Dockerfile satisfies NVIDIA container runtime and GPU driver requirements."
        : `Identified ${findings.length} configuration improvement(s) in Dockerfile.`,
    findings,
    checkedAt: timestamp,
  };
}
