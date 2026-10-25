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
    a.download = `patched-${fileName.replace(/^.*[\\/]/, "")}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPatch = () => {
    const blob = new Blob([diff], { type: "text/x-diff;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/^.*[\\/]/, "")}.patch`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = diff.split(/\r?\n/);

  return (
    <div className="rounded-[12px] border border-border-standard bg-white overflow-hidden font-mono text-[12px] shadow-card">
      {/* Diff Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border-subtle bg-surface-secondary px-4 py-3 gap-2">
        <div className="flex items-center gap-2.5 text-text-primary">
          <FileCode className="h-4 w-4 text-nvidia-green" />
          <span className="font-semibold text-text-primary text-[13px]">{fileName}</span>
          <span className="text-[12px] text-text-muted hidden sm:inline">(Reviewable Unified Diff)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-[6px] border border-border-standard bg-white px-3 py-1.5 text-[12px] font-semibold text-text-primary hover:bg-surface-secondary transition"
            title="Copy Patched Content"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-nvidia-green" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-text-muted" />
            )}
            <span>{copied ? "Copied" : "Copy Patch"}</span>
          </button>
          <button
            onClick={handleDownloadPatch}
            className="flex items-center gap-1.5 rounded-[6px] border border-border-standard bg-white px-3 py-1.5 text-[12px] font-semibold text-text-primary hover:bg-surface-secondary transition"
            title="Download unified diff as .patch file"
          >
            <Download className="h-3.5 w-3.5 text-text-muted" />
            <span>.patch File</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-[6px] border border-border-standard bg-white px-3 py-1.5 text-[12px] font-semibold text-text-primary hover:bg-surface-secondary transition"
            title="Download Full Patched File"
          >
            <Download className="h-3.5 w-3.5 text-text-muted" />
            <span>Patched File</span>
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="overflow-x-auto p-4 max-h-[440px] leading-relaxed bg-white">
        {lines.map((line, idx) => {
          let lineBg = "text-text-secondary hover:bg-surface-secondary/60";
          if (line.startsWith("+") && !line.startsWith("+++")) {
            lineBg = "bg-nvidia-surface text-nvidia-dark border-l-2 border-nvidia-green pl-2 font-medium";
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            lineBg = "bg-[#FEE2E2] text-[#C62828] border-l-2 border-[#C62828] pl-2 font-medium";
          } else if (line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++")) {
            lineBg = "text-text-primary font-bold bg-[#E8EAED] py-0.5 px-1 rounded";
          }

          return (
            <div key={idx} className={`flex items-start font-mono text-[12px] py-0.5 ${lineBg}`}>
              <span className="w-8 shrink-0 select-none text-right pr-3 text-text-muted text-[11px]">
                {idx + 1}
              </span>
              <span className="whitespace-pre overflow-x-visible">{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
