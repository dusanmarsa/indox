# @indox/core — agent guide

The engine. Chunking, embeddings, hybrid retrieval, adapter drivers, Prisma,
pg-boss queue helpers, token encryption, MCP-token issuance. No transport
concerns — no `Request`/`Response`, no MCP SDK, no React.

Imported by `@indox/web`, `@indox/worker`, `@indox/mcp`.

---

## Public API

`src/index.ts` is the only stable surface. Everything else under `src/` is
internal. Each export is a commitment to three downstream packages — keep the
list intentional.

```
hybridSearch / Chunk / HybridSearchOptions        ← retrieval
fuse / RRF_K / Ranked / Fused                     ← RRF primitive (tested)
chunkFile / shouldIndex / classifyFile / CodeChunk ← chunking
getDriver / listAdapterKinds                      ← adapter registry
listGithubRepos / resolveGithubRepo               ← GitHub helpers
markAdapter*/markSource* status transitions
upsertSources / replaceSourceEmbeddings
listAdapters / listAdaptersByOwner / listSources  ← state reads
addSourceToAdapter / removeSourceFromAdapter / getAdapter
syncAdapter / syncSource                          ← orchestration
createConversation / listConversations / getConversation / deleteConversation / appendMessage
prisma                                            ← singleton Prisma client
logger                                            ← tagged logger
encryptToken / decryptToken / isEncrypted         ← AES-256-GCM for PATs
generateMcpToken / rotateMcpToken / getOrCreateMcpToken / resolveMcpToken
getBoss / enqueueAdapterSync / enqueueSourceSync / QUEUE_SYNC_* / SyncAdapterJob / SyncSourceJob
CORE_VERSION
```

---

## Hybrid search

`hybridSearch(question, limit?, opts?)` → `Chunk[]`. Each chunk has
`{ text, url, confidence }` where `url` is the SHA-pinned blob URL stored at
index time.

Pipeline:
1. Optional query rewrite via `gpt-4o-mini` → 1–2 code-shaped variants.
2. Embed all variants in one `embedMany` batch (`text-embedding-3-small`, 1536-dim).
3. Vector ANN per variant (`embedding <=> $1::vector`, top 15).
4. BM25 per variant (`websearch_to_tsquery` against `chunk_text_tsv`, top 15).
5. Fuse via RRF (`rrf.ts`, `k = 60`).
6. Relevance floor — keep when both retrievers found it OR cosine ≤ 0.5. Long-tail
   single-retriever hits are returned with `confidence: "weak"` and a hedge note
   in the chat system prompt.

```ts
type HybridSearchOptions = {
  rewrite?: boolean;    // default true
  bm25?: boolean;       // default true
  sourceIds?: string[]; // restrict to specific Source rows
};
```

---

## Chunker

`chunkFile(path, content)` → `CodeChunk[]`. Line-window with overlap; heuristic,
not AST-based. Always gate with `shouldIndex(path)` first (skips lock files,
binaries, generated artifacts, `node_modules`, `.git`).

---

## Adapters

An adapter maps an external source (GitHub org/user/repos) to `Source` rows.
Interface: `AdapterDriver` in `src/adapters/types.ts`.

**GitHub adapter** (`src/adapters/github.ts`):
- Downloads the zipball for a ref, unpacks with `fflate`.
- Embeds in batches via `embedMany` with **TPM pacing** (800k tokens / 30s
  cooldown). Don't remove — OpenAI 429s on large repos otherwise.
- `replaceSourceEmbeddings` does raw SQL with `$4::vector` cast (Prisma's
  query builder doesn't speak `vector`).
- Adapter tokens are **encrypted** in the DB via `encryptToken`. Always pipe
  the stored value through `decryptToken` before calling GitHub.

Register new adapters in `src/adapters/registry.ts`.

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
- `Embedding` — chunk + 1536-dim vector + generated `chunk_text_tsv`.
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
inline the strings.

The worker (in `@indox/worker`) calls `boss.work(QUEUE_*, …)`.

---

## Sync orchestration

`syncAdapter(id)`:
1. Load adapter, resolve driver via `getDriver(adapter.kind)`.
2. `driver.enumerate(adapter)` → `EnumeratedSource[]`.
3. `upsertSources` to reconcile rows, then drive per-source indexing.
4. Update `Adapter.syncStatus` and per-`Source.indexStatus` throughout.

`syncSource(id)` is the per-source variant used by the "add one repo" flow.

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
