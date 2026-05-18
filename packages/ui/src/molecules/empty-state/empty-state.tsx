import * as React from "react";
import { cn } from "../../cn";

type EmptyStateProps = Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-border px-6 py-14 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-3 text-ink-3" aria-hidden>
          {icon}
        </div>
      )}
      <h3 className="mb-1.5 text-[15px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-[13px] leading-[1.55] text-ink-2">{description}</p>
      )}
      {action}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
