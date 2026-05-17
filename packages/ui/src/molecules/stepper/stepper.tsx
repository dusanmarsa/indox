import * as React from "react";
import { cn } from "../../cn";

type Step = {
  label: React.ReactNode;
  description?: React.ReactNode;
};

type StepperProps = React.ComponentProps<"ol"> & {
  steps: Step[];
  current: number;
  orientation?: "horizontal" | "vertical";
};

function Stepper({
  steps,
  current,
  orientation = "horizontal",
  className,
  ...props
}: StepperProps) {
  return (
    <ol
      data-slot="stepper"
      data-orientation={orientation}
      className={cn(
        orientation === "horizontal" ? "flex w-full items-start gap-3" : "flex flex-col gap-3",
        className
      )}
      {...props}
    >
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <li
            key={i}
            data-state={state}
            className={cn("flex flex-1 items-start gap-3", orientation === "vertical" && "w-full")}
          >
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]",
                state === "done" && "border-brand bg-brand text-white",
                state === "active" && "border-brand text-brand",
                state === "upcoming" && "border-border text-ink-3"
              )}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span
                className={cn(
                  "text-[13px] font-medium",
                  state === "active" ? "text-ink" : state === "done" ? "text-ink-2" : "text-ink-3"
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="font-mono text-[11px] text-ink-3">{step.description}</span>
              )}
              {orientation === "horizontal" && i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn("mt-1.5 h-px w-full", i < current ? "bg-brand" : "bg-border")}
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { Stepper };
export type { StepperProps, Step };
