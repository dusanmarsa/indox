import * as React from "react";
import { cn } from "../../cn";

type SourceStatus = "ok" | "warn" | "bad" | "syncing";

type SourceStat = { label: React.ReactNode; value: React.ReactNode };

type SourceCardProps = Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ReactNode;
  status?: SourceStatus;
  statusLabel?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  stats?: SourceStat[];
};

const STATUS: Record<SourceStatus, { text: string; dot: string }> = {
  ok: {
    text: "text-ok",
    dot: "bg-ok shadow-[0_0_6px_var(--indox-ok)]",
  },
  warn: {
    text: "text-warn",
    dot: "bg-warn",
  },
  bad: {
    text: "text-bad",
    dot: "bg-bad",
  },
  syncing: {
    text: "text-warn",
    dot: "bg-warn indox-pulse",
  },
};

function SourceCard({
  icon,
  status = "ok",
  statusLabel,
  title,
  description,
  stats,
  className,
  ...props
}: SourceCardProps) {
  const s = STATUS[status];
  return (
    <div
      data-slot="source-card"
      className={cn(
        "relative cursor-pointer rounded-sm border border-border bg-surface px-[22px] pt-[22px] pb-5 transition-all hover:-translate-y-px hover:border-border-strong hover:bg-surface-2",
        className
      )}
      {...props}
    >
      <div className="mb-[18px] flex items-start justify-between">
        <span className="flex size-9 items-center justify-center rounded-lg bg-surface-3 text-ink">
          {icon}
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em]",
            s.text
          )}
        >
          <span aria-hidden className={cn("size-1.5 rounded-full", s.dot)} />
          {statusLabel ?? status}
        </span>
      </div>
      <div className="mb-1 font-mono text-[14px] text-ink">{title}</div>
      {description && (
        <div className="mb-[18px] font-mono text-[12.5px] leading-[1.5] text-ink-3">
          {description}
        </div>
      )}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 font-mono">
          {stats.map((st, i) => (
            <div key={i}>
              <div className="mb-1 text-[9.5px] uppercase tracking-[0.12em] text-ink-3">
                {st.label}
              </div>
              <div className="text-[14px] font-medium tracking-[-0.01em] text-ink">{st.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type SourceCardAddProps = React.ComponentProps<"button">;

function SourceCardAdd({
  className,
  children = "+ Connect another source",
  ...props
}: SourceCardAddProps) {
  return (
    <button
      type="button"
      data-slot="source-card-add"
      className={cn(
        "flex min-h-[200px] cursor-pointer items-center justify-center rounded-[10px] border border-dashed border-border bg-transparent font-mono text-[12.5px] text-ink-3 transition-colors hover:border-ink-2 hover:text-ink",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { SourceCard, SourceCardAdd };
export type { SourceCardProps, SourceCardAddProps, SourceStatus, SourceStat };
