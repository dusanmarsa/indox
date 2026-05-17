import * as React from "react";
import { cn } from "../../cn";

type MetricDeltaTone = "ok" | "bad" | "dim";

type MetricCellProps = React.ComponentProps<"div"> & {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: MetricDeltaTone;
  chart?: React.ReactNode;
};

const DELTA: Record<MetricDeltaTone, string> = {
  ok: "text-ok",
  bad: "text-bad",
  dim: "text-ink-3",
};

function MetricCell({
  label,
  value,
  unit,
  delta,
  deltaTone = "ok",
  chart,
  className,
  ...props
}: MetricCellProps) {
  return (
    <div
      data-slot="metric-cell"
      className={cn(
        "bg-[linear-gradient(180deg,var(--indox-card-grad-top),var(--indox-card-grad-bot))] px-8 pt-8 pb-9",
        className
      )}
      {...props}
    >
      <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-3">
        {label}
      </div>
      <div
        className="indox-h-grad text-[64px] leading-none font-semibold tracking-[-0.05em]"
        style={{ display: "inline-block" }}
      >
        {value}
        {unit && (
          <small className="ml-1.5 text-[22px] font-normal tracking-normal text-ink-2 [-webkit-text-fill-color:var(--indox-ink-2)]">
            {unit}
          </small>
        )}
      </div>
      {delta && (
        <div
          className={cn(
            "mt-2.5 flex items-center gap-1.5 font-mono text-[11.5px]",
            DELTA[deltaTone]
          )}
        >
          {delta}
        </div>
      )}
      {chart && <div className="mt-4 h-20 w-full">{chart}</div>}
    </div>
  );
}

export { MetricCell };
export type { MetricCellProps, MetricDeltaTone };
