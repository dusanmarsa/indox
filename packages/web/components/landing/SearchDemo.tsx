"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Route } from "next";

// Real repos we know are already indexed in the demo database. Clicking a
// chip drops the user straight into the chat for that repo — no mocked
// "search simulation," just the actual product.
const STARTERS: { label: string; href: string }[] = [
  { label: "vercel/next.js", href: "/vercel" },
  { label: "rombohq/tailwindcss-motion", href: "/rombohq/tailwindcss-motion" },
  { label: "dusanmarsa/validvision", href: "/dusanmarsa/validvision" },
  { label: "dusanmarsa/dm.cz", href: "/dusanmarsa/dm.cz" },
];

/**
 * Routes user input to /[user] or /[user]/[repo]. Accepts:
 *   - `octocat`                  → /octocat
 *   - `octocat/hello-world`      → /octocat/hello-world
 *   - `@octocat`                 → /octocat
 *   - `https://github.com/...`   → strip the host, route the path
 */
function parseTarget(raw: string): string | null {
  const trimmed = raw.trim().replace(/^@/, "").replace(/^https?:\/\/github\.com\//, "");
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/\/+$/, "");
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return `/${encodeURIComponent(parts[0])}`;
  return `/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`;
}

export function SearchDemo() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);

  const submit = (raw: string) => {
    const target = parseTarget(raw);
    if (!target) return;
    setPending(true);
    // typedRoutes wants RouteImpl, but /[user] and /[user]/[repo] are dynamic
    // — the target is computed from arbitrary user input so we hand the
    // router a runtime string and assert it as a Route.
    router.push(target as Route);
  };

  return (
    <div className="max-w-[660px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(query);
        }}
        className="flex border border-[var(--indox-border)] transition-colors focus-within:border-[var(--indox-muted)]"
      >
        <span
          className="shrink-0 border-r border-[var(--indox-border)] bg-[var(--indox-surface)] px-3.5 py-3 font-mono text-[12px] text-[var(--indox-dim)]"
          aria-hidden
        >
          $ indox try
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="paste a GitHub URL or owner/repo…"
          autoComplete="off"
          spellCheck={false}
          disabled={pending}
          className="min-w-0 flex-1 bg-transparent px-3.5 py-3 font-mono text-[13px] text-[var(--indox-text)] caret-[var(--indox-accent)] outline-none placeholder:text-[var(--indox-dim)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending || !query.trim()}
          className="shrink-0 border-l border-[var(--indox-border)] px-4.5 py-3 font-mono text-[12px] text-[var(--indox-muted)] transition-colors hover:bg-[var(--indox-surface)] hover:text-[var(--indox-text)] disabled:cursor-default disabled:text-[var(--indox-dim)] disabled:hover:bg-transparent"
        >
          {pending ? "…" : "open ↵"}
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5 pt-2.5">
        {STARTERS.map((s) => (
          <a
            key={s.href}
            href={s.href}
            className="border border-[var(--indox-border)] px-2.5 py-1 font-mono text-[11px] text-[var(--indox-muted)] transition-colors hover:border-[var(--indox-muted)] hover:text-[var(--indox-text)]"
          >
            {s.label}
          </a>
        ))}
      </div>

      <p className="pt-4 font-mono text-[11px] text-[var(--indox-dim)]">
        Indox indexes the repo (or finds it cached) and drops you into a chat
        against the real engine. Same retrieval the MCP server uses.
      </p>
    </div>
  );
}
