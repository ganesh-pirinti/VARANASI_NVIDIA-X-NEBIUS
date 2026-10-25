"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Cpu, 
  FileCode, 
  DollarSign, 
  FileText, 
  Sparkles,
  ChevronDown,
  Layers,
  FlaskConical,
  XCircle
} from "lucide-react";
import { SystemStatusResponse, IntegrationState } from "@/types/api";
import { DEMO_FIXTURES, DemoFixture } from "@/lib/fixtures/demo-workloads";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus: SystemStatusResponse | null;
  onSelectFixture: (fixture: DemoFixture) => void;
  loadedFixture?: DemoFixture | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  systemStatus,
  onSelectFixture,
  loadedFixture,
}) => {
  const [showFixtureMenu, setShowFixtureMenu] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Overview", icon: Cpu },
    { id: "runguard", label: "GPU RunGuard", icon: ShieldAlert },
    { id: "diagnose", label: "Diagnose & Investigate", icon: Sparkles },
    { id: "patch", label: "Patch Review", icon: FileCode },
    { id: "finops", label: "FinOps Engine", icon: DollarSign },
    { id: "passport", label: "Run & Cost Passport", icon: FileText },
  ];

  const renderStatusPill = (label: string, status?: IntegrationState, error?: string, model?: string) => {
    switch (status) {
      case "CONNECTED":
        return (
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono cursor-help bg-nvidia-surface text-nvidia-dark px-2 py-0.5 rounded-[4px] border border-nvidia-green/30"
            title={model ? `${label} Live & Connected. Verified model: ${model}` : `${label} API Live & Connected`}
          >
            <span className="h-2 w-2 rounded-full bg-nvidia-green" />
            <span className="text-text-secondary">{label}:</span>
            <span className="font-semibold text-nvidia-dark">Connected</span>
          </div>
        );
      case "CONFIGURED":
        return (
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono cursor-help bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-[4px] border border-border-standard"
            title={error || `${label} API key configured; ready for execution`}
          >
            <span className="h-2 w-2 rounded-full bg-text-muted" />
            <span className="text-text-muted">{label}:</span>
            <span className="font-semibold text-text-primary">Configured</span>
          </div>
        );
      case "CHECKING":
        return (
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono bg-[#FEF3C7] text-status-warning px-2 py-0.5 rounded-[4px] border border-status-warning/30"
            title={`Checking ${label} connectivity...`}
          >
            <span className="h-2 w-2 rounded-full bg-status-warning animate-pulse" />
            <span className="text-text-muted">{label}:</span>
            <span className="font-semibold text-status-warning">Checking</span>
          </div>
        );
      case "FAILED":
        return (
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono cursor-help bg-[#FEE2E2] text-status-error px-2 py-0.5 rounded-[4px] border border-status-error/30"
            title={error || `${label} connection or verification failed`}
          >
            <span className="h-2 w-2 rounded-full bg-status-error" />
            <span className="text-text-muted">{label}:</span>
            <span className="font-semibold text-status-error">Failed</span>
          </div>
        );
      case "NOT_CONFIGURED":
      default:
        return (
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono cursor-help bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-[4px] border border-border-standard"
            title={`${label} API key not configured in .env.local`}
          >
            <span className="h-2 w-2 rounded-full bg-status-warning" />
            <span className="text-text-muted">{label}:</span>
            <span className="font-semibold text-status-warning">No Key</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border-standard bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-[8px] bg-white border border-border-standard text-nvidia-green shadow-sm">
            <ShieldAlert className="h-5 w-5 text-nvidia-green" />
            {/* Subtle NVIDIA Green compute dot */}
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-nvidia-green border-2 border-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-bold tracking-tight text-text-primary">
                VARANASI
              </span>
              <span className="rounded-[4px] bg-nvidia-surface px-2 py-0.5 text-[11px] font-bold font-mono tracking-wider text-nvidia-dark border border-nvidia-green/30">
                NEBIUS × NVIDIA
              </span>
              {loadedFixture && (
                <span className="hidden lg:inline-flex items-center gap-1 rounded-[4px] bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-bold font-mono text-status-warning border border-status-warning/30">
                  <FlaskConical className="h-3 w-3" />
                  DEMO SCENARIO
                </span>
              )}
            </div>
            <p className="text-[12px] text-text-secondary hidden sm:block">
              Autonomous GPU RunGuard &amp; FinOps Margin Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Demonstration Fixtures */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Selector for Judges */}
          <div className="relative">
            <button
              onClick={() => setShowFixtureMenu(!showFixtureMenu)}
              className="flex items-center gap-1.5 rounded-[6px] border border-border-standard bg-white px-3.5 py-2 text-[13px] font-semibold text-text-primary hover:bg-surface-secondary hover:border-border-hover transition shadow-sm"
              title="Load realistic test fixtures for evaluation"
            >
              <Sparkles className="h-3.5 w-3.5 text-nvidia-green" />
              <span className="hidden sm:inline">Load Demo Workload</span>
              <span className="sm:hidden">Demos</span>
              <ChevronDown className="h-3 w-3 text-text-muted" />
            </button>

            {showFixtureMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-[8px] border border-border-standard bg-white p-2 shadow-xl z-50">
                <div className="px-2.5 py-1.5 text-[11px] font-mono uppercase text-text-muted border-b border-border-subtle mb-1 flex items-center justify-between">
                  <span>Evaluation Workload Fixtures</span>
                  <span className="text-[10px] text-nvidia-dark font-bold bg-nvidia-surface px-1.5 py-0.5 rounded">Hackathon Suite</span>
                </div>
                {DEMO_FIXTURES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectFixture(f);
                      setShowFixtureMenu(false);
                    }}
                    className="w-full text-left rounded-[6px] p-2.5 hover:bg-surface-secondary transition group border border-transparent hover:border-border-subtle"
                  >
                    <div className="text-[13px] font-semibold text-text-primary group-hover:text-nvidia-dark transition-colors">
                      {f.name}
                    </div>
                    <div className="text-[12px] text-text-secondary mt-0.5 line-clamp-1">
                      {f.tagline}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* API Health Pills */}
          <div className="hidden md:flex items-center gap-2.5 border-l border-border-subtle pl-3">
            {renderStatusPill(
              "Nebius",
              systemStatus?.nebiusStatus,
              systemStatus?.nebiusError,
              systemStatus?.nebiusModel
            )}
            {renderStatusPill(
              "Tavily",
              systemStatus?.tavilyStatus,
              systemStatus?.tavilyError
            )}
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="border-t border-border-subtle bg-surface-secondary px-4 sm:px-6 lg:px-8">
        <nav className="mx-auto flex max-w-7xl space-x-1 overflow-x-auto py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 rounded-[6px] px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition relative ${
                  isActive
                    ? "bg-nvidia-surface text-nvidia-dark border-b-[3px] border-nvidia-green"
                    : "text-text-secondary hover:bg-white hover:text-text-primary"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-nvidia-green" : "text-text-muted"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
