"use client";

import React, { useState } from "react";
import { Check, Copy, Download, FileCode } from "lucide-react";

interface DiffViewerProps {
  fileName: string;
  diff: string;
  patchedContent?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ fileName, diff, patchedContent }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(patchedContent || diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([patchedContent || diff], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patched-${fileName}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = diff.split(/\r?\n/);

  return (
    <div className="rounded-lg border border-navy-700 bg-navy-950 overflow-hidden font-mono text-xs">
      {/* Diff Header */}
      <div className="flex items-center justify-between border-b border-navy-800 bg-navy-900/90 px-4 py-2.5">
        <div className="flex items-center gap-2 text-slate-300">
          <FileCode className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">{fileName}</span>
          <span className="text-[11px] text-slate-500">(Reviewable Unified Diff)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded bg-navy-800 px-2.5 py-1 text-slate-300 hover:bg-navy-700 transition"
            title="Copy Patched Content"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Patch"}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded bg-navy-800 px-2.5 py-1 text-slate-300 hover:bg-navy-700 transition"
            title="Download Patched File"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="overflow-x-auto p-4 max-h-[420px] leading-relaxed">
        {lines.map((line, idx) => {
          let lineBg = "hover:bg-navy-900/50 text-slate-400";
          let symbol = " ";
          if (line.startsWith("+") && !line.startsWith("+++")) {
            lineBg = "bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500 pl-2";
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            lineBg = "bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 pl-2";
          } else if (line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++")) {
            lineBg = "text-cyan-400 font-bold bg-navy-900/60 py-0.5";
          }

          return (
            <div key={idx} className={`flex items-start ${lineBg}`}>
              <span className="w-8 shrink-0 select-none text-right pr-3 text-slate-600 text-[10px]">
                {idx + 1}
              </span>
              <span className="whitespace-pre">{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
