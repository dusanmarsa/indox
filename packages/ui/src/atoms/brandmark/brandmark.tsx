import * as React from "react";
import { cn } from "../../cn";

type BrandmarkSize = "sm" | "md" | "lg";

type BrandmarkProps = React.ComponentProps<"span"> & {
  size?: BrandmarkSize;
  muted?: boolean;
};

const SIZES: Record<BrandmarkSize, { dot: number; text: string }> = {
  sm: { dot: 4, text: "text-[12px]" },
  md: { dot: 6, text: "text-[13px]" },
  lg: { dot: 8, text: "text-[14px]" },
};

function Brandmark({ size = "lg", muted = false, className, ...props }: BrandmarkProps) {
  const s = SIZES[size];
  return (
    <span
      data-slot="brandmark"
      className={cn(
        "inline-flex items-center gap-[9px] font-mono font-medium",
        muted && "opacity-50",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        style={{ width: s.dot, height: s.dot }}
        className={cn(
          "rounded-full",
          muted ? "bg-ink-3" : "bg-brand shadow-[0_0_10px_var(--indox-accent)]"
        )}
      />
      <span className={cn(s.text, muted ? "text-ink-3" : "text-ink")}>
        indox
        {!muted && <span className="text-brand">.</span>}
      </span>
    </span>
  );
}

export { Brandmark };
export type { BrandmarkSize, BrandmarkProps };
