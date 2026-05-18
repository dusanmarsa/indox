import * as React from "react";
import { cn } from "../../cn";
import { Eyebrow } from "../../atoms/eyebrow";

type DashboardHeroProps = Omit<React.ComponentProps<"section">, "title"> & {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Right-side slot — typically a row of `<Stat />` cells. */
  stats?: React.ReactNode;
};

/**
 * Top-of-page hero used by the dashboard surfaces (Library, Sources, Queries…).
 * Two-column on `md+` (text left, stats right); stacked on small screens.
 */
function DashboardHero({ eyebrow, title, lead, stats, className, ...props }: DashboardHeroProps) {
  return (
    <section
      data-slot="dashboard-hero"
      className={cn(
        "grid items-end gap-8 pt-4 pb-10 sm:gap-12 sm:pt-8 sm:pb-15 md:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    >
      <div>
        {eyebrow && (
          <Eyebrow className="mb-[18px]" withRule>
            {eyebrow}
          </Eyebrow>
        )}
        <h1
          className="mb-[18px] font-semibold text-ink"
          style={{
            fontSize: "clamp(28px, 6vw, 64px)",
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>
        {lead && (
          <p className="max-w-[540px] text-[14px] leading-[1.6] text-ink-2 sm:text-[16px]">
            {lead}
          </p>
        )}
      </div>
      {stats && <div className="flex flex-wrap gap-6 sm:gap-9">{stats}</div>}
    </section>
  );
}

export { DashboardHero };
export type { DashboardHeroProps };
