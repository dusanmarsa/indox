# @indox/worker — agent guide

Long-running Bun process. Consumes pg-boss jobs and calls into `@indox/core` —
no indexing logic of its own.

```
pg-boss (Postgres)
  ├─ sync-adapter jobs   →  syncAdapter(adapterId)
  └─ sync-source jobs    →  syncSource(sourceId)
```

---

## src/index.ts

1. `recoverStuckIndexing()` — sweep any `Source` / `Adapter` rows left
   `"running"` by a previous SIGKILLed / OOM'd worker. Without this, the
   dashboard's "re-index" button would stay disabled forever for those rows.
2. `getBoss()` — pg-boss instance using `DATABASE_URL_UNPOLLED` if set, else
   `DATABASE_URL`.
3. `await boss.start()`.
4. `boss.work(QUEUE_SYNC_ADAPTER, ...)` and `boss.work(QUEUE_SYNC_SOURCE, ...)`.
   Each pickup logs `picked up … (job <jobId>)`; the web side logs
   `enqueued source sync <id> as job <jobId>` so the trail is correlatable
   end-to-end.
5. Handlers call into core and let errors propagate — pg-boss retries per its
   policy.
6. `SIGINT` / `SIGTERM` → `boss.stop()` for graceful drain.

Imports are split across `@indox/core` subpaths:

```ts
import { logger } from "@indox/core/logger";
import { recoverStuckIndexing } from "@indox/core/sources";
import { getBoss, QUEUE_SYNC_*, ... } from "@indox/core/queue";
import { syncAdapter, syncSource } from "@indox/core/sync";
```

`@indox/core/sync` is worker-only by design (it pulls in the chunker and
adapter drivers); web is lint-forbidden from importing it.

---

## Environment

| Variable                | Purpose                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`          | Prisma client inside `@indox/core` and pg-boss fallback.                                         |
| `DATABASE_URL_UNPOLLED` | Optional. Set only if `DATABASE_URL` points at a transaction-pooler that strips `LISTEN/NOTIFY`. |
| `OPENAI_API_KEY`        | `embedMany` calls during indexing.                                                               |
| `ADAPTER_TOKEN_KEY`     | Decrypt adapter PATs at sync time.                                                               |

In production, the platform provides these. Locally Bun auto-loads `./.env`
when run from repo root.

---

## Dev

```bash
bun --filter @indox/worker dev    # bun --watch src/index.ts
bun run dev                        # web + worker together
```

---

## Production

Deploys as a separate Railway service (see [`railway.toml`](railway.toml)).
**Keep replicas = 1** — pg-boss handles ordering/dedup but accidental
concurrent sync of the same source wastes upstream API quota.

```bash
bun --filter @indox/worker start   # bun src/index.ts
```

---

## Adding a new job type

1. Export the queue constant + job type from `@indox/core`'s `src/index.ts`.
2. Register a `boss.work(NEW_QUEUE, handler)` in `src/index.ts`.
3. Graceful shutdown covers all registered workers automatically.

The worker stays thin. Heavy logic belongs in `@indox/core`.

---

## Error handling

Errors in a `boss.work` handler mark the job failed; pg-boss retries by its
configured policy. Don't swallow errors — let them surface.

`syncAdapter` / `syncSource` already update `Adapter.syncStatus` /
`Source.indexStatus` to `"failed"` so the dashboard reflects failures before
pg-boss retries are exhausted.

The case the `try/catch` inside `syncSource` can't cover — a SIGKILLed worker
that never reaches `markSourceFailed` — is handled by the
`recoverStuckIndexing()` sweep on the next worker startup (and on every
dashboard render). Default threshold: rows `"running"` with `updatedAt` older
than 60 minutes.
