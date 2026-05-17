import * as React from "react";
import { cn } from "../../cn";

type StageShellProps = Omit<React.ComponentProps<"div">, "title"> & {
  title?: React.ReactNode;
  status?: React.ReactNode;
  sidebar?: React.ReactNode;
  corners?: boolean;
};

function StageShell({
  title = "indox · system view",
  status,
  sidebar,
  corners = true,
  className,
  children,
  ...props
}: StageShellProps) {
  return (
    <div
      data-slot="stage-shell"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(180deg,var(--indox-card-grad-top),var(--indox-card-grad-bot))]",
        className
      )}
      {...props}
    >
      {corners && (
        <>
          <span
            aria-hidden
            className="absolute -top-px -left-px size-6 border-t border-l border-brand opacity-40"
          />
          <span
            aria-hidden
            className="absolute -top-px -right-px size-6 border-t border-r border-brand opacity-40"
          />
          <span
            aria-hidden
            className="absolute -bottom-px -left-px size-6 border-b border-l border-brand opacity-40"
          />
          <span
            aria-hidden
            className="absolute -right-px -bottom-px size-6 border-r border-b border-brand opacity-40"
          />
        </>
      )}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span aria-hidden className="size-2 rounded-full bg-ink-4" />
        <span aria-hidden className="size-2 rounded-full bg-ink-4" />
        <span aria-hidden className="size-2 rounded-full bg-ink-4" />
        <span className="ml-2.5 font-mono text-[11.5px] text-ink-2">{title}</span>
        {status && (
          <span className="ml-auto flex items-center gap-2 font-mono text-[11px] text-ink-3">
            {status}
          </span>
        )}
      </div>
      <div className={cn("grid min-h-[520px]", sidebar ? "grid-cols-[240px_1fr]" : "grid-cols-1")}>
        {sidebar && (
          <aside className="border-r border-border bg-white/[0.012] px-4 py-[18px]">
            {sidebar}
          </aside>
        )}
        <main className="flex flex-col">{children}</main>
      </div>
    </div>
  );
}

export { StageShell };
export type { StageShellProps };
