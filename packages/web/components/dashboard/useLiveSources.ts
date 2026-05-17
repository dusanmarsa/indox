"use client";

import { useEffect, useState } from "react";
import type { DashboardSource } from "@/lib/dashboard-data";

type Options = {
  limit?: number;
  fastIntervalMs?: number;
  slowIntervalMs?: number;
};

// Poll faster while any source is mid-index; back off once everything settles.
// Pauses entirely when the tab is hidden to avoid burning quota in background.
export function useLiveSources(
  initial: DashboardSource[],
  { limit, fastIntervalMs = 3_000, slowIntervalMs = 30_000 }: Options = {}
): DashboardSource[] {
  const [sources, setSources] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let latest: DashboardSource[] = initial;

    async function tick() {
      if (cancelled) return;
      if (document.visibilityState === "hidden") {
        timeoutId = setTimeout(tick, slowIntervalMs);
        return;
      }
      try {
        const url = limit ? `/api/dashboard/sources?limit=${limit}` : "/api/dashboard/sources";
        const res = await fetch(url, { cache: "no-store" });
        if (!cancelled && res.ok) {
          const data = (await res.json()) as { sources: DashboardSource[] };
          latest = data.sources.map((s) => ({
            ...s,
            indexedAt: s.indexedAt ? new Date(s.indexedAt) : null,
          }));
          setSources(latest);
        }
      } catch {
        /* retry on next tick */
      }
      if (cancelled) return;
      const anyIndexing = latest.some((s) => s.status === "indexing");
      timeoutId = setTimeout(tick, anyIndexing ? fastIntervalMs : slowIntervalMs);
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        if (timeoutId) clearTimeout(timeoutId);
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const anyIndexing = initial.some((s) => s.status === "indexing");
    timeoutId = setTimeout(tick, anyIndexing ? fastIntervalMs : slowIntervalMs);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [limit, fastIntervalMs, slowIntervalMs, initial]);

  return sources;
}
