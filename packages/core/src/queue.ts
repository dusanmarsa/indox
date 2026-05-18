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
      const connectionString = process.env.DATABASE_URL_UNPOLLED ?? process.env.DATABASE_URL;
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

// User-initiated re-syncs intentionally do NOT use pg-boss singleton keys.
// singletonKey blocks new sends as long as a prior job for the same key is
// in created/active/retry/failed state — which means a single failed run
// (e.g. a Notion API hiccup) silently swallows every subsequent re-index
// click until pg-boss's archiver sweeps the old row. A double-click that
// runs twice is the cheaper failure mode.
//
// On terminal errors the job handler writes status on the adapter / source
// row, so the UI sees the outcome regardless of pg-boss's job-archive state.

const JOB_OPTIONS = { retryLimit: 2, retryDelay: 30, expireInHours: 2 } as const;

// boss.send() resolves to null when pg-boss declines to enqueue — most often
// a transient: race during boss.start(), a brief pool exhaustion, or a stale
// pgboss schema row. Retrying a couple of times turns the "first click after
// cold start does nothing" symptom into a successful enqueue without forcing
// the user to reload.
async function sendWithRetry<T extends object>(
  queue: string,
  data: T,
  attempts = 3
): Promise<string | null> {
  const boss = await getBoss();
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const jobId = await boss.send(queue, data, JOB_OPTIONS);
      if (jobId) return jobId;
    } catch (err) {
      lastError = err;
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 200 * (i + 1)));
  }
  if (lastError) throw lastError;
  return null;
}

export async function enqueueAdapterSync(adapterId: string): Promise<string | null> {
  return sendWithRetry(QUEUE_SYNC_ADAPTER, { adapterId } satisfies SyncAdapterJob);
}

export async function enqueueSourceSync(sourceId: string): Promise<string | null> {
  return sendWithRetry(QUEUE_SYNC_SOURCE, { sourceId } satisfies SyncSourceJob);
}
