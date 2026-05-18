import * as React from "react";
import { cn } from "../../cn";

type NavPillProps = React.ComponentProps<"a"> & {
  badge?: React.ReactNode;
  arrow?: boolean;
};

function NavPill({ badge, arrow = true, className, children, ...props }: NavPillProps) {
  return (
    <a
      data-slot="nav-pill"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-overlay-3 bg-overlay-tint py-[5px] pr-3.5 pl-1.5 font-mono text-[11.5px] text-ink-2 transition-colors hover:text-ink",
        className
      )}
      {...props}
    >
      {badge && (
        <span className="rounded-full bg-brand px-2 py-[3px] text-[10px] font-medium tracking-[0.06em] text-white uppercase">
          {badge}
        </span>
      )}
      <span>{children}</span>
      {arrow && (
        <span aria-hidden className="text-ink-3">
          →
        </span>
      )}
    </a>
  );
}

export { NavPill };
export type { NavPillProps };
