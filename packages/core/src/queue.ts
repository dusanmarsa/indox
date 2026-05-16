// Job queue backed by Postgres (pg-boss). Both producer (web) and consumer
// (worker) get a singleton boss per process via getBoss(). pg-boss owns its
// own `pgboss` schema in the same database — no extra infra to deploy.

import type PgBoss from "pg-boss";

export const QUEUE_SYNC_ADAPTER = "sync-adapter";
export const QUEUE_SYNC_SOURCE = "sync-source";

export type SyncAdapterJob = {
  adapterId: string;
};

export type SyncSourceJob = {
  sourceId: string;
};

let bossPromise: Promise<PgBoss> | null = null;

export function getBoss(): Promise<PgBoss> {
  if (!bossPromise) {
    bossPromise = (async () => {
      // Lazy-load pg-boss so importing @indox/core from a Next page (which
      // happens through prisma + helpers) doesn't drag the native pg
      // bindings into Turbopack's bundle graph.
      const { default: PgBossCtor } = await import("pg-boss");
      // pg-boss needs LISTEN/NOTIFY and per-connection session state. If
      // your Postgres sits behind a transaction-mode pooler that strips
      // either, point DATABASE_URL_UNPOLLED at the direct connection.
      // Otherwise DATABASE_URL is fine.
      const connectionString =
        process.env.DATABASE_URL_UNPOLLED ?? process.env.DATABASE_URL;
      if (!connectionString) throw new Error("DATABASE_URL is required for pg-boss");
      const boss = new PgBossCtor({
        connectionString,
        ssl: { rejectUnauthorized: true },
      });
      await boss.start();
      await boss.createQueue(QUEUE_SYNC_ADAPTER);
      await boss.createQueue(QUEUE_SYNC_SOURCE);
      return boss;
    })();
  }
  return bossPromise;
}

// Singleton-keyed by adapterId so duplicate sync triggers (e.g. user clicks
// "re-sync" twice) collapse to one job. The job itself writes syncStatus on
// the adapter row on terminal errors so the UI sees the failure even after
// pg-boss gives up.
export async function enqueueAdapterSync(adapterId: string): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(QUEUE_SYNC_ADAPTER, { adapterId } satisfies SyncAdapterJob, {
    singletonKey: adapterId,
    retryLimit: 2,
    retryDelay: 30,
    expireInHours: 2,
  });
}

// Per-source sync — used when the user adds a single repo to an existing
// adapter and we want to index just that one without redoing every embedding.
export async function enqueueSourceSync(sourceId: string): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(QUEUE_SYNC_SOURCE, { sourceId } satisfies SyncSourceJob, {
    singletonKey: sourceId,
    retryLimit: 2,
    retryDelay: 30,
    expireInHours: 2,
  });
}
