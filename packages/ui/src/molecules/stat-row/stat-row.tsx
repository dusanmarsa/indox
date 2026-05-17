import * as React from "react";
import { cn } from "../../cn";

type StatRowProps = React.ComponentProps<"div"> & {
  label: React.ReactNode;
  value: React.ReactNode;
};

function StatRow({ label, value, className, ...props }: StatRowProps) {
  return (
    <div
      data-slot="stat-row"
      className={cn(
        "flex items-center justify-between px-2 py-2 font-mono text-[10.5px] text-ink-3",
        className
      )}
      {...props}
    >
      <span>{label}</span>
      <span className="text-ink-2">{value}</span>
    </div>
  );
}

export { StatRow };
export type { StatRowProps };
