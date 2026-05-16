# @indox/mcp — agent guide

MCP server built with [xmcp](https://xmcp.dev). Exposes Indox's hybrid search
to MCP-compatible agents over **HTTP** (per-user bearer auth) and **stdio**
(local agents) from the same codebase.

---

## Transports

Configured in `xmcp.config.ts`:

| Transport | Entry | Port |
|-----------|-------|------|
| stdio | `bun ./dist/stdio.js` | stdin/stdout |
| HTTP | `bun ./dist/http.js`  | `POST /mcp` on `$PORT` (default 3030) |

A single `xmcp build` produces both. `paths.prompts` and `paths.resources` are
disabled — only tools are active.

> The HTTP port is **baked at build time** (`process.env.PORT` is read when
> the config compiles). On Railway, set the service `PORT` env var so the
> baked value matches what Railway routes to. Default 3030 in local dev.

---

## Auth

Every tool calls `authenticate()` from [`src/auth.ts`](src/auth.ts) first.
That helper:

1. Reads `Authorization: Bearer <token>` via xmcp's `headers()`.
2. Resolves the token through `resolveMcpToken` (`@indox/core`).
3. Returns `{ userId }` on success or an `isError: true` content block.

The [`middleware.ts`](src/middleware.ts) auto-registers an Express middleware
that promotes `?token=…` URL params to a Bearer header — so URL-only clients
(Cursor's short form, curl) hit the same auth path.

Every tool then scopes its core calls by `userId` (e.g. passes
`ownerKey: userId` to `listSources` / `hybridSearch`). **Never** call core
helpers without the owner scope from this package.

---

## Tool file conventions

xmcp auto-registers tools by **file-based routing** from `src/tools/`. Each
file exports:

| Export | Type | Notes |
|--------|------|-------|
| `schema` | `Record<string, ZodType>` | Input params |
| `metadata` | `ToolMetadata` | `name` (snake_case), `description`, `annotations` |
| `default` | `async function` | Handler receiving `InferSchema<typeof schema>` |

```ts
import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";
import { authenticate, isAuthFailure } from "../auth";
import { listSources } from "@indox/core";

export const schema = {
  query: z.string().describe("..."),
};

export const metadata: ToolMetadata = {
  name: "my_tool",
  description: "...",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
};

export default async function myTool({ query }: InferSchema<typeof schema>) {
  const auth = await authenticate();
  if (isAuthFailure(auth)) return auth;
  // …scope every core call by auth.userId
  return { content: [{ type: "text" as const, text: "…" }] };
}
```

---

## Existing tools

- **`search_code`** — owner-scoped `hybridSearch`. Returns chunks with
  SHA-pinned `url` fields; cite verbatim.
- **`list_indexed_sources`** — owner-scoped `listSources` filtered by status
  (`ready` | `running` | `failed` | `idle` | `any`).

---

## Environment

| Variable            | Purpose |
|---------------------|---------|
| `DATABASE_URL`      | Prisma connection (via `@indox/core`) |
| `OPENAI_API_KEY`    | Embeddings + optional query rewrite |
| `ADAPTER_TOKEN_KEY` | Required by core's crypto module at import time |
| `PORT`              | Bound port (Railway sets this; defaults to 3030 locally) |

---

## Dev

```bash
bun --filter @indox/mcp build      # produces dist/{stdio,http}.js
bun --filter @indox/mcp dev        # xmcp dev server with hot reload

bun packages/mcp/dist/stdio.js     # run the built stdio server
PORT=3030 bun packages/mcp/dist/http.js
```

Smoke-test the HTTP server:
```bash
curl -X POST http://localhost:3030/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer mcp_..." \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## Adding a new tool

1. Create `src/tools/<kebab-name>.ts` with the three required exports above.
2. Call `authenticate()` first; scope all core calls by `auth.userId`.
3. `bun --filter @indox/mcp build` — xmcp picks up the file by convention.
4. Test with `mcp-inspector` or a real agent config.
