"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Cpu, 
  Search, 
  FileCode, 
  DollarSign, 
  FileText, 
  Sparkles,
  ChevronDown
} from "lucide-react";
import { SystemStatusResponse } from "@/types/api";
import { DEMO_FIXTURES, DemoFixture } from "@/lib/fixtures/demo-workloads";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus: SystemStatusResponse | null;
  onSelectFixture: (fixture: DemoFixture) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  systemStatus,
  onSelectFixture,
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

  return (
    <header className="sticky top-0 z-50 border-b border-navy-800 bg-navy-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950/50">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-slate-100">
                VARANASI
              </span>
              <span className="rounded bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider text-amber-400 border border-amber-500/30">
                NEBIUS × NVIDIA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Autonomous GPU RunGuard & FinOps Margin Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Demonstration Fixtures */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Selector for Judges */}
          <div className="relative">
            <button
              onClick={() => setShowFixtureMenu(!showFixtureMenu)}
              className="flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 transition"
              title="Load realistic test fixtures for evaluation"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Load Demo Workload</span>
              <span className="sm:hidden">Demos</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showFixtureMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-navy-700 bg-navy-900 p-2 shadow-2xl z-50">
                <div className="px-2 py-1 text-[11px] font-mono uppercase text-slate-400 border-b border-navy-800 mb-1">
                  Built-in Evaluation Fixtures
                </div>
                {DEMO_FIXTURES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectFixture(f);
                      setShowFixtureMenu(false);
                    }}
                    className="w-full text-left rounded-md p-2 hover:bg-navy-800 transition group"
                  >
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                      {f.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {f.tagline}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* API Health Pill */}
          <div className="hidden md:flex items-center gap-3 border-l border-navy-800 pl-3">
            {/* Nebius Status */}
            <div
              className="flex items-center gap-1.5 text-[11px] font-mono"
              title={systemStatus?.nebiusConfigured ? `Nebius Token Factory Active (${systemStatus.nebiusModel})` : "NEBIUS_API_KEY not configured"}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  systemStatus?.nebiusConfigured
                    ? "bg-emerald-400 shadow-sm shadow-emerald-500"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-slate-400">Nebius:</span>
              <span className={systemStatus?.nebiusConfigured ? "text-slate-200" : "text-amber-400"}>
                {systemStatus?.nebiusConfigured ? "Ready" : "No Key"}
              </span>
            </div>

            {/* Tavily Status */}
            <div
              className="flex items-center gap-1.5 text-[11px] font-mono"
              title={systemStatus?.tavilyConfigured ? "Tavily Search Engine Active" : "TAVILY_API_KEY not configured"}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  systemStatus?.tavilyConfigured
                    ? "bg-emerald-400 shadow-sm shadow-emerald-500"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-slate-400">Tavily:</span>
              <span className={systemStatus?.tavilyConfigured ? "text-slate-200" : "text-amber-400"}>
                {systemStatus?.tavilyConfigured ? "Ready" : "No Key"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="border-t border-navy-850 bg-navy-900/60 px-4 sm:px-6 lg:px-8">
        <nav className="mx-auto flex max-w-7xl space-x-1 sm:space-x-2 overflow-x-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:bg-navy-800 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
