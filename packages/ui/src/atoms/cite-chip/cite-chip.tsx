import * as React from "react";
import { cn } from "../../cn";

type CiteChipProps = React.ComponentProps<"button"> & {
  index: number | string;
  active?: boolean;
};

function CiteChip({ index, active = false, className, children, ...props }: CiteChipProps) {
  return (
    <button
      type="button"
      data-slot="cite-chip"
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex cursor-pointer items-center gap-[7px] rounded-sm border px-2.5 py-1 font-mono text-[11px] transition-colors",
        active
          ? "border-brand bg-brand-soft text-brand"
          : "border-border bg-surface-2 text-ink-2 hover:border-border-strong hover:bg-surface-3 hover:text-ink",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "rounded-xs px-1 font-mono text-[9.5px]",
          active ? "bg-brand text-white" : "bg-overlay-2"
        )}
      >
        {index}
      </span>
      {children}
    </button>
  );
}

export { CiteChip };
export type { CiteChipProps };
