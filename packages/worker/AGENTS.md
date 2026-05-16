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

1. `getBoss()` — pg-boss instance using `DATABASE_URL_UNPOLLED` if set, else `DATABASE_URL`.
2. `await boss.start()`.
3. `boss.work(QUEUE_SYNC_ADAPTER, ...)` and `boss.work(QUEUE_SYNC_SOURCE, ...)`.
4. Handlers call into core and let errors propagate — pg-boss retries per its policy.
5. `SIGINT` / `SIGTERM` → `boss.stop()` for graceful drain.

---

## Environment

| Variable                 | Purpose |
|--------------------------|---------|
| `DATABASE_URL`           | Prisma client inside `@indox/core` and pg-boss fallback. |
| `DATABASE_URL_UNPOLLED`  | Optional. Set only if `DATABASE_URL` points at a transaction-pooler that strips `LISTEN/NOTIFY`. |
| `OPENAI_API_KEY`         | `embedMany` calls during indexing. |
| `ADAPTER_TOKEN_KEY`      | Decrypt adapter PATs at sync time. |

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
`Source.indexStatus` to `FAILED` so the dashboard reflects failures before
retries are exhausted.
