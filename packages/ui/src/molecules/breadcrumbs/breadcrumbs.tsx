import * as React from "react";
import { cn } from "../../cn";

type BreadcrumbItem = {
  label: React.ReactNode;
  href?: string;
};

type BreadcrumbsProps = React.ComponentProps<"nav"> & {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
};

function Breadcrumbs({ items, separator = "/", className, ...props }: BreadcrumbsProps) {
  return (
    <nav
      data-slot="breadcrumbs"
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1.5 font-mono text-[12.5px] text-ink-3", className)}
      {...props}
    >
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {it.href && !isLast ? (
              <a href={it.href} className="text-ink-2 transition-colors hover:text-ink">
                {it.label}
              </a>
            ) : (
              <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-ink" : ""}>
                {it.label}
              </span>
            )}
            {!isLast && (
              <span aria-hidden className="text-ink-3">
                {separator}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export { Breadcrumbs };
export type { BreadcrumbsProps, BreadcrumbItem };
