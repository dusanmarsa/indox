import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAdapter, listUserWorkspaces } from "@indox/core";
import { PageHead } from "@indox/ui";
import AdapterManager from "@/components/dashboard/AdapterManager";
import { requireWorkspace } from "@/lib/session";
import { AdapterDetailSkeleton } from "@/components/dashboard/skeletons";

export const dynamic = "force-dynamic";

export default async function AdapterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, workspace } = await requireWorkspace();

  return (
    <div>
      <Suspense
        fallback={
          <>
            <PageHead title="Manage adapter" subtitle="loading…" />
            <AdapterDetailSkeleton />
          </>
        }
      >
        <AdapterBody adapterId={id} workspaceId={workspace.id} userId={user.id} />
      </Suspense>
    </div>
  );
}

async function AdapterBody({
  adapterId,
  workspaceId,
  userId,
}: {
  adapterId: string;
  workspaceId: string;
  userId: string;
}) {
  const [adapter, all] = await Promise.all([getAdapter(adapterId), listUserWorkspaces(userId)]);
  // 404 for adapters outside the active workspace — prevents enumerating
  // other workspaces' adapter ids.
  if (!adapter || adapter.workspaceId !== workspaceId) notFound();

  const dto = {
    id: adapter.id,
    kind: adapter.kind,
    createdAt: adapter.createdAt.toISOString(),
    sources: adapter.sources.map((s) => ({
      id: s.id,
      externalId: s.externalId,
      displayName: s.displayName,
      indexStatus: s.indexStatus,
      chunkCount: s.chunkCount,
      indexedAt: s.indexedAt ? s.indexedAt.toISOString() : null,
      indexError: s.indexError,
    })),
  };

  const otherWorkspaces = all
    .filter((w) => w.id !== workspaceId)
    .map((w) => ({ id: w.id, name: w.name }));

  return (
    <>
      <PageHead
        title="Manage adapter"
        subtitle={`${adapter.kind} · ${adapter.sources.length} source${adapter.sources.length === 1 ? "" : "s"}`}
      />
      <AdapterManager adapter={dto} otherWorkspaces={otherWorkspaces} />
    </>
  );
}
