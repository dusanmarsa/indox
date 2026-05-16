# Indox — monorepo agent guide

Cross-source semantic search infrastructure for AI agents. Indexes code and
documents, runs hybrid retrieval (vector + BM25 + RRF), exposes results over
MCP. Every result carries a SHA-pinned citation URL.

---

## Packages

| Package         | Path              | Role |
|-----------------|-------------------|------|
| `@indox/core`   | `packages/core`   | Engine — chunking, embedding, hybrid search, Prisma, pg-boss queue, auth/crypto helpers. No HTTP, no MCP, no React. |
| `@indox/worker` | `packages/worker` | Long-running Bun process that consumes pg-boss sync jobs. |
| `@indox/mcp`    | `packages/mcp`    | xmcp server exposing `search_code` + `list_indexed_sources` over HTTP (per-user bearer) and stdio (local agents). |
| `@indox/web`    | `packages/web`    | Next.js 16 app: landing, dashboard, chat, REST API, email/password auth via better-auth. |

`web`, `worker`, and `mcp` all import from `@indox/core`. They don't import
from each other and share the same Postgres database.

---

## Job flow

```
            @indox/core
        (engine + prisma + queue + auth)
       /          |          \
@indox/web   @indox/worker  @indox/mcp
                 |
                 ▼
              Postgres
        (pgvector + pg-boss)
```

Web (or any caller) → `enqueueAdapterSync(id)` → pg-boss row in Postgres →
worker dequeues → `syncAdapter` / `syncSource`.

---

## Runtime + tooling

- **Bun** is the package manager and runtime for scripts/dev. `bun.lockb` is the source of truth.
- **Bun workspaces** under `packages/*`. No Turborepo.
- **TypeScript strict** via shared `tsconfig.base.json`.
- **ESLint** lives in `packages/web` only.
- **Husky + lint-staged** run lint-staged on commit, full typecheck on push.
- **CI**: `.github/workflows/ci.yml` — install, db:generate, typecheck, lint, build, audit.

---

## Environment variables

Repo-root `.env`. Full reference in [`.env.example`](.env.example).

| Var                          | Required by              | Purpose                                  |
|------------------------------|--------------------------|------------------------------------------|
| `DATABASE_URL`               | core, web, worker, mcp   | Postgres (pgvector + pg_trgm required)   |
| `DATABASE_URL_UNPOLLED`      | core (pg-boss), optional | Set only if you're behind a transaction-pooler that strips LISTEN/NOTIFY |
| `OPENAI_API_KEY`             | core, web, worker, mcp   | Embeddings + chat/rewrite                |
| `ADAPTER_TOKEN_KEY`          | core, web, worker        | AES-256-GCM key for adapter PAT at rest  |
| `BETTER_AUTH_SECRET`         | web                      | Cookie-signing secret                    |
| `BETTER_AUTH_URL`            | web                      | Canonical app URL                        |
| `INDOX_ALLOWED_EMAILS`       | web (optional)           | Lock signup to a comma-separated list    |
| `MCP_PUBLIC_URL`             | web (optional)           | Shown on `/dashboard/mcp`                |
| `CSRF_ALLOWED_ORIGINS`       | web (optional)           | Extra accepted origins for mutating routes |
| `UPSTASH_REDIS_REST_URL/TOKEN` | web (optional)         | Chat rate limiting; no-op when unset     |

---

## Common dev commands

```bash
bun install                         # all packages
bun run dev                         # web + worker
bun run db:migrate                  # prisma migrate dev
bun run db:generate                 # regenerate Prisma client
bun run typecheck                   # all packages
bun --filter @indox/web lint        # lint web only
```

---

## Prisma

Schema + migrations in `packages/core/prisma/`. Generated client at
`packages/core/prisma/generated/client` (gitignored — run `db:generate` after
a fresh clone or schema change). Config: `packages/core/prisma.config.ts`
(Prisma 7 format).

`packages/web/package.json` runs `db:generate` automatically before each build.

---

## Key invariants

- **`@indox/core` has no transport concerns.** No `Request`/`Response`, no
  MCP SDK imports, no React. If you find yourself adding those, work in a
  higher-level package.
- **Adapter tokens are encrypted at rest** via `encryptToken` / `decryptToken`
  ([`packages/core/src/crypto.ts`](packages/core/src/crypto.ts)). Always
  decrypt before passing to a driver (e.g. GitHub).
- **`ownerKey` columns hold the `User.id`** from better-auth. Use
  `requireOwnerKey()` from [`packages/web/lib/session.ts`](packages/web/lib/session.ts)
  to read it in routes/server components.
- **Every chunk stores a SHA-pinned `chunk_url`.** Never construct
  `/blob/main/…` URLs — the default branch may not be `main`. The stored
  URL at index time is the authoritative citation.
- **Hardcoded models:** embeddings `text-embedding-3-small`
  ([`hybrid.ts`](packages/core/src/search/hybrid.ts)), chat `gpt-4o-mini`
  ([`route.ts`](packages/web/app/api/chat/route.ts)). Not env-configurable yet.

---

## Adding a new source adapter

1. Create `packages/core/src/adapters/<name>.ts` implementing `AdapterDriver`
   (see [`adapters/types.ts`](packages/core/src/adapters/types.ts)).
2. Register it in [`registry.ts`](packages/core/src/adapters/registry.ts).
3. Export public helpers from [`packages/core/src/index.ts`](packages/core/src/index.ts).
4. Add a Prisma migration if the schema needs updating.
5. The worker auto-picks up new adapter kinds via `syncAdapter`.

---

## Adding an MCP tool

Drop a file in `packages/mcp/src/tools/` — xmcp registers by file convention.
Call `authenticate()` from [`packages/mcp/src/auth.ts`](packages/mcp/src/auth.ts)
first, then scope all core calls by the returned `userId`.

---

## Adding an API route (web)

App Router under `packages/web/app/api/`. Pattern:

```ts
import { requireOwnerKey } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return csrfReject();
  const ownerKey = await requireOwnerKey();
  // …
}
```

Proxy at [`packages/web/proxy.ts`](packages/web/proxy.ts) gates whole route
groups; per-route owner checks still required for object-level authorization.
