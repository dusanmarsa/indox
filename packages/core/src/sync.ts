// Orchestrates a full sync for one Adapter: enumerate sources via the driver,
// upsert source rows, then index each source. Writes syncStatus on the adapter
// and indexStatus on each source as it goes. Called from the pg-boss job
// handler in the worker.

import prisma from "./db";
import { logger } from "./logger";
import { getDriver } from "./adapters/registry";
import {
  markAdapterRunning,
  markAdapterReady,
  markAdapterFailed,
  markSourceRunning,
  markSourceReady,
  markSourceFailed,
  upsertSources,
} from "./source-index";

// Index a single Source without touching the rest of its adapter. Used when
// the user adds one repo to an existing adapter — we don't want to redo every
// embedding for every other source already indexed.
export async function syncSource(sourceId: string): Promise<void> {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`source ${sourceId} not found`);
  const adapter = await prisma.adapter.findUnique({ where: { id: source.adapterId } });
  if (!adapter) throw new Error(`adapter ${source.adapterId} not found`);
  const driver = getDriver(adapter.kind);
  await markSourceRunning(source.id);
  try {
    const { chunkCount, metadata } = await driver.indexSource(adapter, source);
    await markSourceReady(source.id, chunkCount, metadata);
    logger.info("sync", `indexed source ${source.id} (${chunkCount} chunks)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("sync", `index failed for source ${source.id}: ${msg}`);
    await markSourceFailed(source.id, msg);
    throw err;
  }
}

export async function syncAdapter(adapterId: string): Promise<void> {
  const adapter = await prisma.adapter.findUnique({ where: { id: adapterId } });
  if (!adapter) throw new Error(`adapter ${adapterId} not found`);

  const driver = getDriver(adapter.kind);
  await markAdapterRunning(adapterId);
  logger.info("sync", `starting sync for adapter ${adapter.id} (${adapter.kind})`);

  try {
    const enumerated = await driver.enumerate(adapter);
    logger.info("sync", `enumerated ${enumerated.length} sources for adapter ${adapter.id}`);
    const sources = await upsertSources(adapter, enumerated);

    // Index sources sequentially — embed throttling is per-process, parallel
    // indexing would multiply TPM pressure. Failures per source don't abort
    // the rest of the sync.
    let failures = 0;
    for (const source of sources) {
      try {
        await markSourceRunning(source.id);
        const { chunkCount, metadata } = await driver.indexSource(adapter, source);
        await markSourceReady(source.id, chunkCount, metadata);
      } catch (err) {
        failures++;
        const msg = err instanceof Error ? err.message : String(err);
        logger.error("sync", `index failed for source ${source.id}: ${msg}`);
        await markSourceFailed(source.id, msg);
      }
    }

    if (failures > 0) {
      await markAdapterFailed(adapterId, `${failures}/${sources.length} sources failed to index`);
    } else {
      await markAdapterReady(adapterId);
    }
    logger.info("sync", `sync done for adapter ${adapter.id} (${failures} failures)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("sync", `sync failed for adapter ${adapter.id}: ${msg}`);
    await markAdapterFailed(adapterId, msg);
    throw err;
  }
}
