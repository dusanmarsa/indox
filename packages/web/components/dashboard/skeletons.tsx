import { Skeleton } from "@indox/ui";

// Shared by loading.tsx (full-page fallback) and inline <Suspense> islands —
// keep visually close to the real components so the swap-in doesn't pop.

export function PageHeadSkeleton() {
  return (
    <div className="mb-9 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <Skeleton className="mb-2 h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
    </div>
  );
}

export function DashboardHeroSkeleton() {
  return (
    <section className="grid items-end gap-8 pt-4 pb-10 sm:gap-12 sm:pt-8 sm:pb-15 md:grid-cols-[1fr_auto]">
      <div>
        <Skeleton className="mb-[18px] h-3 w-44" />
        <Skeleton className="mb-[18px] h-12 w-[min(80%,520px)] sm:h-16" />
        <Skeleton className="h-4 w-[min(90%,540px)]" />
        <Skeleton className="mt-2 h-4 w-[min(70%,420px)]" />
      </div>
      <div className="flex flex-wrap gap-6 sm:gap-9">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function FilterBarSkeleton() {
  return (
    <section className="flex flex-wrap items-center gap-3.5 border-t border-border py-5">
      <Skeleton className="h-9 min-w-[280px] flex-1 rounded-full" />
      <Skeleton className="h-9 w-44 rounded-full" />
      <Skeleton className="h-9 w-32 rounded-full" />
      <Skeleton className="h-9 w-16 rounded-full" />
      <Skeleton className="h-9 w-28 rounded-full" />
    </section>
  );
}

export function SourceCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section>
      <div className="mt-10 mb-5 flex items-baseline justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-md border border-border bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="mt-2 flex justify-between gap-3 border-t border-border pt-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 5,
  withHeader = true,
}: {
  rows?: number;
  cols?: number;
  withHeader?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      {withHeader && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      )}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className="h-4 flex-1"
                style={{ maxWidth: `${[120, 200, 80, 100, 60][c % 5]}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StackedFormSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-md border border-border bg-surface p-5">
          <Skeleton className="mb-3 h-4 w-32" />
          <Skeleton className="mb-2 h-3 w-72" />
          <Skeleton className="mt-4 h-9 w-full max-w-md rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function ActivityChartSkeleton() {
  return (
    <div className="mb-8 rounded-md border border-border bg-surface p-5">
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="flex h-32 items-end gap-1">
        {Array.from({ length: 30 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${20 + ((i * 37) % 80)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function AdapterDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-surface p-5">
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}
