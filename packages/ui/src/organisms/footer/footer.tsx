import * as React from "react";
import { cn } from "../../cn";

type FooterLink = { label: React.ReactNode; href: string };
type FooterColumn = { heading: React.ReactNode; links: FooterLink[] };

type FooterProps = React.ComponentProps<"footer"> & {
  brand?: React.ReactNode;
  tagline?: React.ReactNode;
  columns?: FooterColumn[];
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
};

function Footer({
  brand,
  tagline,
  columns = [],
  bottomLeft,
  bottomRight,
  className,
  ...props
}: FooterProps) {
  return (
    <footer
      data-slot="footer"
      className={cn("border-t border-border px-8 pt-15 pb-10", className)}
      {...props}
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-15 grid grid-cols-[2fr_1fr_1fr_1fr] gap-12">
          <div>
            <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[14px] text-ink">
              <span aria-hidden className="size-[7px] rounded-full bg-brand" />
              {brand ?? "indox"}
            </div>
            {tagline && (
              <p className="max-w-[280px] text-[13.5px] leading-[1.6] text-ink-2">{tagline}</p>
            )}
          </div>
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="mb-4 font-mono text-[10.5px] tracking-[0.1em] text-ink-3 uppercase">
                {col.heading}
              </h4>
              {col.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="mb-2.5 block font-mono text-[13px] text-ink-2 transition-colors hover:text-ink"
                >
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-7 font-mono text-[11.5px] text-ink-3">
          <div>{bottomLeft}</div>
          <div className="flex gap-[18px]">{bottomRight}</div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
export type { FooterProps, FooterLink, FooterColumn };
