import * as React from "react";
import { cn } from "../../cn";

type HealthStatus = "ok" | "warn" | "bad";

type SourceHealthRowProps = React.ComponentProps<"div"> & {
  status: HealthStatus;
  name: React.ReactNode;
  subtext?: React.ReactNode;
  count?: React.ReactNode;
  latency?: React.ReactNode;
  lastSync?: React.ReactNode;
};

const LED: Record<HealthStatus, string> = {
  ok: "bg-ok text-ok shadow-[0_0_6px_currentColor] indox-pulse",
  warn: "bg-warn text-warn shadow-[0_0_6px_currentColor]",
  bad: "bg-bad text-bad shadow-[0_0_6px_currentColor]",
};

function SourceHealthRow({
  status,
  name,
  subtext,
  count,
  latency,
  lastSync,
  className,
  ...props
}: SourceHealthRowProps) {
  return (
    <div
      data-slot="source-health-row"
      className={cn(
        "grid items-center gap-3.5 border-b border-border py-3 font-mono text-[12px] last:border-b-0",
        "grid-cols-[14px_1fr_100px_90px_110px]",
        className
      )}
      {...props}
    >
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", LED[status])} />
      <span className="text-ink">
        {name}
        {subtext && <small className="ml-1.5 text-[10.5px] text-ink-3">{subtext}</small>}
      </span>
      <span className="text-right text-[11.5px] text-ink-2">{count}</span>
      <span className="text-right text-[11.5px] text-ink">{latency}</span>
      <span className="text-[10.5px] text-ink-3">{lastSync}</span>
    </div>
  );
}

export { SourceHealthRow };
export type { SourceHealthRowProps, HealthStatus };
