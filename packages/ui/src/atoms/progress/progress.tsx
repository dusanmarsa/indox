import * as React from "react";
import { Progress as Primitive } from "radix-ui";
import { cn } from "../../cn";

type ProgressTone = "accent" | "ok" | "warn" | "bad";

const TONE: Record<ProgressTone, string> = {
  accent: "bg-brand",
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
};

type ProgressProps = React.ComponentProps<typeof Primitive.Root> & {
  tone?: ProgressTone;
  indeterminate?: boolean;
};

function Progress({
  className,
  value,
  tone = "accent",
  indeterminate = false,
  ...props
}: ProgressProps) {
  return (
    <Primitive.Root
      data-slot="progress"
      data-indeterminate={indeterminate}
      value={indeterminate ? null : value}
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
      {...props}
    >
      <Primitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full transition-transform duration-300",
          TONE[tone],
          indeterminate && "absolute w-1/3 animate-[indox-bar_1.4s_ease-in-out_infinite]"
        )}
        style={indeterminate ? undefined : { transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
      <style>{`@keyframes indox-bar{0%{transform:translateX(-100%)}50%{transform:translateX(150%)}100%{transform:translateX(300%)}}`}</style>
    </Primitive.Root>
  );
}

export { Progress };
export type { ProgressProps, ProgressTone };
