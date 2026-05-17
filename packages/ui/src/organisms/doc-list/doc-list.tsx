import * as React from "react";
import { cn } from "../../cn";

type DocListProps = Omit<React.ComponentProps<"section">, "title"> & {
  title?: React.ReactNode;
  count?: React.ReactNode;
  action?: React.ReactNode;
};

function DocList({ title, count, action, className, children, ...props }: DocListProps) {
  return (
    <section data-slot="doc-list" className={cn("flex flex-col gap-3", className)} {...props}>
      {(title || action) && (
        <header className="flex items-center justify-between pb-2">
          <h3 className="flex items-center gap-2 font-mono text-[13px] text-ink">
            {title}
            {count !== undefined && (
              <span className="font-mono text-[11px] text-ink-3">{count}</span>
            )}
          </h3>
          {action}
        </header>
      )}
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

export { DocList };
export type { DocListProps };
