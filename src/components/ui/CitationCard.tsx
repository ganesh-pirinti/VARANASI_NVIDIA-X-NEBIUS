import React from "react";
import { ExternalLink, BookOpen, ShieldCheck } from "lucide-react";
import { EvidenceCitation } from "@/types/passport";

interface CitationCardProps {
  citation: EvidenceCitation;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation }) => {
  // Extract domain name safely
  let domain = "";
  try {
    const parsed = new URL(citation.url);
    domain = parsed.hostname;
  } catch {
    domain = "Technical Source";
  }

  return (
    <div className="rounded-lg border border-navy-750 bg-navy-900/60 p-3.5 hover:border-cyan-500/40 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-200 line-clamp-1">
            {citation.title}
          </span>
        </div>
        {citation.url && (
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline shrink-0"
          >
            <span>{domain}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">
        {citation.snippet}
      </p>

      <div className="mt-2.5 flex items-center justify-between border-t border-navy-800/80 pt-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1 text-emerald-400/80 font-mono">
          <ShieldCheck className="h-3 w-3" />
          Live Verified External Reference
        </span>
        {citation.relevanceScore !== undefined && (
          <span className="font-mono">Relevance: {(citation.relevanceScore * 100).toFixed(0)}%</span>
        )}
      </div>
    </div>
  );
};
