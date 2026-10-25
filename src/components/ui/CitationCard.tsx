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
    <div className="enterprise-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-4 w-4 text-nvidia-green shrink-0" />
          <span className="text-[14px] font-semibold text-text-primary line-clamp-1">
            {citation.title}
          </span>
        </div>
        {citation.url && (
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[12px] font-mono text-text-secondary hover:text-nvidia-green hover:underline shrink-0"
          >
            <span>{domain}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <p className="mt-2.5 text-[13px] text-text-secondary leading-[1.5] line-clamp-3">
        {citation.snippet}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5 text-[12px]">
        <span className="flex items-center gap-1.5 text-nvidia-dark font-mono font-medium bg-nvidia-surface px-2 py-0.5 rounded-[4px] border border-nvidia-green/30">
          <ShieldCheck className="h-3.5 w-3.5 text-nvidia-green" />
          Live Verified Reference
        </span>
        {citation.relevanceScore !== undefined && (
          <span className="font-mono text-text-muted text-[11px]">
            Relevance: {(citation.relevanceScore * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};
