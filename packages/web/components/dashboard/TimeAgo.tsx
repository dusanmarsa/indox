"use client";

import { useEffect, useMemo, useState } from "react";

// Re-renders on a coarse schedule so "5s ago" can tick to "6s ago" without a
// page refresh. Tick cadence widens as the value gets older - no point
// re-rendering every second to show "3d ago".
function formatAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function tickIntervalMs(date: Date): number {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 1_000;
  if (seconds < 3600) return 30_000;
  return 300_000;
}

export function TimeAgo({
  date,
  fallback = "never",
  className,
}: {
  date: Date | string | null;
  fallback?: string;
  className?: string;
}) {
  const time = date ? (date instanceof Date ? date.getTime() : new Date(date).getTime()) : null;
  const parsed = useMemo(() => (time === null ? null : new Date(time)), [time]);
  const [, force] = useState(0);

  useEffect(() => {
    if (!parsed) return;
    let cancelled = false;
    let id: ReturnType<typeof setTimeout> | null = null;
    function schedule() {
      if (cancelled || !parsed) return;
      id = setTimeout(() => {
        if (cancelled) return;
        force((n) => n + 1);
        schedule();
      }, tickIntervalMs(parsed));
    }
    schedule();
    return () => {
      cancelled = true;
      if (id) clearTimeout(id);
    };
  }, [parsed]);

  if (!parsed) return <span className={className}>{fallback}</span>;
  return (
    <span className={className} suppressHydrationWarning>
      {formatAgo(parsed)}
    </span>
  );
}
