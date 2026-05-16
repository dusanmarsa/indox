// Long-running Bun process. Subscribes to the `sync-adapter` queue and runs
// a full sync for each adapter job. Deployed as its own Railway service
// alongside @indox/web; both share DATABASE_URL so pg-boss can broker jobs.

import {
  getBoss,
  QUEUE_SYNC_ADAPTER,
  QUEUE_SYNC_SOURCE,
  logger,
  syncAdapter,
  syncSource,
  type SyncAdapterJob,
  type SyncSourceJob,
} from "@indox/core";

async function main() {
  const boss = await getBoss();
  boss.on("error", (err) => logger.error("worker", `boss error: ${err?.message ?? err}`, err?.stack));

  await boss.work<SyncAdapterJob>(
    QUEUE_SYNC_ADAPTER,
    { batchSize: 1, pollingIntervalSeconds: 2 },
    async ([job]) => {
      logger.info("worker", `picked up adapter sync ${job.data.adapterId}`);
      await syncAdapter(job.data.adapterId);
    },
  );

  await boss.work<SyncSourceJob>(
    QUEUE_SYNC_SOURCE,
    { batchSize: 1, pollingIntervalSeconds: 2 },
    async ([job]) => {
      logger.info("worker", `picked up source sync ${job.data.sourceId}`);
      await syncSource(job.data.sourceId);
    },
  );

  logger.info("worker", "ready");

  const shutdown = async (sig: string) => {
    logger.info("worker", `${sig} received, draining`);
    await boss.stop({ graceful: true, wait: true });
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error("worker", "fatal startup error", err);
  process.exit(1);
});
