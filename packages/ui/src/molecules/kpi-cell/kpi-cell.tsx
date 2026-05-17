import * as React from "react";
import { cn } from "../../cn";

type KpiDeltaTone = "ok" | "bad" | "dim";

type KpiCellProps = React.ComponentProps<"div"> & {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: React.ReactNode;
  deltaTone?: KpiDeltaTone;
  accent?: boolean;
};

const DELTA: Record<KpiDeltaTone, string> = {
  ok: "text-ok",
  bad: "text-bad",
  dim: "text-ink-3",
};

function KpiCell({
  label,
  value,
  unit,
  delta,
  deltaTone = "ok",
  accent = false,
  className,
  ...props
}: KpiCellProps) {
  return (
    <div
      data-slot="kpi-cell"
      className={cn(
        "min-w-[200px] rounded-md border border-border bg-surface px-6 py-[22px]",
        className
      )}
      {...props}
    >
      <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
        {label}
      </div>
      <div
        className={cn(
          "font-mono text-[36px] font-light leading-none tracking-[-0.04em]",
          accent ? "text-brand" : "text-ink"
        )}
      >
        {value}
        {unit && <small className="ml-1 text-[14px] font-light text-ink-3">{unit}</small>}
      </div>
      {delta && (
        <div className={cn("mt-3 font-mono text-[11px] tracking-[0.02em]", DELTA[deltaTone])}>
          {delta}
        </div>
      )}
    </div>
  );
}

export { KpiCell };
export type { KpiCellProps, KpiDeltaTone };
