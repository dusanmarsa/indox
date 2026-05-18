import * as React from "react";
import { cn } from "../../cn";

type Citation = {
  index: number;
  source: string;
  position?: string;
  quote?: string;
  score?: number;
};

type CitationCardProps = Omit<React.ComponentProps<"div">, "title"> & {
  title?: React.ReactNode;
  count?: number;
  citations: Citation[];
  onCitationClick?: (citation: Citation) => void;
};

function CitationCard({
  title = "Sources",
  count,
  citations,
  onCitationClick,
  className,
  ...props
}: CitationCardProps) {
  const total = count ?? citations.length;
  return (
    <div
      data-slot="citation-card"
      className={cn(
        "flex flex-col gap-1.5 rounded-md border border-border bg-surface px-3.5 pt-3.5 pb-3",
        className
      )}
      {...props}
    >
      <div className="mb-1 flex items-center justify-between border-b border-border pb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">
        <span>{title}</span>
        <span className="text-brand">{total}</span>
      </div>
      {citations.map((c) => {
        const pct = Math.max(0, Math.min(1, c.score ?? 0));
        return (
          <button
            key={c.index}
            type="button"
            onClick={onCitationClick && (() => onCitationClick(c))}
            className="grid grid-cols-[22px_1fr_60px] items-center gap-3 py-2 text-left transition-colors hover:bg-surface-2"
          >
            <span className="rounded-xs bg-brand-soft px-1 py-px text-center font-mono text-[10.5px] text-brand">
              {c.index}
            </span>
            <span className="overflow-hidden">
              <span className="font-mono text-[12px] text-ink">
                {c.source}
                {c.position && <span className="ml-1.5 text-ink-3">{c.position}</span>}
              </span>
              {c.quote && (
                <span className="mt-0.5 block truncate text-[12.5px] leading-[1.55] text-ink-2">
                  {c.quote}
                </span>
              )}
            </span>
            {typeof c.score === "number" && (
              <span className="text-right font-mono text-[11px] text-ink-2">
                {c.score.toFixed(2)}
                <span className="mt-1 block h-0.5 overflow-hidden rounded-[2px] bg-surface-3">
                  <span className="block h-full bg-brand" style={{ width: `${pct * 100}%` }} />
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { CitationCard };
export type { Citation, CitationCardProps };
