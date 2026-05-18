import * as React from "react";
import { cn } from "../../cn";

type LandingHeroProps = Omit<React.ComponentProps<"section">, "title"> & {
  pill?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  ctas?: React.ReactNode;
  showGrid?: boolean;
  showGlow?: boolean;
};

function LandingHero({
  pill,
  title,
  subtitle,
  ctas,
  showGrid = true,
  showGlow = true,
  className,
  children,
  ...props
}: LandingHeroProps) {
  return (
    <section
      data-slot="landing-hero"
      className={cn("relative overflow-hidden px-8 pt-40 pb-20", className)}
      {...props}
    >
      {showGrid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(var(--indox-border)_1px,transparent_1px),linear-gradient(90deg,var(--indox-border)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_50%_30%,rgba(0,0,0,0.5)_0%,transparent_70%)]"
        />
      )}
      {showGlow && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-[12%] left-1/2 h-[720px] w-[1100px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(192,90,61,0.18)_0%,rgba(192,90,61,0)_60%)] blur-[20px]"
        />
      )}
      <div className="relative mx-auto max-w-[980px] text-center">
        {pill && <div className="mb-8 inline-flex">{pill}</div>}
        <h1 className="indox-h-grad mb-7 text-[clamp(48px,8vw,96px)] leading-[1.02] font-semibold tracking-[-0.04em]">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mb-11 max-w-[600px] text-[19px] leading-[1.55] tracking-[-0.005em] text-ink-2">
            {subtitle}
          </p>
        )}
        {ctas && <div className="mb-[90px] flex items-center justify-center gap-3">{ctas}</div>}
        {children}
      </div>
    </section>
  );
}

export { LandingHero };
export type { LandingHeroProps };
