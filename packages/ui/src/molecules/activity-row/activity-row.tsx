import * as React from "react";
import { cn } from "../../cn";

type ActivityRowProps = React.ComponentProps<"div"> & {
  fresh?: boolean;
  when?: React.ReactNode;
};

function ActivityRow({ fresh = false, when, className, children, ...props }: ActivityRowProps) {
  return (
    <div
      data-slot="activity-row"
      data-fresh={fresh}
      className={cn(
        "grid grid-cols-[24px_1fr_auto] items-start gap-3.5 border-b border-border py-2.5 last:border-b-0",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "mt-[7px] size-2 rounded-full",
          fresh ? "bg-brand shadow-[0_0_8px_var(--indox-accent)]" : "bg-ink-4"
        )}
      />
      <div className="text-[13.5px] leading-[1.55] text-ink">{children}</div>
      {when && (
        <span className="pt-1 font-mono text-[10.5px] whitespace-nowrap text-ink-3">{when}</span>
      )}
    </div>
  );
}

export { ActivityRow };
export type { ActivityRowProps };
