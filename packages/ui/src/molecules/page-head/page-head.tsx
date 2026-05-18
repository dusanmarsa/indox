import * as React from "react";
import { cn } from "../../cn";

type PageHeadProps = Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-side slot — e.g. action buttons. */
  actions?: React.ReactNode;
};

/**
 * Compact page header used by inner dashboard surfaces (Sources, Queries,
 * Settings, …). For the marquee Library page use `<DashboardHero />` instead.
 */
function PageHead({ title, subtitle, actions, className, ...props }: PageHeadProps) {
  return (
    <div
      data-slot="page-head"
      className={cn("mb-9 flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="min-w-0">
        <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        {subtitle && <p className="font-mono text-[13px] text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export { PageHead };
export type { PageHeadProps };
