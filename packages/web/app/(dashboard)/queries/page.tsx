export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { PageHead } from "@indox/ui";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { getRecentQueries, getActivityData, getDashboardStats } from "@/lib/dashboard-data";
import { requireWorkspace } from "@/lib/session";
import { ActivityChartSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";

export default async function QueriesPage() {
  const { workspace } = await requireWorkspace();

  return (
    <div>
      <Suspense fallback={<PageHead title="Query log" subtitle="loading…" />}>
        <QueriesHeader workspaceId={workspace.id} />
      </Suspense>

      <Suspense fallback={<ActivityChartSkeleton />}>
        <Activity />
      </Suspense>

      <Suspense fallback={<TableSkeleton rows={5} cols={3} />}>
        <RecentQueries />
      </Suspense>
    </div>
  );
}

async function QueriesHeader({ workspaceId }: { workspaceId: string }) {
  const [queries, stats] = await Promise.all([getRecentQueries(), getDashboardStats(workspaceId)]);
  const subtitle = `${stats.queriesToday.toLocaleString()} queries today · ${queries.length} cached`;
  return <PageHead title="Query log" subtitle={subtitle} />;
}

async function Activity() {
  const activity = await getActivityData();
  return <ActivityChart bars={activity.bars} xLabels={activity.xLabels} />;
}

async function RecentQueries() {
  const queries = await getRecentQueries();
  return (
    <div className="border border-border">
      <div className="flex items-center justify-between border-b border-border bg-surface px-[18px] py-[13px]">
        <span className="text-[13px] font-medium">Cached queries</span>
        <span className="font-mono text-[11px] text-ink-3">{queries.length} shown</span>
      </div>
      {queries.length === 0 ? (
        <div className="px-[18px] py-12 text-center font-mono text-[12px] text-ink-3">
          no cached queries yet — answers are cached after the first response
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-ink-3">
                query
              </th>
              <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-ink-3">
                profile
              </th>
              <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-ink-3">
                cached
              </th>
            </tr>
          </thead>
          <tbody>
            {queries.map((q, i) => (
              <tr
                key={i}
                className="border-b border-border last:border-b-0 transition-colors hover:bg-surface/60"
              >
                <td className="max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap px-[18px] py-[11px] font-mono text-[12.5px] text-foreground">
                  {q.q}
                </td>
                <td className="px-[18px] py-[11px] font-mono text-[12px] text-ink-2">
                  {q.sources}
                </td>
                <td className="px-[18px] py-[11px] font-mono text-[12px] text-ink-3">{q.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
