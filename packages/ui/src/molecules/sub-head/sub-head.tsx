import * as React from "react";
import { cn } from "../../cn";

type SubHeadProps = React.ComponentProps<"div"> & {
  desc?: React.ReactNode;
};

function SubHead({ desc, className, children, ...props }: SubHeadProps) {
  return (
    <div
      data-slot="sub-head"
      className={cn(
        "mb-4 flex items-baseline justify-between border-b border-dashed border-border pb-2 text-[15px] font-medium tracking-[-0.01em] text-ink",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {desc && <span className="font-mono text-[11px] text-ink-3">{desc}</span>}
    </div>
  );
}

export { SubHead };
export type { SubHeadProps };
