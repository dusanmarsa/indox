export const dynamic = "force-dynamic";

import { getDashboardSources } from "@/lib/dashboard-data";
import SourcesTable from "@/components/dashboard/SourcesTable";
import { requireWorkspace } from "@/lib/session";

export default async function SourcesPage() {
  const { workspace } = await requireWorkspace();
  const sources = await getDashboardSources(workspace.id);
  const syncedCount = sources.filter((s) => s.status === "ok").length;
  const warnCount = sources.filter((s) => s.status === "warn").length;

  const subtitle = sources.length === 0
    ? "no repositories indexed"
    : `${sources.length} connected · ${syncedCount} synced${warnCount > 0 ? ` · ${warnCount} need attention` : ""}`;

  return (
    <div>
      <div className="mb-9 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Sources</h1>
          <p className="font-mono text-[13px] text-(--indox-muted)">{subtitle}</p>
        </div>
      </div>

      <div className="border border-(--indox-border)">
        <div className="flex items-center justify-between border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[13px]">
          <span className="text-[13px] font-medium">Indexed repositories</span>
          <span className="font-mono text-[11px] text-(--indox-dim)">{sources.length} total</span>
        </div>
        {sources.length === 0 ? (
          <div className="px-[18px] py-12 text-center font-mono text-[12px] text-(--indox-dim)">
            no repositories indexed yet — start a chat to trigger indexing
          </div>
        ) : (
          <SourcesTable sources={sources} />
        )}
      </div>
    </div>
  );
}
