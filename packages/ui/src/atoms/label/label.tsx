import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "../../cn";

type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root>;

function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Label };
export type { LabelProps };
