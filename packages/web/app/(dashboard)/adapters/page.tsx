export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { PageHead } from "@indox/ui";
import { getDashboardAdapters } from "@/lib/dashboard-data";
import AdaptersList from "@/components/dashboard/AdaptersList";
import { requireWorkspace } from "@/lib/session";
import { TableSkeleton } from "@/components/dashboard/skeletons";

export default async function AdaptersPage() {
  const { workspace } = await requireWorkspace();

  return (
    <div>
      <Suspense fallback={<AdaptersFallback />}>
        <AdaptersSection workspaceId={workspace.id} />
      </Suspense>
    </div>
  );
}

function AdaptersFallback() {
  return (
    <>
      <PageHead title="Adapters" subtitle="loading…" />
      <TableSkeleton rows={4} cols={5} />
    </>
  );
}

async function AdaptersSection({ workspaceId }: { workspaceId: string }) {
  const adapters = await getDashboardAdapters(workspaceId);
  return (
    <>
      <PageHead
        title="Adapters"
        subtitle={
          adapters.length === 0
            ? "no adapters configured yet"
            : `${adapters.length} configured · ${adapters.reduce((s, a) => s + a.readyCount, 0)} sources indexed`
        }
      />
      <AdaptersList adapters={adapters} />
    </>
  );
}
