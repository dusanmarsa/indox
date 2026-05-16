# Glossary

Things Indox uses

---

## Retrieval

### Embedding
A list of numbers (a "vector") that represents the *meaning* of a piece of
text. Indox uses OpenAI's `text-embedding-3-small`, which outputs 1536-dim
vectors. Two texts about the same thing land near each other in this 1536-D
space, even if they share no exact words.

```
"how do we handle auth"  →  [0.12, -0.04, …, 0.71]
"authentication flow"    →  [0.13, -0.06, …, 0.69]   ← close
"how to bake bread"      →  [-0.41, 0.55, …, -0.02]  ← far
```

### Vector search / cosine similarity
"Which stored vectors are nearest to this query vector?" Distance is usually
**cosine** — the angle between two vectors. Smaller angle = more similar.
pgvector exposes it as the `<=>` operator: `embedding <=> $1::vector`.

### ANN — Approximate Nearest Neighbor
Brute-forcing "find the closest vector among 100k" means comparing the query
to every row. ANN algorithms trade a tiny bit of accuracy for a *huge* speed
win by building a graph or tree structure that skips most rows.

### HNSW — Hierarchical Navigable Small World
The specific ANN algorithm pgvector uses. It builds a layered graph: top
layer has long-range edges (jumps across the space), bottom layer has short
edges (fine-grained search). You enter at the top, hop down, end up close
to the answer in `O(log n)` time instead of `O(n)`.

Indox creates an HNSW index in [migration 20260515100000](packages/core/prisma/migrations/20260515100000_add_embedding_hnsw_index/migration.sql).
Without it, vector search would scan every embedding row on every query.

### BM25 — Best Matching 25
A 1994 ranking algorithm for text relevance. Like TF-IDF but better at
handling document length. Postgres FTS uses a BM25-style scoring function
(`ts_rank_cd`). It's what catches **exact identifier matches** the embedding
might miss — searching for `chatRatelimit` lights up BM25 instantly even if
the surrounding semantics are weird.

### TF-IDF
Term Frequency × Inverse Document Frequency. The "how relevant is this word
to this doc" math from the 70s. A word that appears 10x in a doc but rarely
in the corpus is a strong signal; a word that appears in every doc (`the`,
`and`) is useless. BM25 is the modern refinement.

### tsvector / tsquery
Postgres types for full-text search.
- `tsvector` — a document broken into lexemes ("normalised stemmed tokens
  with positions"). Indox stores one per chunk as a **generated column**
  (`chunk_text_tsv`) — Postgres recomputes it whenever `chunk_text` changes.
- `tsquery` — a parsed search query. `websearch_to_tsquery('english', 'auth
  flow')` gives you something matchable against a tsvector.

### Hybrid retrieval
Run **both** vector ANN and BM25 in parallel, then merge the results. Vector
catches "you said it differently"; BM25 catches "you used the exact name."
Neither alone is enough for code search.

### RRF — Reciprocal Rank Fusion
The merge step. Each retriever returns a ranked list; RRF gives each item a
score of `Σ 1/(k + rank_in_list_i)` across all lists where it appeared, then
re-sorts. `k = 60` by convention. The math:

```
score(item) = sum over all retrievers r:
              if item appears in r at rank i (1-indexed):  1 / (60 + i)
              else:                                         0
```

Items that show up high in *both* lists win. RRF is dead simple, needs no
score calibration (vector distances and BM25 scores aren't comparable
directly), and works almost as well as fancier methods. See
[`packages/core/src/search/rrf.ts`](packages/core/src/search/rrf.ts).

### Query rewriting
Before search, a small `gpt-4o-mini` call rewrites the user's natural-language
question into 1–2 code-shaped variants. "How do we auth users" might become
`["session cookie validation", "auth middleware"]`. Each variant gets its own
embedding + BM25 pass, then RRF fuses everything. Skipped when the query
already looks like an identifier (`UserService.login`).

### Chunking
LLMs can only embed so much text at once, and you want results pointed at
*sections* of files, not whole files. Indox splits each file into ~60-line
windows with overlap. See [`packages/core/src/chunker.ts`](packages/core/src/chunker.ts).
It's heuristic, not AST-based — "AST-aware-ish" in the comments is honest.

### SHA-pinned citations
Every chunk stores a URL like:
```
https://github.com/owner/repo/blob/abc123def…/path/to/file.ts#L10-L25
```
Note `abc123def…` — that's the **commit SHA**, not `main` or `master`. If
main moves, the URL still resolves to the exact bytes Indox indexed. Without
SHA pinning, the agent could quote line 10 of a file that has since been
refactored and confuse everyone.

---

## Database

### pgvector
Postgres extension that adds a `vector` column type and similarity operators
(`<=>` cosine, `<->` Euclidean, `<#>` inner-product). HNSW indexes are a
pgvector feature.

### pg_trgm
Postgres extension for **trigram similarity** (`%` operator, `similarity()`
function). Indox creates it but doesn't currently use it for search — it's
there for future fuzzy-match features. Trigrams = sliding 3-char windows
through a string.

### Generated column
A Postgres column whose value is computed from other columns by an
expression you give the DB. Indox stores `chunk_text` and the DB derives
`chunk_text_tsv` from it — the FTS index stays in sync automatically, no
trigger to maintain.

### pg-boss
A job queue built on Postgres. Uses `LISTEN/NOTIFY` for low-latency
consumption (no polling). The web app calls `enqueueAdapterSync(id)` →
pg-boss writes a row → worker is notified and dequeues. No Redis/RabbitMQ
needed since you already have Postgres.

### Prisma adapter
Prisma 7 connects through pluggable **adapters** instead of bundling a
driver. Indox uses `@prisma/adapter-pg` (standard libpq via `node-postgres`)
so it works against any Postgres host without lock-in.

---

## Security

### AES-256-GCM
The encryption algorithm Indox uses for adapter PATs at rest.
- **AES** — Advanced Encryption Standard, the symmetric cipher.
- **256** — 256-bit key (cracking takes universe-heat-death-scale energy).
- **GCM** — Galois/Counter Mode. Provides **authenticated encryption**: not
  just secrecy, but tamper detection. The output includes a 16-byte auth tag;
  if anyone flips a single bit of ciphertext, decryption fails loudly.

See [`packages/core/src/crypto.ts`](packages/core/src/crypto.ts).

### CSRF — Cross-Site Request Forgery
Attack where a malicious site causes the browser to make a request to your
app *as the logged-in user*, because browsers auto-attach cookies. Defenses:
- **SameSite cookies** — browser refuses to send the cookie on cross-site
  navigations. Indox uses `SameSite=Lax` (better-auth default).
- **Origin/Referer check** — server rejects mutating requests whose `Origin`
  header doesn't match its own. Indox does this in
  [`lib/csrf.ts`](packages/web/lib/csrf.ts).

### Bearer token
`Authorization: Bearer <token>` — anyone "bearing" the token gets in. No
fancy challenge-response. Indox MCP tokens are bearers because that's what
every MCP client supports.

### PAT — Personal Access Token
GitHub's term for a long-lived API token tied to your account. Replaces
basic-auth passwords for API calls.

---

## Protocol / runtime

### MCP — Model Context Protocol
Anthropic's open protocol for AI agents to call external tools. Defines:
- A JSON-RPC schema for `tools/list`, `tools/call`, `prompts/list`, etc.
- Transports: **stdio** (local process pipe) and **Streamable HTTP** (server-sent events over POST).
- Tool schemas declared with JSON Schema (Indox uses Zod and converts).
Implemented by Claude Desktop, Claude Code, Cursor, Windsurf, Zed.

### JSON-RPC
A simple RPC format: `{"jsonrpc": "2.0", "id": 1, "method": "...", "params": {...}}`
→ `{"jsonrpc": "2.0", "id": 1, "result": ...}`. Older than REST, simpler than
gRPC. MCP runs on top of it.

### SSE — Server-Sent Events
Half-duplex streaming over HTTP. Server pushes events, client just listens.
Used by MCP's Streamable HTTP transport to stream tool results. Simpler than
WebSockets when you only need server→client streaming.

### xmcp
The framework Indox uses to build the MCP server. File-based tool routing
(`src/tools/foo.ts` → tool named `foo`), single config produces both stdio
and HTTP transports.

### better-auth
Auth library for Next.js / Node. Handles password hashing (argon2 by
default), session cookies, OAuth flows. Indox uses email/password only.

### Bun
A JavaScript runtime + package manager + bundler, written in Zig. Faster
than Node + npm for both. Indox runs everything (dev, scripts, production)
on Bun.

### Turbopack
Vercel's Rust-based bundler. Replaces Webpack as the default for Next.js
dev. Faster cold start, faster HMR. `next.config.ts` has a `turbopack:`
block in Indox to pin the workspace root.

### Next.js App Router
The newer Next.js routing model where files in `app/` become routes.
Components are **Server Components** by default — they render on the server
and ship zero JS to the browser. `"use client"` opts a file into the
traditional client-side React model. API routes live at `app/api/.../route.ts`.

### proxy.ts (was middleware.ts)
Next.js 16 renamed the `middleware` file convention to `proxy`. Same job:
runs on every request before any route handler, returns a Response (or
forwards). Indox uses it as an edge-level auth gate.

### React Server Components vs Client Components
Server Components run only on the server, can `await` DB queries directly,
ship no JS to the browser. Client Components are the React you already know
— state, effects, browser APIs. The boundary is the `"use client"` directive
at the top of a file.

### Turborepo (we don't use it)
A monorepo build orchestrator (caching, task pipelines). Indox uses **Bun
workspaces** instead — `bun --filter` is enough for four packages.

---

## Where each thing lives

| Concept | File / module |
|---------|---------------|
| Embeddings + vector ANN | [`packages/core/src/search/hybrid.ts`](packages/core/src/search/hybrid.ts) |
| BM25 / FTS query | same file (`bm25Search`) |
| RRF | [`packages/core/src/search/rrf.ts`](packages/core/src/search/rrf.ts) |
| HNSW index | [`packages/core/prisma/migrations/20260515100000_*`](packages/core/prisma/migrations/) |
| Chunker | [`packages/core/src/chunker.ts`](packages/core/src/chunker.ts) |
| Generated tsvector column | [`20260515000000_add_chunk_text_tsv`](packages/core/prisma/migrations/) |
| pg-boss queue | [`packages/core/src/queue.ts`](packages/core/src/queue.ts) |
| AES-256-GCM | [`packages/core/src/crypto.ts`](packages/core/src/crypto.ts) |
| CSRF guard | [`packages/web/lib/csrf.ts`](packages/web/lib/csrf.ts) |
| better-auth setup | [`packages/web/lib/auth.ts`](packages/web/lib/auth.ts) |
| MCP token issuance | [`packages/core/src/mcp-token.ts`](packages/core/src/mcp-token.ts) |
| MCP tool auth | [`packages/mcp/src/auth.ts`](packages/mcp/src/auth.ts) |
| Edge auth gate | [`packages/web/proxy.ts`](packages/web/proxy.ts) |
