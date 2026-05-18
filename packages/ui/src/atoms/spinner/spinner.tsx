import * as React from "react";
import { cn } from "../../cn";

type SpinnerSize = "sm" | "md" | "lg";

type SpinnerProps = React.ComponentProps<"div"> & {
  size?: SpinnerSize;
  label?: React.ReactNode;
};

const SIZE: Record<SpinnerSize, string> = {
  sm: "size-3 border",
  md: "size-5 border-2",
  lg: "size-7 border-2",
};

function Spinner({ size = "md", label, className, ...props }: SpinnerProps) {
  return (
    <div
      data-slot="spinner"
      role="status"
      aria-label={typeof label === "string" ? label : "Loading"}
      className={cn("inline-flex items-center gap-2.5", className)}
      {...props}
    >
      <span className={cn("animate-spin rounded-full border-ink-4 border-t-ink", SIZE[size])} />
      {label && <span className="font-mono text-[12px] text-ink-3">{label}</span>}
    </div>
  );
}

export { Spinner };
export type { SpinnerProps, SpinnerSize };
