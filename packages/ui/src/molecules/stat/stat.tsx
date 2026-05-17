import * as React from "react";
import { cn } from "../../cn";

type StatProps = React.ComponentProps<"div"> & {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  accent?: boolean;
};

function Stat({ label, value, unit, accent, className, ...props }: StatProps) {
  return (
    <div data-slot="stat" className={cn("flex flex-col", className)} {...props}>
      <span className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[28px] leading-none font-light tracking-[-0.03em]",
          accent ? "text-brand" : "text-ink"
        )}
      >
        {value}
        {unit && <span className="ml-1 text-[14px] text-ink-3">{unit}</span>}
      </span>
    </div>
  );
}

export { Stat };
export type { StatProps };
