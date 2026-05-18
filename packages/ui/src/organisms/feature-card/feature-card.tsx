import * as React from "react";
import { cn } from "../../cn";

type FeatureCardWidth = "narrow" | "half" | "full";

type FeatureCardProps = Omit<React.ComponentProps<"div">, "title"> & {
  number?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  art?: React.ReactNode;
  width?: FeatureCardWidth;
};

const SPAN: Record<FeatureCardWidth, string> = {
  narrow: "col-span-2",
  half: "col-span-3",
  full: "col-span-4",
};

function FeatureCard({
  number,
  eyebrow,
  title,
  description,
  art,
  width = "narrow",
  className,
  ...props
}: FeatureCardProps) {
  return (
    <div
      data-slot="feature-card"
      className={cn(
        "flex flex-col gap-3.5 bg-[linear-gradient(180deg,var(--indox-card-grad-top),var(--indox-card-grad-bot))] p-7 transition-colors hover:bg-[linear-gradient(180deg,#111216,#0c0d10)]",
        SPAN[width],
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        {number && (
          <span className="font-mono text-[10.5px] tracking-[0.06em] text-ink-3">{number}</span>
        )}
        {eyebrow && (
          <span className="font-mono text-[10.5px] tracking-[0.06em] text-ink-3 uppercase">
            {eyebrow}
          </span>
        )}
      </div>
      <h3 className="mb-1 text-[19px] font-medium tracking-[-0.015em] text-ink">{title}</h3>
      {description && (
        <p className="max-w-[460px] text-[14px] leading-[1.6] text-ink-2">{description}</p>
      )}
      {art && <div className="mt-auto">{art}</div>}
    </div>
  );
}

export { FeatureCard };
export type { FeatureCardProps, FeatureCardWidth };
