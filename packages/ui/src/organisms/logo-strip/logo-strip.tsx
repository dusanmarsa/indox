import * as React from "react";
import { cn } from "../../cn";

type LogoStripProps = React.ComponentProps<"div"> & {
  label?: React.ReactNode;
  logos: React.ReactNode[];
};

function LogoStrip({ label, logos, className, ...props }: LogoStripProps) {
  return (
    <div
      data-slot="logo-strip"
      className={cn("border-y border-border py-[60px]", className)}
      {...props}
    >
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-8 px-8">
        {label && (
          <span className="shrink-0 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase">
            {label}
          </span>
        )}
        <div className="flex flex-1 flex-wrap items-center justify-center gap-12">
          {logos.map((l, i) => (
            <span
              key={i}
              className="font-mono text-[14px] tracking-[-0.01em] text-ink-2 opacity-65 transition-opacity hover:text-ink hover:opacity-100"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export { LogoStrip };
export type { LogoStripProps };
