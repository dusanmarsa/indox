import { notFound } from "next/navigation";
import { getAdapter } from "@indox/core";
import AdapterManager from "@/components/dashboard/AdapterManager";
import { requireOwnerKey } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdapterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ownerKey = await requireOwnerKey();
  const adapter = await getAdapter(id);
  // Render 404 for adapters not owned by the caller so the management page
  // can't be used to enumerate other sessions' adapter ids.
  if (!adapter || adapter.ownerKey !== ownerKey) notFound();

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

  return (
    <div>
      <div className="mb-9">
        <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Manage adapter</h1>
        <p className="font-mono text-[13px] text-(--indox-muted)">
          {adapter.kind} · {adapter.sources.length} source{adapter.sources.length === 1 ? "" : "s"}
        </p>
      </div>
      <AdapterManager adapter={dto} />
    </div>
  );
}
