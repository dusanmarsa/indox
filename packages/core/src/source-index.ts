// Helpers for working with Adapter + Source rows: status transitions, listing,
// and embedding writes. Replaces the old repo-index.ts (which keyed everything
// by repo URL).

import prisma from "./db";
import { logger } from "./logger";
import type { Adapter, Source } from "../prisma/generated/client";
import type { IndexStatus, SyncStatus, SourceMetadata } from "./adapters/types";

// ─── adapter status transitions ───────────────────────────────────────────────

export async function markAdapterRunning(adapterId: string) {
  await prisma.adapter.update({
    where: { id: adapterId },
    data: { syncStatus: "running" satisfies SyncStatus, syncError: null },
  });
}

export async function markAdapterReady(adapterId: string) {
  await prisma.adapter.update({
    where: { id: adapterId },
    data: {
      syncStatus: "ready" satisfies SyncStatus,
      lastSyncedAt: new Date(),
      syncError: null,
    },
  });
}

export async function markAdapterFailed(adapterId: string, error: string) {
  await prisma.adapter.update({
    where: { id: adapterId },
    data: {
      syncStatus: "failed" satisfies SyncStatus,
      syncError: error.slice(0, 1000),
    },
  });
}

// ─── source status transitions ────────────────────────────────────────────────

export async function markSourceRunning(sourceId: string) {
  await prisma.source.update({
    where: { id: sourceId },
    data: { indexStatus: "running" satisfies IndexStatus, indexError: null },
  });
}

export async function markSourceReady(
  sourceId: string,
  chunkCount: number,
  metadata: SourceMetadata
) {
  await prisma.source.update({
    where: { id: sourceId },
    data: {
      indexStatus: "ready" satisfies IndexStatus,
      indexedAt: new Date(),
      chunkCount,
      indexError: null,
      metadata: metadata as object,
    },
  });
}

export async function markSourceFailed(sourceId: string, error: string) {
  await prisma.source.update({
    where: { id: sourceId },
    data: {
      indexStatus: "failed" satisfies IndexStatus,
      indexError: error.slice(0, 1000),
    },
  });
}

// Reset adapter/source rows whose status is "running" but whose updatedAt is
// older than `maxRunningMinutes`. This catches the case where the worker
// process was SIGKILLed mid-job (OOM, container restart, deploy) — pg-boss's
// own retry will eventually re-pick the job, but our row would otherwise stay
// in "running" forever, leaving the reindex button disabled in the UI.
//
// updatedAt is bumped by every mark*() call, so for a *live* sync the row
// looks fresh. The default 60 min threshold gives ample headroom for genuine
// large-repo indexing while still rescuing crashed jobs within an hour.
//
// Called from the worker's startup path and from the dashboard data loader so
// users always see a recoverable state, not a stuck one.
export async function recoverStuckIndexing(maxRunningMinutes = 60): Promise<{
  sources: number;
  adapters: number;
}> {
  const cutoff = new Date(Date.now() - maxRunningMinutes * 60_000);
  const reason = `worker did not finish within ${maxRunningMinutes}m — likely crashed mid-job`;

  const [sources, adapters] = await Promise.all([
    prisma.source.updateMany({
      where: { indexStatus: "running", updatedAt: { lt: cutoff } },
      data: { indexStatus: "failed" satisfies IndexStatus, indexError: reason },
    }),
    prisma.adapter.updateMany({
      where: { syncStatus: "running", updatedAt: { lt: cutoff } },
      data: { syncStatus: "failed" satisfies SyncStatus, syncError: reason },
    }),
  ]);

  if (sources.count > 0 || adapters.count > 0) {
    logger.info(
      "recover",
      `reset ${sources.count} source(s) and ${adapters.count} adapter(s) from stuck running state`
    );
  }
  return { sources: sources.count, adapters: adapters.count };
}

// ─── upsert sources from enumerate() output ──────────────────────────────────

export async function upsertSources(
  adapter: Adapter,
  enumerated: Array<{ externalId: string; displayName: string; metadata: SourceMetadata }>
): Promise<Source[]> {
  // Use a transaction so removal + insert is atomic per adapter.
  return prisma.$transaction(async (tx) => {
    const existing = await tx.source.findMany({ where: { adapterId: adapter.id } });
    const wanted = new Set(enumerated.map((e) => e.externalId));

    // Delete sources that are no longer in scope. Cascade clears embeddings.
    const toDelete = existing.filter((s) => !wanted.has(s.externalId));
    if (toDelete.length) {
      await tx.source.deleteMany({
        where: { id: { in: toDelete.map((s) => s.id) } },
      });
    }

    // Upsert each enumerated source; metadata is merged shallow.
    const upserted: Source[] = [];
    for (const e of enumerated) {
      const row = await tx.source.upsert({
        where: { adapterId_externalId: { adapterId: adapter.id, externalId: e.externalId } },
        update: {
          displayName: e.displayName,
          metadata: e.metadata as object,
        },
        create: {
          adapterId: adapter.id,
          kind: adapter.kind,
          externalId: e.externalId,
          displayName: e.displayName,
          metadata: e.metadata as object,
          indexStatus: "idle",
        },
      });
      upserted.push(row);
    }
    return upserted;
  });
}

// ─── embedding writes ─────────────────────────────────────────────────────────

export async function replaceSourceEmbeddings(
  sourceId: string,
  rows: { chunkText: string; chunkUrl: string; vector: number[] }[]
) {
  await prisma.embedding.deleteMany({ where: { sourceId } });
  await Promise.all(
    rows.map((r) => {
      const vec = `[${r.vector.join(",")}]`;
      return prisma.$executeRawUnsafe(
        `INSERT INTO embeddings (source_id, chunk_text, chunk_url, embedding) VALUES ($1, $2, $3, $4::halfvec)`,
        sourceId,
        r.chunkText,
        r.chunkUrl,
        vec
      );
    })
  );
}

// ─── listing helpers ──────────────────────────────────────────────────────────

export async function listAdapters() {
  return prisma.adapter.findMany({
    orderBy: { createdAt: "asc" },
    include: { sources: true },
  });
}

export async function listSources(
  opts: {
    adapterId?: string;
    readyOnly?: boolean;
    // Restrict to a single workspace, or a set (MCP tokens can carry many).
    workspaceId?: string;
    workspaceIds?: string[];
  } = {}
) {
  const workspaceFilter =
    opts.workspaceId !== undefined
      ? { adapter: { workspaceId: opts.workspaceId } }
      : opts.workspaceIds !== undefined
        ? { adapter: { workspaceId: { in: opts.workspaceIds } } }
        : {};
  return prisma.source.findMany({
    where: {
      ...(opts.adapterId ? { adapterId: opts.adapterId } : {}),
      ...(opts.readyOnly ? { indexStatus: "ready" } : {}),
      ...workspaceFilter,
    },
    orderBy: { displayName: "asc" },
    include: { adapter: true },
  });
}

export async function listAdaptersByWorkspace(workspaceId: string) {
  return prisma.adapter.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    include: { sources: true },
  });
}

// ─── per-source add/remove ────────────────────────────────────────────────────
// These let the dashboard manage individual sources on an existing adapter
// without re-running a full enumerate. The adapter's stored scope is updated
// alongside so it stays consistent with reality on the next full sync.

export async function addSourceToAdapter(
  adapterId: string,
  enumerated: { externalId: string; displayName: string; metadata: SourceMetadata }
): Promise<Source> {
  return prisma.$transaction(async (tx) => {
    const adapter = await tx.adapter.findUnique({ where: { id: adapterId } });
    if (!adapter) throw new Error(`adapter ${adapterId} not found`);

    const source = await tx.source.upsert({
      where: { adapterId_externalId: { adapterId, externalId: enumerated.externalId } },
      update: {
        displayName: enumerated.displayName,
        metadata: enumerated.metadata as object,
      },
      create: {
        adapterId,
        kind: adapter.kind,
        externalId: enumerated.externalId,
        displayName: enumerated.displayName,
        metadata: enumerated.metadata as object,
        indexStatus: "idle",
      },
    });

    const allSources = await tx.source.findMany({
      where: { adapterId },
      select: { externalId: true },
    });
    const externalIds = allSources.map((s) => s.externalId);
    await tx.adapter.update({
      where: { id: adapterId },
      data: { scope: nextScopeForKind(adapter.kind, adapter.scope, externalIds) as object },
    });

    return source;
  });
}

// Keep the adapter's scope row consistent with reality so a future full re-sync
// (driver.enumerate → parseScope) operates on the same set the user picked
// one-by-one via the manage page. Mode depends on the adapter kind:
//   github: `repos`-mode
//   notion: `pages`-mode — unless the user explicitly chose `search`, in which
//           case leave it alone (search means "everything accessible"; manual
//           adds are still allowed, but they shouldn't downgrade to an allowlist).
function nextScopeForKind(
  kind: string,
  currentScope: unknown,
  externalIds: string[]
): { mode: string; value?: unknown } {
  if (kind === "notion") {
    const cur = currentScope as { mode?: string } | null;
    if (cur?.mode === "search") return { mode: "search" };
    return { mode: "pages", value: externalIds };
  }
  // default + github: canonicalise to repos-mode
  return { mode: "repos", value: externalIds };
}

export async function removeSourceFromAdapter(
  sourceId: string
): Promise<{ adapterId: string } | null> {
  return prisma.$transaction(async (tx) => {
    const source = await tx.source.findUnique({ where: { id: sourceId } });
    if (!source) return null;
    await tx.source.delete({ where: { id: sourceId } });

    const adapter = await tx.adapter.findUnique({ where: { id: source.adapterId } });
    const remaining = await tx.source.findMany({
      where: { adapterId: source.adapterId },
      select: { externalId: true },
    });
    const externalIds = remaining.map((s) => s.externalId);
    await tx.adapter.update({
      where: { id: source.adapterId },
      data: {
        scope: nextScopeForKind(
          adapter?.kind ?? "github",
          adapter?.scope,
          externalIds
        ) as object,
      },
    });

    return { adapterId: source.adapterId };
  });
}

export async function getAdapter(adapterId: string) {
  return prisma.adapter.findUnique({ where: { id: adapterId }, include: { sources: true } });
}
