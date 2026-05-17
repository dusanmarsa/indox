import * as React from "react";
import { cn } from "../../cn";

type EyebrowProps = React.ComponentProps<"span"> & {
  /** Show the small accent rule before the text. Default `true`. */
  withRule?: boolean;
};

function Eyebrow({ withRule = true, className, children, ...props }: EyebrowProps) {
  return (
    <span
      data-slot="eyebrow"
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2",
        withRule &&
          "before:inline-block before:h-px before:w-[22px] before:bg-brand before:content-['']",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Eyebrow };
export type { EyebrowProps };
