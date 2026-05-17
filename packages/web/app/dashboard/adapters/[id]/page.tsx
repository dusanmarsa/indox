import { notFound } from "next/navigation";
import { getAdapter, listUserWorkspaces } from "@indox/core";
import AdapterManager from "@/components/dashboard/AdapterManager";
import { requireWorkspace } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdapterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, workspace } = await requireWorkspace();
  const adapter = await getAdapter(id);
  // Render 404 for adapters outside the active workspace so this page can't
  // be used to enumerate other workspaces' adapter ids.
  if (!adapter || adapter.workspaceId !== workspace.id) notFound();

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

  // Other workspaces this user owns — used by the "copy adapter to…" menu.
  const all = await listUserWorkspaces(user.id);
  const otherWorkspaces = all
    .filter((w) => w.id !== workspace.id)
    .map((w) => ({ id: w.id, name: w.name }));

  return (
    <div>
      <div className="mb-9">
        <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Manage adapter</h1>
        <p className="font-mono text-[13px] text-(--indox-muted)">
          {adapter.kind} · {adapter.sources.length} source{adapter.sources.length === 1 ? "" : "s"}
        </p>
      </div>
      <AdapterManager adapter={dto} otherWorkspaces={otherWorkspaces} />
    </div>
  );
}
