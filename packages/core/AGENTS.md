# @indox/core — agent guide

The engine. Chunking, embeddings, hybrid retrieval, adapter drivers, Prisma,
pg-boss queue helpers, token encryption, MCP-token issuance. No transport
concerns — no `Request`/`Response`, no MCP SDK, no React.

Imported by `@indox/web`, `@indox/worker`, `@indox/mcp`.

---

## Public API

The package exposes a **root barrel** plus a set of **subpath entrypoints**.
Keep this split intentional — the barrel is restricted to modules that are
safe to load in any process (web, worker, mcp); anything that drags in
`chunker → vendor.ts → tree-sitter-wasms` lives behind a subpath so the web
process doesn't evaluate it (and pay the noisy log + module-load cost) just
because some route imports `prisma` from `@indox/core`.

### Root barrel (`@indox/core`)

```
hybridSearch / SearchHit / HybridSearchOptions       ← retrieval
fuse / RRF_K / Ranked / Fused                        ← RRF primitive (tested)
AdapterKind / SourceMetadata / SyncStatus / …        ← adapter TYPES only
markAdapter* / markSource* status transitions
upsertSources / replaceSourceEmbeddings
listAdapters / listAdaptersByWorkspace / listSources
addSourceToAdapter / removeSourceFromAdapter / getAdapter
recoverStuckIndexing                                 ← orphan-job sweep
listUserWorkspaces / resolveActiveWorkspace / ensureDefaultWorkspace
getOwnedWorkspace / createWorkspace / deleteWorkspace / copyAdapterToWorkspace
ALLOWED_MODELS / DEFAULT_MODEL / isAllowedModel / validateSlug / …
getWorkspaceSettings / updateWorkspaceSettings / getWorkspaceBySlug
checkAndIncrementWorkspaceUsage / getWorkspaceUsageToday
createConversation / listConversations / getConversation / deleteConversation
getOrCreateAnonConversation / getAnonConversation / appendMessage
prisma                                               ← singleton Prisma client
logger                                               ← tagged logger
encryptToken / decryptToken / isEncrypted            ← AES-256-GCM for PATs
generateMcpToken / createToken / getOrCreatePersonalToken / rotatePersonalToken
listUserTokens / deleteToken / resolveMcpToken
getBoss / enqueueAdapterSync / enqueueSourceSync / QUEUE_SYNC_* / SyncAdapterJob / SyncSourceJob
CORE_VERSION
```

### Subpath entrypoints

Heavy or process-specific modules. Importing one of these does NOT evaluate
anything outside the listed file's import graph.

| Import                              | Use it for                                                            |
| ----------------------------------- | --------------------------------------------------------------------- |
| `@indox/core/adapters`              | `getDriver`, `listAdapterKinds` — the driver registry.                |
| `@indox/core/adapters/github`       | `listGithubRepos`, `resolveGithubRepo`.                               |
| `@indox/core/adapters/notion`       | `listNotionPages`, `resolveNotionPage`.                               |
| `@indox/core/sync`                  | `syncAdapter`, `syncSource` — worker-only orchestration.              |
| `@indox/core/queue`                 | Same exports as the barrel; useful when you only want the queue glue. |
| `@indox/core/db`, `…/logger`, etc.  | Per-module fine-grained imports if you want to avoid the barrel.      |

Web has an ESLint guard (`packages/web/eslint.config.mjs`) that forbids
importing the adapter-driver / sync names from the root barrel — re-adding
them to `src/index.ts` is the kind of regression that's hard to spot in a
PR but immediately re-leaks `[indox:vendor] loaded N linguist vendor patterns`
into the web logs.

---

## Hybrid search

`hybridSearch(question, limit?, opts?)` → `SearchHit[]`. Each hit has
`{ text, url, confidence }` where `url` is the SHA-pinned blob URL stored at
index time and `confidence` is `"strong" | "weak"`.

Pipeline:

1. Optional query rewrite via `gpt-4o-mini` → 1–2 variants. The rewriter is
   mixed-corpus aware (code-shaped vs prose-shaped questions). Skipped for
   identifier-shaped queries — BM25 already nails those.
2. Embed all variants in one `embedMany` batch — `text-embedding-3-large` at
   the full 3072 dimensions, stored as `halfvec(3072)`.
3. Vector ANN per variant (`embedding <=> $1::halfvec`, top 25).
4. BM25 per variant (`websearch_to_tsquery` against `chunk_text_tsv`, top 25).
5. Path-token boost — file paths in chunk URLs are rescored against tokens
   extracted from the question + rewrites, then folded into RRF as a third
   retrieval list. Rescues queries like "how does indox chunk source files"
   that the embedding model misses but the path `chunker/` clearly answers.
6. Fuse via RRF (`rrf.ts`, `k = 60`).
7. Two-tier confidence floor on cosine distance:
   - `strong`: vector alone ≤ 0.55, OR vector ≤ 0.70 *and* both retrievers
     agreed on the same file.
   - `weak`: anything else inside 0.70.
   - dropped silently beyond 0.70. Suppress the weak tier entirely once two
     or more strong hits are in hand.

```ts
type HybridSearchOptions = {
  rewrite?: boolean; // default true
  bm25?: boolean; // default true
  sourceIds?: string[]; // restrict to specific Source rows
};
```

---

## Chunker

`chunkContent(item: ContentItem): Chunk[]` — shape-dispatched, source-agnostic.
The adapter builds a `ContentItem` with `shape: "code" | "prose" | "blob"` and
the chunker picks the right strategy:

- **code** — tree-sitter (`web-tree-sitter` + `tree-sitter-wasms`) walks the
  AST and emits chunks at function / class / method boundaries. Small
  adjacent siblings are merged.
- **prose** — split on Markdown heading structure into ~2,400-char sections.
  Long sections fall back to paragraph (`\n\n`) boundaries. Non-trivial code
  blocks inside prose are also surfaced as their own chunks.
- **blob** — opaque text: fixed-size character windows.

`shouldIndex(path)` is a separate classifier helper used by filesystem-shaped
adapters (the github driver) to skip lock files, binaries, generated
artifacts, `node_modules`, `.git`. It uses the embedded linguist vendor list
(`vendor.ts`) — which is the heavy module the root barrel deliberately
doesn't pull in.

The chunker lives at `src/chunker/` (split across `code.ts`, `prose.ts`,
`blob.ts`, `classify.ts`, `path-tokens.ts`). The barrel re-exports only the
TYPES from this module — value imports go through `../chunker` inside core
or `@indox/core/src/chunker` from a worker/adapter context.

---

## Adapters

An adapter maps an external source (GitHub org/user/repos) to `Source` rows.
Interface: `AdapterDriver` in `src/adapters/types.ts`.

**GitHub adapter** (`src/adapters/github.ts`):

- Downloads the zipball for a ref, unpacks with `fflate`.
- Embeds in batches via `embedMany` with **TPM pacing** (800k tokens / 30s
  cooldown). Don't remove — OpenAI 429s on large repos otherwise.
- Adapter tokens are **encrypted** in the DB via `encryptToken`. Always pipe
  the stored value through `decryptToken` before calling GitHub.

**Notion adapter** (`src/adapters/notion.ts`):

- BFS the page tree from each indexed root; each page becomes its own
  `ContentItem` with `shape: "prose"` so the citation URL points at the
  matching Notion page, not the root.
- `fetchPageMarkdown` uses Notion's renderer so columns, synced blocks,
  toggles etc. behave consistently with what a user sees in the UI.
- Capped by `MAX_PAGES_PER_SOURCE` and `MAX_PAGE_DEPTH` so a runaway page
  tree can't exhaust quota in one indexing run.

`replaceSourceEmbeddings` (`src/source-index.ts`) does raw SQL with a
`$4::halfvec` cast — Prisma's query builder doesn't speak `halfvec`.

Register new adapters in `src/adapters/registry.ts`. Driver registration is
behind the `@indox/core/adapters` subpath; the root barrel only re-exports
the adapter TYPES.

---

## Auth + MCP tokens

`crypto.ts` — AES-256-GCM with a SHA-256-derived key from `ADAPTER_TOKEN_KEY`.
Encrypted values are prefixed `enc:v1:` so legacy plaintext rows still decode
during rollout.

`mcp-token.ts` — generates and resolves `mcp_<48-base64url>` bearer tokens
stored on `User.mcpToken`. Plaintext storage (single indexed equality lookup
per MCP request); swap to hashed + prefix-indexed only if the threat model
changes.

---

## Prisma / database

**Client:** `src/db.ts` exports a singleton `prisma` using
`@prisma/adapter-pg` (standard libpq). Survives hot-reload via a `global`
attachment in dev. Always import this — don't instantiate a new client.

**Schema:** `prisma/schema.prisma`. Key tables:

- `Adapter` — owner-scoped, encrypted PAT, scope JSON.
- `Source` — one per indexed repo; cascades from `Adapter`.
- `Embedding` — chunk + `halfvec(3072)` vector + generated `chunk_text_tsv`.
- `Conversation` / `ConversationMessage` — owner-scoped chat history.
- `User` / `Session` / `Account` / `Verification` — better-auth schema.
- `UsageLog` — per-IP daily query counts (still global, pre-auth artifact).

**Migrations:** `prisma/migrations/`. Always go through
`bun run db:migrate` (prisma migrate dev). Never hand-edit shipped migration SQL.

**Raw SQL** is used for vector inserts and BM25 search via `$queryRawUnsafe` —
positional params (`$1`, `$2`).

---

## Queue

`getBoss()` returns a pg-boss instance using `DATABASE_URL_UNPOLLED` when set,
otherwise `DATABASE_URL`. The override exists because pg-boss needs
`LISTEN/NOTIFY` and per-connection session state — both stripped by
transaction-mode connection poolers. Most direct Postgres deployments don't
need it; leave it unset.

`enqueueAdapterSync(id)` / `enqueueSourceSync(id)` are the two job types.
`QUEUE_SYNC_ADAPTER` / `QUEUE_SYNC_SOURCE` are the job-name constants — never
inline the strings. Both helpers wrap `boss.send` in a small retry loop
(`sendWithRetry`, 3 attempts, 200/400 ms backoff) because pg-boss can return
`null` during a cold start or transient pool exhaustion — and we don't want
the user's first click after a deploy to look like it did nothing.

The worker (in `@indox/worker`) calls `boss.work(QUEUE_*, …)`.

### Orphan recovery

`recoverStuckIndexing(maxRunningMinutes = 60)` resets any `Source.indexStatus`
/ `Adapter.syncStatus` row that's been `"running"` longer than the threshold
to `"failed"`. The worker calls it on startup so a SIGKILLed / OOM'd
predecessor doesn't leave rows stuck forever; the web dashboard data loader
also calls it on every render (deduped per-request via `react/cache`) so the
"reindex" button is never permanently disabled by stale state.

---

## Sync orchestration

Lives behind `@indox/core/sync` (worker-only subpath). Pulling it through
the root barrel would drag the chunker + vendor + tree-sitter modules into
every importer.

`syncAdapter(id)`:

1. Load adapter, resolve driver via `getDriver(adapter.kind)`.
2. `driver.enumerate(adapter)` → `EnumeratedSource[]`.
3. `upsertSources` to reconcile rows, then drive per-source indexing.
4. Update `Adapter.syncStatus` and per-`Source.indexStatus` throughout.

`syncSource(id)` is the per-source variant used by the "add one repo" / "re-
index this source" flows. Failures are caught and recorded via
`markSourceFailed`, so the dashboard reflects the outcome even when the job
itself succeeds for pg-boss.

---

## Logger

`logger.info/warn/debug/error(tag, message)` — prefixes `[indox:<tag>]`.

---

## Tests

`src/search/rrf.test.ts` uses `bun:test`. Run `bun test` from repo root.
New tests: `.test.ts` next to the file under test.

---

## What NOT to add here

- HTTP handlers, `Request`/`Response`, MCP SDK, React/Next imports.
- A second Prisma client — always import the singleton.
- Any process.env reads outside `crypto.ts` (which already does it).
