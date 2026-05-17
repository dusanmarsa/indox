import * as React from "react";
import { cn } from "../../cn";

type DocRowProps = Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tag?: React.ReactNode;
  chunks?: React.ReactNode;
  when?: React.ReactNode;
  menu?: React.ReactNode;
};

function DocRow({
  icon,
  title,
  subtitle,
  tag,
  chunks,
  when,
  menu,
  className,
  ...props
}: DocRowProps) {
  return (
    <div
      data-slot="doc-row"
      className={cn(
        "grid cursor-pointer items-center gap-[18px] rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-2",
        "grid-cols-[32px_1fr_auto_auto_auto_auto]",
        className
      )}
      {...props}
    >
      <span className="flex h-8 w-7 items-center justify-center rounded-xs bg-surface-3 font-mono text-[9px] tracking-[0.06em] text-ink-2">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] tracking-[-0.005em] text-ink">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block truncate font-mono text-[10.5px] text-ink-3">
            {subtitle}
          </span>
        )}
      </span>
      {tag}
      {chunks && <span className="font-mono text-[11.5px] text-ink-2">{chunks}</span>}
      {when && <span className="font-mono text-[11px] text-ink-3">{when}</span>}
      {menu}
    </div>
  );
}

export { DocRow };
export type { DocRowProps };
