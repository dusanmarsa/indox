import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "../../cn";

type RadioGroupProps = React.ComponentProps<typeof RadioGroupPrimitive.Root>;
type RadioGroupItemProps = React.ComponentProps<typeof RadioGroupPrimitive.Item>;

function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("flex flex-col gap-2.5", className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer inline-flex size-4 shrink-0 items-center justify-center rounded-full",
        "border border-border-strong bg-surface",
        "transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-soft",
        "data-[state=checked]:border-brand",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="size-[7px] rounded-full bg-brand" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
export type { RadioGroupProps, RadioGroupItemProps };
