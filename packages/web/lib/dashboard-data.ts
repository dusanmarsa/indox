import { prisma } from "@indox/core";

function timeAgo(date: Date | null): string {
  if (!date) return "never";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sourceStatus(indexStatus: string | null): "ok" | "warn" | "idle" {
  if (indexStatus === "ready") return "ok";
  if (indexStatus === "failed") return "warn";
  return "idle";
}

function estimateSize(chunkCount: number | null): string {
  if (!chunkCount) return "—";
  // rough estimate: ~512 bytes per chunk
  const bytes = chunkCount * 512;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function getDashboardStats(ownerKey: string) {
  // UsageLog is still IP-keyed and global; everything else scopes by owner.
  const ownerSourceWhere = { adapter: { ownerKey } };
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    sourceCount,
    sourceCountWeekAgo,
    chunkSum,
    chunkSumWeekAgo,
    todayUsage,
    yesterdayUsage,
    adapterCount,
  ] = await Promise.all([
    prisma.source.count({ where: { indexStatus: "ready", ...ownerSourceWhere } }),
    prisma.source.count({ where: { indexStatus: "ready", indexedAt: { lt: weekAgo }, ...ownerSourceWhere } }),
    prisma.source.aggregate({
      where: { indexStatus: "ready", ...ownerSourceWhere },
      _sum: { chunkCount: true },
    }),
    prisma.source.aggregate({
      where: { indexStatus: "ready", indexedAt: { lt: weekAgo }, ...ownerSourceWhere },
      _sum: { chunkCount: true },
    }),
    prisma.usageLog.aggregate({
      where: { date: { gte: todayStart } },
      _sum: { queryCount: true },
    }),
    prisma.usageLog.aggregate({
      where: { date: { gte: yesterdayStart, lt: todayStart } },
      _sum: { queryCount: true },
    }),
    prisma.adapter.count({ where: { ownerKey } }),
  ]);

  const totalChunks = chunkSum._sum.chunkCount ?? 0;
  const prevChunks = chunkSumWeekAgo._sum.chunkCount ?? 0;
  const chunkDelta = totalChunks - prevChunks;

  const queriesToday = todayUsage._sum.queryCount ?? 0;
  const queriesYesterday = yesterdayUsage._sum.queryCount ?? 0;
  const queryPct = queriesYesterday > 0
    ? Math.round(((queriesToday - queriesYesterday) / queriesYesterday) * 100)
    : null;

  const newSources = sourceCount - sourceCountWeekAgo;

  return {
    adapterCount,
    repoCount: sourceCount,
    repoCountDelta: newSources > 0 ? `+${newSources} this week` : "no change this week",
    repoCountUp: newSources > 0,
    totalChunks,
    chunkDelta: chunkDelta > 0 ? `↑ ${chunkDelta.toLocaleString()} since last week` : "no new chunks",
    chunkDeltaUp: chunkDelta > 0,
    queriesToday,
    queryDelta:
      queryPct !== null
        ? `${queryPct >= 0 ? "↑" : "↓"} ${Math.abs(queryPct)}% vs yesterday`
        : "no data yesterday",
    queryDeltaUp: queryPct !== null ? queryPct >= 0 : null,
  };
}

export type DashboardSource = {
  id: string;
  adapterId: string;
  path: string;
  type: string;
  chunks: number;
  size: string;
  sync: string;
  status: "ok" | "warn" | "idle";
  displayName: string;
};

export async function getDashboardSources(ownerKey: string, limit?: number): Promise<DashboardSource[]> {
  const sources = await prisma.source.findMany({
    where: { adapter: { ownerKey } },
    orderBy: [{ indexStatus: "asc" }, { indexedAt: "desc" }],
    ...(limit ? { take: limit } : {}),
    include: { adapter: true },
  });

  return sources.map((s) => ({
    id: s.id,
    adapterId: s.adapterId,
    path: s.displayName,
    type: s.kind,
    chunks: s.chunkCount ?? 0,
    size: estimateSize(s.chunkCount),
    sync: timeAgo(s.indexedAt),
    status: sourceStatus(s.indexStatus),
    displayName: s.displayName,
  }));
}

export type SourceFile = { path: string; chunks: number };

// Pulls distinct file paths for a source from its embeddings. Uses chunk_url
// (a SHA-pinned blob link with #L1-L10 fragment) and strips it back to a
// repo-relative path. GitHub-only today; other adapters can override.
export async function getSourceFiles(sourceId: string, ownerKey: string): Promise<SourceFile[]> {
  const ok = await prisma.source.findFirst({
    where: { id: sourceId, adapter: { ownerKey } },
    select: { id: true },
  });
  if (!ok) return [];
  const rows = await prisma.$queryRaw<Array<{ path: string; chunks: bigint }>>`
    SELECT
      regexp_replace(split_part(chunk_url, '#', 1), '^https?://github\.com/[^/]+/[^/]+/blob/[^/]+/', '') AS path,
      COUNT(*) AS chunks
    FROM embeddings
    WHERE source_id = ${sourceId}
      AND chunk_url IS NOT NULL
    GROUP BY path
    ORDER BY path ASC
  `;
  return rows.map((r) => ({ path: r.path, chunks: Number(r.chunks) }));
}

export type DashboardAdapter = {
  id: string;
  kind: string;
  authIdentity: string | null;
  scope: unknown;
  syncStatus: string | null;
  syncError: string | null;
  lastSyncedAt: string;
  sourceCount: number;
  readyCount: number;
};

export async function getDashboardAdapters(ownerKey: string): Promise<DashboardAdapter[]> {
  const adapters = await prisma.adapter.findMany({
    where: { ownerKey },
    orderBy: { createdAt: "asc" },
    include: { sources: { select: { indexStatus: true } } },
  });
  return adapters.map((a) => ({
    id: a.id,
    kind: a.kind,
    authIdentity: a.authIdentity,
    scope: a.scope,
    syncStatus: a.syncStatus,
    syncError: a.syncError,
    lastSyncedAt: timeAgo(a.lastSyncedAt),
    sourceCount: a.sources.length,
    readyCount: a.sources.filter((s) => s.indexStatus === "ready").length,
  }));
}

export type DashboardQuery = {
  q: string;
  sources: string;
  time: string;
};

// Recent queries used to come from cachedAnswer rows — that table is gone now.
// Returns empty until we add a query log; the dashboard widget hides gracefully.
export async function getRecentQueries(): Promise<DashboardQuery[]> {
  return [];
}

export async function getActivityData(): Promise<{ bars: number[]; xLabels: string[] }> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const usageLogs = await prisma.usageLog.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    select: { date: true, queryCount: true },
  });

  const counts = new Array(30).fill(0);

  for (const { date, queryCount } of usageLogs) {
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    const idx = 29 - daysAgo;
    if (idx >= 0 && idx < 30) counts[idx] += queryCount;
  }

  const max = Math.max(...counts, 1);
  const bars = counts.map((c) => c / max);

  const now = new Date();
  const xLabels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 5);
    xLabels.push(
      i === 0
        ? "today"
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
  }

  return { bars, xLabels };
}
