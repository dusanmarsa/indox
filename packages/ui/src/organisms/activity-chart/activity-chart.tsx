import * as React from "react";
import { cn } from "../../cn";

type ActivityChartProps = Omit<React.ComponentProps<"section">, "title"> & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  chart?: React.ReactNode;
};

function ActivityChart({
  title = "Activity",
  subtitle,
  chart,
  className,
  children,
  ...props
}: ActivityChartProps) {
  return (
    <section
      data-slot="activity-chart"
      className={cn("rounded-md border border-border bg-surface p-5", className)}
      {...props}
    >
      <header className="mb-4 flex items-baseline justify-between">
        <h3 className="font-mono text-[13px] text-ink">{title}</h3>
        {subtitle && <span className="font-mono text-[11px] text-ink-3">{subtitle}</span>}
      </header>
      {chart && <div className="mb-4">{chart}</div>}
      <div>{children}</div>
    </section>
  );
}

export { ActivityChart };
export type { ActivityChartProps };
