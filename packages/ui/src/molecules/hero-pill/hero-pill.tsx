import * as React from "react";
import { cn } from "../../cn";

type HeroPillProps = React.ComponentProps<"a"> & {
  /** Optional accent badge (e.g. "New") to the left of the label. */
  tag?: React.ReactNode;
};

/**
 * The "v0.X.0 — new feature" announcement pill above a landing hero. Renders
 * as `<a>` when `href` is set, otherwise as `<span>` styled identically.
 */
function HeroPill({ tag, href, className, children, ...props }: HeroPillProps) {
  const cls = cn(
    "inline-flex items-center gap-2.5 rounded-full border border-overlay-3 bg-overlay-tint py-[5px] pr-3.5 pl-1.5 font-mono text-[11.5px] transition-colors hover:bg-overlay-1",
    className
  );
  const inner = (
    <>
      {tag && (
        <span className="rounded-full bg-brand px-[9px] py-[3px] text-[10px] font-medium tracking-[0.06em] text-white uppercase">
          {tag}
        </span>
      )}
      <span className="text-ink-2">{children}</span>
      <span aria-hidden className="text-ink-3">
        →
      </span>
    </>
  );

  if (href) {
    return (
      <a data-slot="hero-pill" href={href} className={cls} {...props}>
        {inner}
      </a>
    );
  }
  return (
    <span
      data-slot="hero-pill"
      className={cls}
      {...(props as unknown as React.ComponentProps<"span">)}
    >
      {inner}
    </span>
  );
}

export { HeroPill };
export type { HeroPillProps };
