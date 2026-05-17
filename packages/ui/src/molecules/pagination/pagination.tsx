import * as React from "react";
import { cn } from "../../cn";

type PaginationProps = React.ComponentProps<"nav"> & {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
};

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function getPages(page: number, total: number, siblings: number) {
  const first = 1;
  const last = total;
  const left = Math.max(page - siblings, first);
  const right = Math.min(page + siblings, last);
  const items: (number | "…")[] = [];
  if (left > first + 1) items.push(first, "…");
  else items.push(...range(first, left - 1));
  items.push(...range(left, right));
  if (right < last - 1) items.push("…", last);
  else items.push(...range(right + 1, last));
  return items.filter((v, i, a) => a.indexOf(v) === i);
}

function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  className,
  ...props
}: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = getPages(page, pageCount, siblingCount);
  const cell =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-sm px-2 font-mono text-[12px] text-ink-2 transition-colors";

  return (
    <nav
      data-slot="pagination"
      aria-label="Pagination"
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      <button
        type="button"
        aria-label="Previous"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={cn(cell, "hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40")}
      >
        ←
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className={cn(cell, "pointer-events-none text-ink-3")}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              cell,
              p === page ? "bg-surface-2 text-ink" : "hover:bg-surface-2 hover:text-ink"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        aria-label="Next"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className={cn(cell, "hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40")}
      >
        →
      </button>
    </nav>
  );
}

export { Pagination };
export type { PaginationProps };
