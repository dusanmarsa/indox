import * as React from "react";
import { cn } from "../../cn";

type SegmentedOption<T extends string = string> = {
  value: T;
  label: React.ReactNode;
};

type SegmentedControlProps<T extends string = string> = Omit<
  React.ComponentProps<"div">,
  "onChange"
> & {
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
};

function SegmentedControl<T extends string = string>({
  options,
  value,
  onValueChange,
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      data-slot="segmented-control"
      className={cn(
        "inline-flex overflow-hidden rounded-md border border-border bg-surface",
        className
      )}
      {...props}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-state={active ? "active" : "inactive"}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "px-4 py-2 font-mono text-[12px] transition-colors",
              "text-ink-3 hover:bg-surface-2 hover:text-ink",
              "data-[state=active]:bg-surface-2 data-[state=active]:text-ink",
              i < options.length - 1 && "border-r border-border"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl };
export type { SegmentedControlProps, SegmentedOption };
