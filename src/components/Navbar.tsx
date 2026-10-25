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
            className="flex items-center gap-1.5 text-[11px] font-mono cursor-help"
            title={model ? `${label} Live & Connected. Verified model: ${model}` : `${label} API Live & Connected`}
          >
            <span className="h-2 w-2 rounded-full bg-nvidia-green shadow-sm shadow-nvidia-green" />
            <span className="text-text-muted">{label}:</span>
            <span className="text-nvidia-green font-semibold">Connected</span>
          </div>
        );
      case "CONFIGURED":
        return (
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono cursor-help"
            title={error || `${label} API key configured; ready for execution`}
          >
            <span className="h-2 w-2 rounded-full bg-text-secondary" />
            <span className="text-text-muted">{label}:</span>
            <span className="text-text-secondary font-semibold">Configured</span>
          </div>
        );
      case "CHECKING":
        return (
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono"
            title={`Checking ${label} connectivity...`}
          >
            <span className="h-2 w-2 rounded-full bg-status-warning animate-pulse" />
            <span className="text-text-muted">{label}:</span>
            <span className="text-status-warning font-semibold">Checking</span>
          </div>
        );
      case "FAILED":
        return (
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono cursor-help"
            title={error || `${label} connection or verification failed`}
          >
            <span className="h-2 w-2 rounded-full bg-status-error" />
            <span className="text-text-muted">{label}:</span>
            <span className="text-status-error font-semibold">Failed</span>
          </div>
        );
      case "NOT_CONFIGURED":
      default:
        return (
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono cursor-help"
            title={`${label} API key not configured in .env.local`}
          >
            <span className="h-2 w-2 rounded-full bg-status-warning/70" />
            <span className="text-text-muted">{label}:</span>
            <span className="text-status-warning font-semibold">No Key</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border-standard bg-app/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated border border-nvidia-border text-nvidia-green shadow-nvidia-glow">
            <ShieldAlert className="h-5 w-5" />
            {/* Subtle NVIDIA Green compute dot */}
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-nvidia-green border-2 border-app"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-text-primary">
                VARANASI
              </span>
              <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider text-nvidia-green border border-nvidia-border">
                NEBIUS × NVIDIA
              </span>
              {loadedFixture && (
                <span className="hidden lg:inline-flex items-center gap-1 rounded-md bg-status-warning/15 px-2 py-0.5 text-[10px] font-bold font-mono text-status-warning border border-status-warning/30">
                  <FlaskConical className="h-3 w-3" />
                  DEMO SCENARIO
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted hidden sm:block">
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
              className="flex items-center gap-1.5 rounded-lg border border-border-standard bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-text-primary hover:border-nvidia-green hover:text-nvidia-green transition shadow-sm"
              title="Load realistic test fixtures for evaluation"
            >
              <Sparkles className="h-3.5 w-3.5 text-nvidia-green" />
              <span className="hidden sm:inline">Load Demo Workload</span>
              <span className="sm:hidden">Demos</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showFixtureMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border-standard bg-surface-elevated p-2 shadow-2xl z-50 backdrop-blur-xl">
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-text-muted border-b border-border-subtle mb-1 flex items-center justify-between">
                  <span>Evaluation Workload Fixtures</span>
                  <span className="text-[9px] text-nvidia-green font-bold">Hackathon Suite</span>
                </div>
                {DEMO_FIXTURES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectFixture(f);
                      setShowFixtureMenu(false);
                    }}
                    className="w-full text-left rounded-lg p-2.5 hover:bg-surface-card transition group border border-transparent hover:border-border-subtle"
                  >
                    <div className="text-xs font-semibold text-text-primary group-hover:text-nvidia-green transition-colors">
                      {f.name}
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                      {f.tagline}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* API Health Pills */}
          <div className="hidden md:flex items-center gap-3 border-l border-border-subtle pl-3">
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
      <div className="border-t border-border-subtle bg-surface-secondary/70 px-4 sm:px-6 lg:px-8">
        <nav className="mx-auto flex max-w-7xl space-x-1 sm:space-x-2 overflow-x-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-nvidia-surface text-nvidia-green border border-nvidia-green shadow-sm"
                    : "text-text-muted hover:bg-surface-elevated hover:text-text-primary"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-nvidia-green" : "text-text-muted"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
