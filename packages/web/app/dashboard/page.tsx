export const dynamic = "force-dynamic";

import Link from "next/link";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import {
  getDashboardStats,
  getDashboardSources,
  getRecentQueries,
  getActivityData,
} from "@/lib/dashboard-data";
import { requireWorkspace } from "@/lib/session";

function StatusBadge({ status }: { status: "ok" | "warn" | "idle" }) {
  const map = {
    ok:   { text: "text-(--indox-ok)",        bg: "bg-(--indox-ok)/10",          dot: "bg-(--indox-ok)" },
    warn: { text: "text-[#8a6a1e]",           bg: "bg-[#fdf8ec] dark:bg-[#8a6a1e]/20", dot: "bg-[#8a6a1e]" },
    idle: { text: "text-(--indox-dim)",        bg: "bg-(--indox-surface)",        dot: "bg-(--indox-dim)" },
  };
  const s = map[status] ?? map.idle;
  return (
    <span className={`inline-flex items-center gap-[5px] px-[7px] py-[2px] font-mono text-[10.5px] ${s.text} ${s.bg}`}>
      <span className={`h-[5px] w-[5px] shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
}

export default async function DashboardOverview() {
  const { workspace } = await requireWorkspace();
  const [stats, sources, queries, activity] = await Promise.all([
    getDashboardStats(workspace.id),
    getDashboardSources(workspace.id, 5),
    getRecentQueries(),
    getActivityData(),
  ]);

  const STATS = [
    {
      label: "repositories indexed",
      value: stats.repoCount.toString(),
      delta: stats.repoCountDelta,
      up: stats.repoCountUp as boolean | null,
    },
    {
      label: "total chunks",
      value: stats.totalChunks >= 1000
        ? `${(stats.totalChunks / 1000).toFixed(1)}k`
        : stats.totalChunks.toString(),
      delta: stats.chunkDelta,
      up: stats.chunkDeltaUp as boolean | null,
    },
    {
      label: "queries today",
      value: stats.queriesToday.toLocaleString(),
      delta: stats.queryDelta,
      up: stats.queryDeltaUp,
    },
    {
      label: "indexed sources",
      value: sources.filter((s) => s.status === "ok").length.toString(),
      delta: sources.filter((s) => s.status === "warn").length > 0
        ? `${sources.filter((s) => s.status === "warn").length} need attention`
        : "all healthy",
      up: sources.filter((s) => s.status === "warn").length === 0 ? true : null,
    },
  ] as const;

  const syncedCount = sources.filter((s) => s.status === "ok").length;

  return (
    <div>
      {/* Page header */}
      <div className="mb-9 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Overview</h1>
          <p className="font-mono text-[13px] text-(--indox-muted)">
            indox · {sources.length} sources · {syncedCount} synced
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="border border-(--indox-border) bg-transparent px-3.5 py-[7px] font-mono text-[12px] text-(--indox-muted) transition-colors hover:border-(--indox-muted) hover:text-foreground">
            refresh
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-9 grid grid-cols-4 border border-(--indox-border)">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`px-6 py-[22px] ${i < STATS.length - 1 ? "border-r border-(--indox-border)" : ""}`}
          >
            <p className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-(--indox-dim)">
              {s.label}
            </p>
            <p className="mb-1.5 font-mono text-[26px] font-semibold leading-none tracking-[-0.02em] text-foreground">
              {s.value}
            </p>
            <p className={`flex items-center gap-1 font-mono text-[11px] ${s.up === true ? "text-(--indox-ok)" : s.up === false ? "text-(--indox-accent)" : "text-(--indox-dim)"}`}>
              {s.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column: sources + recent queries */}
      <div className="mb-9 grid grid-cols-[1.4fr_1fr] gap-8">
        {/* Sources panel */}
        <div className="border border-(--indox-border)">
          <div className="flex items-center justify-between border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[13px]">
            <span className="text-[13px] font-medium">Connected sources</span>
            <Link
              href="/dashboard/sources"
              className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-foreground"
            >
              view all →
            </Link>
          </div>
          {sources.length === 0 ? (
            <div className="px-[18px] py-8 text-center font-mono text-[12px] text-(--indox-dim)">
              no repositories indexed yet
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-(--indox-border)">
                  <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim)">source</th>
                  <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim)">type</th>
                  <th className="px-[18px] py-[9px] text-right font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim)">chunks</th>
                  <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim)">status</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id} className="border-b border-(--indox-border) last:border-b-0 transition-colors hover:bg-(--indox-surface)/60">
                    <td className="px-[18px] py-[11px] font-mono text-[12.5px] text-foreground">{s.path}</td>
                    <td className="px-[18px] py-[11px]">
                      <span className="border border-(--indox-border) px-1.5 py-px font-mono text-[10.5px] text-(--indox-dim)">
                        {s.type}
                      </span>
                    </td>
                    <td className="px-[18px] py-[11px] text-right font-mono text-[12px] text-(--indox-muted)">
                      {s.chunks.toLocaleString()}
                    </td>
                    <td className="px-[18px] py-[11px]">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent queries panel */}
        <div className="border border-(--indox-border)">
          <div className="flex items-center justify-between border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[13px]">
            <span className="text-[13px] font-medium">Recent queries</span>
            <Link
              href="/dashboard/queries"
              className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-foreground"
            >
              view all →
            </Link>
          </div>
          {queries.length === 0 ? (
            <div className="px-[18px] py-8 text-center font-mono text-[12px] text-(--indox-dim)">
              no queries cached yet
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-(--indox-border)">
                  <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim)">query</th>
                  <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim)">source</th>
                  <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim)">time</th>
                </tr>
              </thead>
              <tbody>
                {queries.map((q, i) => (
                  <tr key={i} className="border-b border-(--indox-border) last:border-b-0 transition-colors hover:bg-(--indox-surface)/60">
                    <td className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap px-[18px] py-[11px] font-mono text-[12.5px] text-foreground">
                      {q.q}
                    </td>
                    <td className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap px-[18px] py-[11px] font-mono text-[11px] text-(--indox-muted)">
                      {q.sources}
                    </td>
                    <td className="px-[18px] py-[11px] font-mono text-[11px] text-(--indox-dim)">
                      {q.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ActivityChart bars={activity.bars} xLabels={activity.xLabels} />
    </div>
  );
}
