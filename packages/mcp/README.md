# @indox/mcp

MCP server that exposes Indox's indexed corpus to any MCP-aware agent
(Claude Code, Claude Desktop, Cursor, etc.). Built on
[xmcp](https://xmcp.dev) — file-based tool routing with stdio + HTTP
transports from the same codebase.

## Tools

- **`list_indexed_repos`** — discover which repositories are currently
  indexed and searchable.
- **`search_code`** — hybrid retrieval (vector + BM25 + RRF) across a
  single indexed repository. Returns chunks with SHA-pinned GitHub URLs.

More tools land here as `@indox/core` grows (cross-repo search, docs,
file fetch, etc.). Each is a single `.ts` file in `src/tools/`.

## Build & run

> The MCP server needs Node 20+ (24 is pinned via `.nvmrc`). Bun is fine
> for source-level work but the bundled output runs on Node.

```bash
# from repo root, build both stdio and HTTP entry points
bun --filter @indox/mcp build

# stdio (for local agents like Claude Code)
node packages/mcp/dist/stdio.js

# HTTP (for remote/self-hosted Indox deployments)
node packages/mcp/dist/http.js   # listens on :3030/mcp
```

Local dev with hot reload:

```bash
bun --filter @indox/mcp dev
```

## Register with Claude Code

From the root of this repo:

```bash
claude mcp add indox -- node "$(pwd)/packages/mcp/dist/stdio.js"
```

Then in a Claude Code session, the tools appear under the `indox` server.
Try:

> List my indexed repos, then search `dusanmarsa/dm.cz` for `motion`.

## Register with Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "indox": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/indox/packages/mcp/dist/stdio.js"]
    }
  }
}
```

Restart Claude Desktop. The tools will show under the hammer icon.

## Architecture

```
@indox/mcp (this package, xmcp)
        ↓ imports
@indox/core (engine: hybridSearch, repo-index, db client)
        ↓ queries
   Postgres + pgvector
```

The MCP server is a **sibling** of `@indox/web`, not a child. Both
import `@indox/core` and talk to the database directly. The web app does
not need to be running for MCP to work, and vice versa.

## Environment

The MCP process reads `DATABASE_URL` and `OPENAI_API_KEY` from `.env`.
That file is symlinked from `packages/web/.env` so the engine sees the
same secrets in dev. For self-hosted deployments, set env vars directly
or mount your own `.env` next to `dist/stdio.js`.
