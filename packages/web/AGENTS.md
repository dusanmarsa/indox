# @indox/web — agent guide

Next.js 16 app (App Router, React 19). Four surfaces in one package:

1. **Landing page** — marketing site at `/`
2. **Login** — email/password sign-in/sign-up at `/login`
3. **Dashboard** — adapter, source, MCP-token management at `/dashboard/*`
4. **Chat** — live Q&A against the user's indexed sources at `/chat`

> Next.js 16 has breaking changes from the docs in your training data.
> Heed deprecation notices. The renamed `middleware` → `proxy` convention is one
> of them — see `proxy.ts`.

---

## Tech stack

| Concern       | Choice                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Framework     | Next.js 16, App Router, React 19                                                                 |
| UI            | shadcn/ui (`radix-luma`), Tailwind v4 (CSS variables in `app/globals.css`), lucide-react, motion |
| Markdown      | Streamdown + plugins (math, mermaid, CJK)                                                        |
| AI SDK        | `ai`, `@ai-sdk/openai`, `@ai-sdk/react`                                                          |
| Database      | `@indox/core` (Prisma + pg adapter) — never instantiate a second client                          |
| Auth          | [better-auth](https://better-auth.com) — email/password                                          |
| Rate limiting | Upstash Redis (no-op when env unset)                                                             |
| GitHub API    | `@octokit/rest`                                                                                  |

---

## Project layout

```
app/
  layout.tsx                  root layout + ThemeProvider
  page.tsx                    landing
  globals.css                 Tailwind v4 + CSS variables
  login/page.tsx              email/password form
  chat/                       chat UI (client components)
  dashboard/
    layout.tsx                sidebar + nav shell
    page.tsx                  overview
    adapters/                 adapter list + per-adapter management
    sources/                  source list
    mcp/                      bearer-token + connection snippet
    queries / logs / settings
  api/
    auth/[...all]/route.ts    better-auth catch-all
    chat/route.ts             AI SDK streamText, searchCode + listSources tools
    conversations/            create / list / get / delete
    adapters/                 CRUD + sync + per-adapter repo browse
    sources/                  delete / re-index
    mcp-token/route.ts        GET (read or create), POST (rotate)
components/
  auth/                       login form
  chat/                       chat UI
  dashboard/                  dashboard widgets
  landing/                    landing sections
  ui/                         shadcn primitives (use shadcn CLI to update)
lib/
  auth.ts                     better-auth instance
  auth-client.ts              browser-side signIn/signUp/signOut
  session.ts                  getUser, requireUser, requireOwnerKey
  csrf.ts                     same-origin guard for mutating routes
  ratelimit.ts                Upstash + rateLimitKey
  dashboard-data.ts           server-side Prisma loaders for the dashboard
  utils.ts                    cn() + small shared helpers
proxy.ts                      edge auth gate
```

---

## Path alias

`@/*` → `packages/web/` (`tsconfig.json`).

```ts
import { cn } from "@/lib/utils";
import { requireOwnerKey } from "@/lib/session";
```

---

## Typed routes

`typedRoutes: true` (`next.config.ts`). Use typed `href`s for `<Link>` and
`router.push`. Cast a runtime string with `as Route` when unavoidable
(e.g. the `next` query param in `/login`).

---

## Server vs client components

Default to **Server Components**. Add `"use client"` only for:

- React state / effects
- Browser APIs
- AI SDK's `useChat`

Data fetching and Prisma queries live in Server Components or route handlers.

---

## Auth

`lib/auth.ts` configures better-auth (email/password, optional
`INDOX_ALLOWED_EMAILS` allowlist). The catch-all handler lives at
`app/api/auth/[...all]/route.ts`.

`lib/session.ts` is the only place handlers/components should reach for the
current user:

- `getUser()` — nullable
- `requireUser()` / `requireOwnerKey()` — throws `UnauthorizedError`
- `getOwnerKey()` — nullable, same value as `requireOwnerKey()`

`proxy.ts` gates whole route groups by **session-cookie presence** (cheap edge
check). Full DB validation still happens via `getUser()` in the downstream
handler — proxy is "fast reject obviously-unauthed" only.

---

## CSRF

Every mutating route (POST/DELETE/PUT) starts with:

```ts
import { isSameOrigin, csrfReject } from "@/lib/csrf";
if (!isSameOrigin(req)) return csrfReject();
```

Extra trusted origins go in `CSRF_ALLOWED_ORIGINS` (comma-separated).

---

## Chat route — invariants to preserve

`app/api/chat/route.ts`:

- **CSRF check** runs first.
- **Rate limit** keyed on the session id (`rateLimitKey(req, ownerKey)`).
- **`stripOrphanedToolCalls`** must run before `convertToModelMessages` — OpenAI
  rejects `AI_MissingToolResultsError` when a user cancels mid-tool.
- **`stepCountIs(8)`** caps tool-call loops.
- **Owner floor**: `ownerSourceIds` is passed to every `hybridSearch` call.
  Without it, an empty `sourceIds` would search the global embeddings table.
- **Strict grounding** in the system prompt — don't weaken the "not found is OK"
  rules or the citation contract.
- Model: `gpt-4o-mini` (hardcoded).

---

## shadcn

Components in `components/ui/`. Don't hand-edit — use the CLI:

```bash
bunx shadcn@latest add <component-name>
bunx shadcn@latest add @ai-elements/<name>   # AI elements registry
```

Config: `components.json` (style `radix-luma`, base color `neutral`).

---

## Tailwind v4

Configured via `@theme` in `app/globals.css`. There is no `tailwind.config.js`.
Extend by adding CSS variables.

---

## `next.config.ts` constraints

- `serverExternalPackages: ["pg-boss", "pg"]` — Turbopack can't bundle their
  native bindings. Add other native packages here if you introduce them.
- `turbopack.root` pinned two levels up (monorepo root) so Turbopack doesn't
  pick up a stray lockfile in `$HOME`.
- `images.remotePatterns` — GitHub avatar URLs are currently the only allowed
  remote image host.

---

## Dev

```bash
bun --filter @indox/web dev   # http://localhost:3000
```

Hot reload covers web. `@indox/core` source edits hot-reload through bun
workspace links; no rebuild needed.
