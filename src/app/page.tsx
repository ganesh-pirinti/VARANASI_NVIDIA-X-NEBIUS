"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { DashboardTab } from "@/components/tabs/DashboardTab";
import { RunGuardTab } from "@/components/tabs/RunGuardTab";
import { DiagnoseTab } from "@/components/tabs/DiagnoseTab";
import { PatchReviewTab } from "@/components/tabs/PatchReviewTab";
import { FinOpsTab } from "@/components/tabs/FinOpsTab";
import { PassportTab } from "@/components/tabs/PassportTab";

import { PreflightInputs, PreflightReport, ProposedPatch } from "@/types/runguard";
import { GpuWorkloadInput, ModelInferenceInput, FinOpsComparisonResult, FinOpsCalculationResult } from "@/types/finops";
import { RunCostPassport } from "@/types/passport";
import { SystemStatusResponse, DiagnoseResponse } from "@/types/api";
import { DEMO_FIXTURES, DemoFixture } from "@/lib/fixtures/demo-workloads";
import { calculateFinOpsCost, compareFinOpsConfigurations } from "@/lib/finops/calculator";
import { runPreflightChecks } from "@/lib/preflight/engine";
import { generateRunCostPassport } from "@/lib/passport/generator";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse>({
    nebiusConfigured: false,
    nebiusStatus: "CHECKING",
    nebiusBaseUrl: "https://api.tokenfactory.nebius.com/v1",
    nebiusModel: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
    nebiusModelAvailable: false,
    tavilyConfigured: false,
    tavilyStatus: "CHECKING",
    appVersion: "1.0.0",
    environment: "production",
  });

  // RunGuard Inputs
  const [inputs, setInputs] = useState<PreflightInputs>({
    projectName: "vLLM-Nemotron-70B-Inference",
    targetGpu: "nebius-h100-sxm",
    gpuCount: 1,
    estimatedModelParamsBillion: 70,
    precision: "FP16",
    contextLengthTokens: 8192,
    batchSize: 16,
    dockerfileContent: "",
    requirementsContent: "",
    workloadConfigContent: "",
    diagnosticLogContent: "",
  });

  // State objects
  const [preflightReport, setPreflightReport] = useState<PreflightReport | null>(null);
  const [diagnoseResult, setDiagnoseResult] = useState<DiagnoseResponse | null>(null);
  const [proposedPatch, setProposedPatch] = useState<ProposedPatch | null>(null);
  const [loadedFixture, setLoadedFixture] = useState<DemoFixture | null>(null);

  // FinOps Inputs
  const [baselineGpu, setBaselineGpu] = useState<GpuWorkloadInput>({
    gpuId: "aws-p5-h100",
    gpuCount: 8,
    billedHours: 720,
    pricingModel: "on-demand",
    billingUnit: "GPU-hour",
    customHourlyRateUsd: null,
  });

  const [baselineModel, setBaselineModel] = useState<ModelInferenceInput>({
    modelName: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
    inputTokensMillion: 25.0,
    outputTokensMillion: 12.5,
    inputTokenRatePerMillionUsd: 0.20,
    outputTokenRatePerMillionUsd: 0.50,
  });

  const [proposedGpu, setProposedGpu] = useState<GpuWorkloadInput>({
    gpuId: "nebius-h100-sxm",
    gpuCount: 4,
    billedHours: 720,
    pricingModel: "on-demand",
    billingUnit: "GPU-hour",
    customHourlyRateUsd: null,
  });

  const [proposedModel, setProposedModel] = useState<ModelInferenceInput>({
    modelName: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
    inputTokensMillion: 25.0,
    outputTokensMillion: 12.5,
    inputTokenRatePerMillionUsd: 0.20,
    outputTokenRatePerMillionUsd: 0.50,
  });

  const [comparisonResult, setComparisonResult] = useState<FinOpsComparisonResult | null>(null);
  const [passport, setPassport] = useState<RunCostPassport | null>(null);

  // Loading flags
  const [isLoadingPreflight, setIsLoadingPreflight] = useState(false);
  const [isLoadingDiagnose, setIsLoadingDiagnose] = useState(false);
  const [isLoadingFinops, setIsLoadingFinops] = useState(false);
  const [isLoadingPassport, setIsLoadingPassport] = useState(false);
  const [isReverifying, setIsReverifying] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  const statusRequestIdRef = useRef(0);

  // Fetch system status with active caching, sequence tracking & on-demand refresh support
  const fetchStatus = useCallback(async (bypassCache = false) => {
    const currentRequestId = ++statusRequestIdRef.current;
    if (bypassCache) setIsRefreshingStatus(true);

    try {
      const url = bypassCache ? "/api/status?refresh=true" : "/api/status";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Status check returned ${res.status}`);
      const data: SystemStatusResponse = await res.json();

      // Guard against race conditions: prevent slower/older response from overwriting newer one
      if (currentRequestId === statusRequestIdRef.current) {
        setSystemStatus(data);
        if (data.nebiusModel) {
          setBaselineModel((prev) => ({ ...prev, modelName: data.nebiusModel }));
          setProposedModel((prev) => ({ ...prev, modelName: data.nebiusModel }));
        }
      }
    } catch {
      if (currentRequestId === statusRequestIdRef.current) {
        setSystemStatus((prev) => ({
          ...prev,
          nebiusStatus: prev.nebiusConfigured ? prev.nebiusStatus : "FAILED",
          tavilyStatus: prev.tavilyConfigured ? prev.tavilyStatus : "FAILED",
          nebiusError: prev.nebiusError || "Connection timed out or network probe failed",
          tavilyError: prev.tavilyError || "Connection timed out or network probe failed",
        }));
      }
    } finally {
      if (bypassCache && currentRequestId === statusRequestIdRef.current) {
        setIsRefreshingStatus(false);
      }
    }
  }, []);

  // Poll system status on mount, periodically every 30s, and when browser tab regains focus
  useEffect(() => {
    // Automatically perform a fresh status check when app first opens (bypassing stale cache)
    fetchStatus(true);

    // Keep polling at a reasonable 30s interval
    const intervalId = setInterval(() => {
      fetchStatus(false);
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStatus(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchStatus]);

  // Handle demo fixture selection
  const handleSelectFixture = (fixture: DemoFixture) => {
    setLoadedFixture(fixture);
    setInputs({
      projectName: fixture.inputs.projectName,
      targetGpu: fixture.inputs.targetGpu,
      gpuCount: fixture.inputs.gpuCount,
      estimatedModelParamsBillion: fixture.inputs.estimatedModelParamsBillion,
      precision: fixture.inputs.precision,
      contextLengthTokens: fixture.inputs.contextLengthTokens,
      batchSize: fixture.inputs.batchSize,
      dockerfileContent: fixture.inputs.dockerfileContent,
      requirementsContent: fixture.inputs.requirementsContent,
      workloadConfigContent: fixture.inputs.workloadConfigContent,
      diagnosticLogContent: fixture.inputs.diagnosticLogContent,
    });

    // Update FinOps values
    setBaselineGpu((prev) => ({
      ...prev,
      gpuId: fixture.finopsDefaults.baselineGpuId,
      gpuCount: fixture.finopsDefaults.baselineGpuCount,
      billedHours: fixture.finopsDefaults.baselineHours,
      customHourlyRateUsd: null,
      pricingModel: "on-demand",
      billingUnit: "GPU-hour",
    }));

    setProposedGpu((prev) => ({
      ...prev,
      gpuId: fixture.finopsDefaults.proposedGpuId,
      gpuCount: fixture.finopsDefaults.proposedGpuCount,
      billedHours: fixture.finopsDefaults.proposedHours,
      customHourlyRateUsd: null,
      pricingModel: "on-demand",
      billingUnit: "GPU-hour",
    }));

    setBaselineModel((prev) => ({
      ...prev,
      inputTokensMillion: fixture.finopsDefaults.inputTokensMillion,
      outputTokensMillion: fixture.finopsDefaults.outputTokensMillion,
    }));

    setProposedModel((prev) => ({
      ...prev,
      inputTokensMillion: fixture.finopsDefaults.inputTokensMillion,
      outputTokensMillion: fixture.finopsDefaults.outputTokensMillion,
    }));

    // Run deterministic preflight immediately on fixture load
    const report = runPreflightChecks({
      projectName: fixture.inputs.projectName,
      targetGpu: fixture.inputs.targetGpu,
      gpuCount: fixture.inputs.gpuCount,
      estimatedModelParamsBillion: fixture.inputs.estimatedModelParamsBillion,
      precision: fixture.inputs.precision,
      contextLengthTokens: fixture.inputs.contextLengthTokens,
      batchSize: fixture.inputs.batchSize,
      dockerfileContent: fixture.inputs.dockerfileContent,
      requirementsContent: fixture.inputs.requirementsContent,
      workloadConfigContent: fixture.inputs.workloadConfigContent,
      diagnosticLogContent: fixture.inputs.diagnosticLogContent,
    });

    setPreflightReport(report);
    setProposedPatch(report.suggestedPatch || null);

    // Recompute Finops
    const baseFin = calculateFinOpsCost({
      gpuId: fixture.finopsDefaults.baselineGpuId,
      gpuCount: fixture.finopsDefaults.baselineGpuCount,
      billedHours: fixture.finopsDefaults.baselineHours,
    });
    const propFin = calculateFinOpsCost({
      gpuId: fixture.finopsDefaults.proposedGpuId,
      gpuCount: fixture.finopsDefaults.proposedGpuCount,
      billedHours: fixture.finopsDefaults.proposedHours,
    });
    const comp = compareFinOpsConfigurations(baseFin, propFin);
    setComparisonResult(comp);

    // Generate Passport
    const pass = generateRunCostPassport({
      projectName: fixture.inputs.projectName,
      targetGpu: fixture.inputs.targetGpu,
      gpuCount: fixture.inputs.gpuCount,
      preflightReport: report,
      finopsComparison: comp,
      proposedPatch: report.suggestedPatch,
    });
    setPassport(pass);
  };

  // Run Preflight Checks via API
  const handleRunPreflight = async () => {
    setIsLoadingPreflight(true);
    try {
      const res = await fetch("/api/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      if (!res.ok) throw new Error("Preflight API call failed");
      const report: PreflightReport = await res.json();
      setPreflightReport(report);
      if (report.suggestedPatch) {
        setProposedPatch(report.suggestedPatch);
      }
    } catch {
      // Fallback to client deterministic engine
      const report = runPreflightChecks(inputs);
      setPreflightReport(report);
      if (report.suggestedPatch) {
        setProposedPatch(report.suggestedPatch);
      }
    } finally {
      setIsLoadingPreflight(false);
    }
  };

  // Run Real-time Diagnosis
  const handleRunDiagnosis = async () => {
    setIsLoadingDiagnose(true);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticLog: inputs.diagnosticLogContent,
          dockerfileContent: inputs.dockerfileContent,
          workloadConfigContent: inputs.workloadConfigContent,
          projectName: inputs.projectName,
          targetGpu: inputs.targetGpu,
        }),
      });

      const data: DiagnoseResponse = await res.json();
      setDiagnoseResult(data);
      fetchStatus(true);

      if (data.suggestedPatch) {
        setProposedPatch({
          id: `patch-${Date.now()}`,
          title: `Remediation for ${inputs.projectName}`,
          targetFile: data.suggestedPatch.targetFile,
          originalContent: data.suggestedPatch.originalSnippet,
          patchedContent: data.suggestedPatch.proposedPatchSnippet,
          diff: `--- a/${data.suggestedPatch.targetFile}\n+++ b/${data.suggestedPatch.targetFile}\n- ${data.suggestedPatch.originalSnippet}\n+ ${data.suggestedPatch.proposedPatchSnippet}`,
          explanation: [data.suggestedPatch.explanation],
          status: "GENERATED",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Diagnostic execution failed";
      setDiagnoseResult({
        success: false,
        modelUsed: systemStatus?.nebiusModel || "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
        likelyRootCause: "Could not execute remote diagnostic API call.",
        alternativeExplanations: [],
        suggestedActionPlan: [],
        citations: [],
        sanitizedTokensProcessed: 0,
        error: errorMsg,
      });
    } finally {
      setIsLoadingDiagnose(false);
    }
  };

  // Patch Approval & Application
  const handleApprovePatch = () => {
    if (!proposedPatch) return;
    setProposedPatch({
      ...proposedPatch,
      status: "APPROVED",
      approvedAt: new Date().toISOString(),
    });
  };

  const handleApplyPatch = (patchToApply?: ProposedPatch) => {
    const p = patchToApply || proposedPatch;
    if (!p) return;
    // Update target input
    if (p.targetFile.includes("Dockerfile")) {
      setInputs((prev) => ({ ...prev, dockerfileContent: p.patchedContent }));
    } else if (p.targetFile.includes("requirements")) {
      setInputs((prev) => ({ ...prev, requirementsContent: p.patchedContent }));
    } else {
      setInputs((prev) => ({ ...prev, workloadConfigContent: p.patchedContent }));
    }

    setProposedPatch({
      ...p,
      status: "APPLIED",
    });
  };

  const handleReverifyPatch = async () => {
    setIsReverifying(true);
    try {
      await handleRunPreflight();
      if (proposedPatch) {
        setProposedPatch({
          ...proposedPatch,
          status: "RE_VERIFIED",
          verifiedAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsReverifying(false);
    }
  };

  // FinOps Calculation
  const handleCalculateFinops = async () => {
    setIsLoadingFinops(true);
    try {
      const res = await fetch("/api/finops/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baselineGpu,
          baselineModel,
          proposedGpu,
          proposedModel,
          context: {
            baselineGpuId: baselineGpu.gpuId,
            proposedGpuId: proposedGpu.gpuId,
            modelParamBillion: inputs.estimatedModelParamsBillion,
          },
        }),
      });

      const data = await res.json();
      if (data.comparison) {
        setComparisonResult(data.comparison);
      }
    } catch {
      // Fallback to client calculator
      const base = calculateFinOpsCost(baselineGpu, baselineModel);
      const prop = calculateFinOpsCost(proposedGpu, proposedModel);
      const comp = compareFinOpsConfigurations(base, prop, {
        baselineGpuId: baselineGpu.gpuId,
        proposedGpuId: proposedGpu.gpuId,
        modelParamBillion: inputs.estimatedModelParamsBillion,
      });
      setComparisonResult(comp);
    } finally {
      setIsLoadingFinops(false);
    }
  };

  // Generate Run & Cost Passport
  const handleGeneratePassport = async () => {
    setIsLoadingPassport(true);
    try {
      const currentReport = preflightReport || runPreflightChecks(inputs);
      const pass = generateRunCostPassport({
        projectName: inputs.projectName,
        targetGpu: inputs.targetGpu,
        gpuCount: inputs.gpuCount,
        preflightReport: currentReport,
        diagnosticResult: diagnoseResult
          ? {
              success: diagnoseResult.success,
              modelUsed: diagnoseResult.modelUsed,
              parsedResponse: {
                likelyRootCause: diagnoseResult.likelyRootCause,
                alternativeExplanations: diagnoseResult.alternativeExplanations,
                actionPlan: diagnoseResult.suggestedActionPlan,
              },
            }
          : undefined,
        citations: diagnoseResult?.citations,
        finopsComparison: comparisonResult || undefined,
        proposedPatch: proposedPatch || undefined,
      });
      setPassport(pass);
    } finally {
      setIsLoadingPassport(false);
    }
  };

  return (
    <div className="min-h-screen bg-app text-text-primary flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        onSelectFixture={handleSelectFixture}
        loadedFixture={loadedFixture}
        onRefreshStatus={() => fetchStatus(true)}
        isRefreshingStatus={isRefreshingStatus}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === "dashboard" && (
          <DashboardTab
            preflightReport={preflightReport}
            finopsComparison={comparisonResult}
            finopsSingle={null}
            latestPassport={passport}
            systemStatus={systemStatus}
            setActiveTab={setActiveTab}
            onSelectFixture={handleSelectFixture}
            loadedFixture={loadedFixture}
          />
        )}

        {activeTab === "runguard" && (
          <RunGuardTab
            inputs={inputs}
            setInputs={setInputs}
            preflightReport={preflightReport}
            onRunPreflight={handleRunPreflight}
            isLoading={isLoadingPreflight}
            setActiveTab={setActiveTab}
            loadedFixture={loadedFixture}
            onApplyPatch={handleApplyPatch}
            onReverifyPatch={handleReverifyPatch}
            isReverifying={isReverifying}
          />
        )}

        {activeTab === "diagnose" && (
          <DiagnoseTab
            diagnoseResult={diagnoseResult}
            onRunDiagnosis={handleRunDiagnosis}
            isLoading={isLoadingDiagnose}
            systemStatus={systemStatus}
            setActiveTab={setActiveTab}
            onRefreshStatus={() => fetchStatus(true)}
            isRefreshingStatus={isRefreshingStatus}
          />
        )}

        {activeTab === "patch" && (
          <PatchReviewTab
            proposedPatch={proposedPatch}
            onApprovePatch={handleApprovePatch}
            onApplyPatch={handleApplyPatch}
            onReverifyPatch={handleReverifyPatch}
            isReverifying={isReverifying}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "finops" && (
          <FinOpsTab
            baselineGpu={baselineGpu}
            setBaselineGpu={setBaselineGpu}
            baselineModel={baselineModel}
            setBaselineModel={setBaselineModel}
            proposedGpu={proposedGpu}
            setProposedGpu={setProposedGpu}
            proposedModel={proposedModel}
            setProposedModel={setProposedModel}
            comparisonResult={comparisonResult}
            onCalculate={handleCalculateFinops}
            isLoading={isLoadingFinops}
            loadedFixture={loadedFixture}
          />
        )}

        {activeTab === "passport" && (
          <PassportTab
            passport={passport}
            onGeneratePassport={handleGeneratePassport}
            isGenerating={isLoadingPassport}
          />
        )}
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-border-standard bg-surface-secondary py-8 text-center text-[13px] text-text-secondary">
        <div className="mx-auto max-w-7xl px-4 space-y-1.5">
          <p className="font-semibold text-text-primary text-[14px] tracking-tight">
            VARANASI — Autonomous GPU RunGuard &amp; FinOps Margin Engine
          </p>
          <p className="text-[13px] text-text-secondary">
            Track: <span className="text-nvidia-dark font-semibold">Coding and Agentic Engineering</span> | Nebius × NVIDIA Global AI Hackathon 2026
          </p>
          <p className="text-[12px] text-text-muted">
            Catch failures. Protect compute. Protect margins. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
