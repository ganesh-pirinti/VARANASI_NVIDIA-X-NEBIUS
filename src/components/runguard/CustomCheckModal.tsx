"use client";

import React, { useState } from "react";
import { X, Check, ShieldCheck, AlertCircle, Plus, Trash2 } from "lucide-react";
import { CustomValidationRule, Severity, CheckCategory } from "@/types/runguard";

interface CustomCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRule: (rule: CustomValidationRule) => void;
  existingRules: CustomValidationRule[];
  onDeleteRule?: (id: string) => void;
  onToggleRule?: (id: string) => void;
}

export const CustomCheckModal: React.FC<CustomCheckModalProps> = ({
  isOpen,
  onClose,
  onSaveRule,
  existingRules,
  onDeleteRule,
  onToggleRule,
}) => {
  const [ruleName, setRuleName] = useState("");
  const [category, setCategory] = useState<CheckCategory>("WORKLOAD_RESOURCES");
  const [field, setField] = useState<CustomValidationRule["field"]>("vram_allocated_gib");
  const [operator, setOperator] = useState<CustomValidationRule["operator"]>(">");
  const [threshold, setThreshold] = useState("80");
  const [severity, setSeverity] = useState<Severity>("HIGH");
  const [description, setDescription] = useState("");
  const [recommendedFix, setRecommendedFix] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!ruleName.trim()) {
      setFormError("Rule name is required.");
      return;
    }
    if (!threshold.trim()) {
      setFormError("Threshold or comparison value is required.");
      return;
    }

    const newRule: CustomValidationRule = {
      id: `rule-${Date.now()}`,
      name: ruleName.trim(),
      category,
      field,
      operator,
      threshold: threshold.trim(),
      severity,
      description: description.trim() || `Enforce ${field} ${operator} ${threshold}`,
      recommendedFix: recommendedFix.trim() || `Adjust configuration so that ${field} satisfies policy`,
      isEnabled: true,
    };

    onSaveRule(newRule);
    // Reset form
    setRuleName("");
    setThreshold("");
    setDescription("");
    setRecommendedFix("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[14px] border border-border-standard bg-surface-card shadow-elevated overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-secondary px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-[8px] bg-nvidia-surface p-2 text-nvidia-dark border border-nvidia-green/30">
              <ShieldCheck className="h-5 w-5 text-nvidia-green" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-text-primary">
                Custom Deterministic Validation Rule
              </h3>
              <p className="text-[12px] text-text-secondary">
                Define preflight guardrails enforced before cluster deployment (Strictly Deterministic — No script execution)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-[6px] p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text-primary transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {formError && (
            <div className="rounded-[8px] border border-status-error/30 bg-[#FEE2E2] p-3 text-[13px] text-status-error flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Form to create new rule */}
          <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                Rule Name *
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g. Max VRAM Ceiling Guard (80GB)"
                className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Evaluation Field
                </label>
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value as CustomValidationRule["field"])}
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[13px] text-text-primary focus:border-nvidia-green focus:outline-none"
                >
                  <option value="vram_allocated_gib">Estimated VRAM (GiB)</option>
                  <option value="batch_size">Concurrency / Batch Size</option>
                  <option value="context_length">Context Length (Tokens)</option>
                  <option value="gpu_count">Allocated GPU Count</option>
                  <option value="shm_size_gib">Shared Memory (/dev/shm GiB)</option>
                  <option value="dockerfile_content">Dockerfile Text</option>
                  <option value="requirements_content">requirements.txt Text</option>
                  <option value="log_content">Diagnostic Log Text</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Condition / Operator
                </label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as CustomValidationRule["operator"])}
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[13px] text-text-primary focus:border-nvidia-green focus:outline-none"
                >
                  <option value=">">&gt; (Greater than)</option>
                  <option value="<">&lt; (Less than)</option>
                  <option value=">=">&gt;= (Greater or equal)</option>
                  <option value="<=">&lt;= (Less or equal)</option>
                  <option value="==">== (Equals)</option>
                  <option value="!=">!= (Not equals)</option>
                  <option value="contains">contains (String / Keyword)</option>
                  <option value="missing">missing (Required Keyword)</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Threshold / Value *
                </label>
                <input
                  type="text"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="e.g. 80 or flash-attn"
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Severity on Violation
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[13px] text-text-primary focus:border-nvidia-green focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL (Blocks Deployment)</option>
                  <option value="HIGH">HIGH (Severe Risk)</option>
                  <option value="MEDIUM">MEDIUM (Standard Policy)</option>
                  <option value="LOW">LOW (Advisory)</option>
                  <option value="INFO">INFO (Telemetry / Informational)</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CheckCategory)}
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[13px] text-text-primary focus:border-nvidia-green focus:outline-none"
                >
                  <option value="VRAM_CAPACITY">VRAM Capacity</option>
                  <option value="WORKLOAD_RESOURCES">Workload Resources</option>
                  <option value="DEPENDENCIES_CUDA">Dependencies &amp; CUDA</option>
                  <option value="SHARED_MEMORY">Shared Memory</option>
                  <option value="DOCKER_CONTAINER">Docker Container</option>
                  <option value="STATIC_SYNTAX">Static Syntax</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                Recommended Fix Advice
              </label>
              <input
                type="text"
                value={recommendedFix}
                onChange={(e) => setRecommendedFix(e.target.value)}
                placeholder="e.g. Increase GPU count for Tensor Parallelism or quantize to FP8."
                className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[13px] text-text-primary focus:border-nvidia-green focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-[6px] bg-nvidia-green px-4 py-2 text-[13px] font-semibold text-white hover:bg-nvidia-hover transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Custom Validation Rule</span>
              </button>
            </div>
          </form>

          {/* List of active custom rules */}
          {existingRules.length > 0 && (
            <div className="border-t border-border-subtle pt-4 space-y-3">
              <h4 className="text-[14px] font-bold text-text-primary">
                Active Custom Rules ({existingRules.length})
              </h4>
              <div className="space-y-2">
                {existingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 rounded-[8px] border border-border-standard bg-surface-secondary text-[12px]"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-text-primary flex items-center gap-2">
                        <span>{rule.name}</span>
                        <span className="font-mono text-[10px] text-nvidia-dark bg-nvidia-surface px-1.5 py-0.5 rounded border border-nvidia-green/30">
                          {rule.field} {rule.operator} {rule.threshold}
                        </span>
                        <span className="font-mono text-[10px] text-status-warning bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                          {rule.severity}
                        </span>
                      </div>
                      <div className="text-text-secondary text-[11px]">{rule.recommendedFix}</div>
                    </div>
                    {onDeleteRule && (
                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="text-text-muted hover:text-status-error p-1 transition"
                        title="Delete rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-secondary px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-[6px] bg-nvidia-green px-4 py-2 text-[13px] font-semibold text-white hover:bg-nvidia-hover transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
