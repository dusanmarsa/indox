export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { PageHead } from "@indox/ui";
import { getDashboardSources } from "@/lib/dashboard-data";
import SourcesTable from "@/components/dashboard/SourcesTable";
import { requireWorkspace } from "@/lib/session";
import { TableSkeleton } from "@/components/dashboard/skeletons";

export default async function SourcesPage() {
  const { workspace } = await requireWorkspace();

  return (
    <div>
      <Suspense fallback={<SourcesFallback />}>
        <SourcesSection workspaceId={workspace.id} />
      </Suspense>
    </div>
  );
}

function SourcesFallback() {
  return (
    <>
      <PageHead title="Sources" subtitle="loading…" />
      <TableSkeleton rows={6} cols={6} />
    </>
  );
}

async function SourcesSection({ workspaceId }: { workspaceId: string }) {
  const sources = await getDashboardSources(workspaceId);
  const syncedCount = sources.filter((s) => s.status === "ready").length;
  const indexingCount = sources.filter((s) => s.status === "indexing").length;
  const failedCount = sources.filter((s) => s.status === "failed").length;

  const parts = [`${sources.length} connected`, `${syncedCount} synced`];
  if (indexingCount > 0) parts.push(`${indexingCount} indexing`);
  if (failedCount > 0) parts.push(`${failedCount} failed`);
  const subtitle = sources.length === 0 ? "no repositories indexed" : parts.join(" · ");

  return (
    <>
      <PageHead title="Sources" subtitle={subtitle} />
      {sources.length === 0 ? (
        <div className="rounded-md border border-border bg-surface px-4 py-12 text-center font-mono text-[12px] text-ink-3">
          no repositories indexed yet — start a chat to trigger indexing
        </div>
      ) : (
        <SourcesTable sources={sources} />
      )}
    </>
  );
}
