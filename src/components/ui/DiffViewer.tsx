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

  const lines = diff.split(/\r?\n/);

  return (
    <div className="rounded-xl border border-border-standard bg-surface-card overflow-hidden font-mono text-xs shadow-card">
      {/* Diff Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border-subtle bg-surface-elevated px-4 py-3 gap-2">
        <div className="flex items-center gap-2.5 text-text-primary">
          <FileCode className="h-4 w-4 text-nvidia-green" />
          <span className="font-semibold text-text-primary text-xs sm:text-sm">{fileName}</span>
          <span className="text-[11px] text-text-muted hidden sm:inline">(Reviewable Unified Diff)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md border border-border-standard bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-nvidia-green hover:text-text-primary transition"
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
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-md border border-border-standard bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-nvidia-green hover:text-text-primary transition"
            title="Download Patched File"
          >
            <Download className="h-3.5 w-3.5 text-text-muted" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="overflow-x-auto p-4 max-h-[440px] leading-relaxed bg-surface-input">
        {lines.map((line, idx) => {
          let lineBg = "text-text-muted hover:bg-surface-elevated/40";
          if (line.startsWith("+") && !line.startsWith("+++")) {
            lineBg = "bg-nvidia-surface text-nvidia-light border-l-2 border-nvidia-green pl-2";
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            lineBg = "bg-status-error/10 text-status-error border-l-2 border-status-error pl-2";
          } else if (line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++")) {
            lineBg = "text-text-primary font-bold bg-surface-elevated/80 py-0.5 px-1 rounded";
          }

          return (
            <div key={idx} className={`flex items-start font-mono text-[11px] sm:text-xs py-0.5 ${lineBg}`}>
              <span className="w-8 shrink-0 select-none text-right pr-3 text-text-muted/60 text-[10px]">
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
