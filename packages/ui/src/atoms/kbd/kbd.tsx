import * as React from "react";
import { cn } from "../../cn";

type KbdProps = React.ComponentProps<"kbd">;

function Kbd({ className, ...props }: KbdProps) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex items-center rounded-xs border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-3",
        className
      )}
      {...props}
    />
  );
}

export { Kbd };
export type { KbdProps };
