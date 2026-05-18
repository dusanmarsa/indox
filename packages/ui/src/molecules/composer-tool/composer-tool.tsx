import * as React from "react";
import { cn } from "../../cn";

type ComposerToolProps = React.ComponentProps<"button"> & {
  active?: boolean;
  showDot?: boolean;
  icon?: React.ReactNode;
};

function ComposerTool({
  active = false,
  showDot = false,
  icon,
  className,
  children,
  ...props
}: ComposerToolProps) {
  return (
    <button
      type="button"
      data-slot="composer-tool"
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex cursor-pointer items-center gap-[5px] rounded-[5px] px-2.5 py-[5px] font-mono text-[11.5px] transition-colors",
        active ? "bg-surface-2 text-ink" : "text-ink-3 hover:bg-surface-2 hover:text-ink",
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          aria-hidden
          className={cn("size-[5px] rounded-full", active ? "bg-ok" : "bg-ink-3")}
        />
      )}
      {icon}
      {children}
    </button>
  );
}

export { ComposerTool };
export type { ComposerToolProps };
