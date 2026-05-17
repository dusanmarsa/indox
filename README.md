# Indox

> Search every source your agent touches.

Indox indexes your code and docs once, runs hybrid retrieval (vector + BM25 + RRF)
across all of them at once, and serves the results as an MCP server. Agents get
cross-source semantic search with SHA-pinned citations they can quote verbatim.

Self-hostable, source-available ([FSL-1.1-Apache-2.0](./LICENSE)).

---

## What works today (v0.1)

- **Indexing pipeline** — shape-aware chunker (tree-sitter for code, heading
  sections for prose), OpenAI embeddings, pgvector storage (`halfvec(3072)`
  for full-dimension `text-embedding-3-large`)
- **Hybrid retrieval** — vector ANN + Postgres FTS + path-token boost, fused
  via reciprocal rank fusion
- **SHA-pinned citations** — every chunk carries the exact blob URL + line range
- **Source connectors** — GitHub (any repo your PAT can read) and Notion
  (any page tree your integration can see)
- **MCP server (HTTP + stdio)** — `search_code`, `list_indexed_sources`,
  per-user bearer auth
- **Web UI** — sign in, manage adapters, chat against your indexed sources
- **Auth** — email/password via [better-auth](https://better-auth.com),
  optional allowlist

Connectors for GitLab, Confluence, and local filesystems are planned for v0.2.

---

## Quick start (local dev)

Requires:
- Bun 1.3+ (`curl -fsSL https://bun.sh/install | bash`)
- Postgres with `pgvector` + `pg_trgm` (`CREATE EXTENSION vector; CREATE EXTENSION pg_trgm;`)
- OpenAI API key

```bash
git clone https://github.com/dusanmarsa/indox.git
cd indox
bun install

# Environment
# See [`.env.example`](.env.example)

# Apply schema
bun run db:migrate

# Boot the dev servers (web on :3000, worker watches the queue)
bun run dev
```

Open http://localhost:3000, sign up, click **Adapters → Add adapter** and paste
a GitHub PAT. Once a repo finishes indexing it shows up in `/chat` and on the
MCP endpoint.

---

## Architecture

Three packages, one shared database:

```
packages/
  core/       @indox/core   — engine: chunker, embeddings, hybrid search, Prisma
  web/        @indox/web    — Next.js app: dashboard, chat, auth, REST API
  worker/     @indox/worker — pg-boss consumer: runs sync/index jobs
  mcp/        @indox/mcp    — xmcp HTTP server: per-user-scoped MCP tools
```

`core` knows nothing about HTTP. Every other package depends on it and talks
to the same Postgres directly.

---

## Connecting an agent

Get your bearer token from **/dashboard/mcp** (visible after sign-in).

**Cursor / Windsurf / generic JSON config:**
```json
{
  "mcpServers": {
    "indox": { "url": "https://YOUR-MCP-HOST/mcp?token=mcp_..." }
  }
}
```

**Claude Code:**
```bash
claude mcp add --transport http indox "https://YOUR-MCP-HOST/mcp?token=mcp_..."
```

**Claude Desktop** (no native HTTP support; bridges through `mcp-remote`):
```json
{
  "mcpServers": {
    "indox": {
      "command": "npx",
      "args": ["mcp-remote", "https://YOUR-MCP-HOST/mcp?token=mcp_..."]
    }
  }
}
```

The token resolves to your user; every tool call is scoped to your indexed
sources only.

---

## Deploying

Each service has its own Railway config:

- [`packages/web/railway.toml`](packages/web/railway.toml) — Next.js + REST API, runs `prisma migrate deploy` pre-deploy
- [`packages/worker/railway.toml`](packages/worker/railway.toml) — pg-boss consumer, no public domain
- [`packages/mcp/railway.toml`](packages/mcp/railway.toml) — MCP HTTP server, public, auth via bearer token

Point each Railway service's **Config Path** at the matching TOML. All three
share Postgres + OpenAI credentials via Railway shared variables; `MCP_PUBLIC_URL`
on the web service feeds the `/dashboard/mcp` connection snippet.

Full env reference: [`.env.example`](.env.example).

---

## Roadmap

Loose, in rough priority order. Nothing here is a promise.

- More source connectors — GitLab, Confluence, local filesystem
- A published Docker image so self-hosters don't need to clone the repo
- Faster incremental sync (today every change re-indexes the source)
- Better per-source permissions (today: the user who indexed it can read it)
- An option to run embeddings locally instead of through OpenAI

Anything beyond that depends on what people who actually run Indox ask for.

---

## License

[FSL-1.1-Apache-2.0](./LICENSE). Functional Source License: you can use, modify,
and self-host freely (including commercially inside your org). The only thing you
can't do is offer a competing hosted Indox-as-a-service. Each release auto-converts
to Apache 2.0 two years after publication.

No telemetry. No callbacks home. What your agents search stays in your database.
