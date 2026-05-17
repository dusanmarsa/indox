import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "../../cn";

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root>;

function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border p-0.5",
        "border-border-strong bg-surface-3",
        "transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-soft",
        "data-[state=checked]:border-brand data-[state=checked]:bg-brand",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-3.5 rounded-full bg-ink-3",
          "transition-transform data-[state=checked]:translate-x-4 data-[state=checked]:bg-white"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
export type { SwitchProps };
