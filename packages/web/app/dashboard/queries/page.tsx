export const dynamic = "force-dynamic";

import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { getRecentQueries, getActivityData, getDashboardStats } from "@/lib/dashboard-data";
import { requireWorkspace } from "@/lib/session";

export default async function QueriesPage() {
  const { workspace } = await requireWorkspace();
  const [queries, activity, stats] = await Promise.all([
    getRecentQueries(),
    getActivityData(),
    getDashboardStats(workspace.id),
  ]);

  const subtitle = `${stats.queriesToday.toLocaleString()} queries today · ${queries.length} cached`;

  return (
    <div>
      <div className="mb-9 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Query log</h1>
          <p className="font-mono text-[13px] text-(--indox-muted)">{subtitle}</p>
        </div>
      </div>

      <ActivityChart bars={activity.bars} xLabels={activity.xLabels} />

      <div className="border border-(--indox-border)">
        <div className="flex items-center justify-between border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[13px]">
          <span className="text-[13px] font-medium">Cached queries</span>
          <span className="font-mono text-[11px] text-(--indox-dim)">{queries.length} shown</span>
        </div>
        {queries.length === 0 ? (
          <div className="px-[18px] py-12 text-center font-mono text-[12px] text-(--indox-dim)">
            no cached queries yet — answers are cached after the first response
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-(--indox-border)">
                <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim)">query</th>
                <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim)">profile</th>
                <th className="px-[18px] py-[9px] text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim)">cached</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q, i) => (
                <tr
                  key={i}
                  className="border-b border-(--indox-border) last:border-b-0 transition-colors hover:bg-(--indox-surface)/60"
                >
                  <td className="max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap px-[18px] py-[11px] font-mono text-[12.5px] text-foreground">
                    {q.q}
                  </td>
                  <td className="px-[18px] py-[11px] font-mono text-[12px] text-(--indox-muted)">{q.sources}</td>
                  <td className="px-[18px] py-[11px] font-mono text-[12px] text-(--indox-dim)">{q.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
