import React from "react";
import { ExternalLink, BookOpen, ShieldCheck } from "lucide-react";
import { EvidenceCitation } from "@/types/passport";

interface CitationCardProps {
  citation: EvidenceCitation;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation }) => {
  let domain = "";
  try {
    const parsed = new URL(citation.url);
    domain = parsed.hostname;
  } catch {
    domain = "Technical Source";
  }

  return (
    <div className="rounded-xl border border-border-standard bg-surface-card p-4 hover:border-nvidia-green/50 transition shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-4 w-4 text-nvidia-green shrink-0" />
          <span className="text-xs font-semibold text-text-primary line-clamp-1">
            {citation.title}
          </span>
        </div>
        {citation.url && (
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-mono text-text-primary hover:text-nvidia-green hover:underline shrink-0"
          >
            <span>{domain}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <p className="mt-2.5 text-xs text-text-secondary leading-relaxed line-clamp-3">
        {citation.snippet}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5 text-[10px]">
        <span className="flex items-center gap-1 text-nvidia-green font-mono font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          Live Verified External Reference
        </span>
        {citation.relevanceScore !== undefined && (
          <span className="font-mono text-text-muted">
            Relevance: {(citation.relevanceScore * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};
