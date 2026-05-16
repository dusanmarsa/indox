"use client";

import { useState, useMemo } from "react";

// Token + rotate button + copy-pasteable snippets for the major clients.
// Token is rendered masked by default; the MCP URL embeds the token as a
// query string so clients that don't pass custom headers (some Cursor
// versions, plain curl tests) still authenticate.

const CLIENTS = [
  { id: "cursor", label: "Cursor / generic JSON" },
  { id: "claude-desktop", label: "Claude Desktop" },
  { id: "claude-code", label: "Claude Code (CLI)" },
] as const;
type ClientId = (typeof CLIENTS)[number]["id"];

export default function McpTokenPanel({
  initialToken,
  mcpUrl,
}: {
  initialToken: string;
  mcpUrl: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [revealed, setRevealed] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [client, setClient] = useState<ClientId>("cursor");

  const fullUrl = useMemo(() => `${mcpUrl}?token=${token}`, [mcpUrl, token]);

  const masked =
    token.slice(0, 8) + "•".repeat(Math.max(token.length - 12, 4)) + token.slice(-4);

  const snippet = useMemo(() => snippetFor(client, fullUrl), [client, fullUrl]);

  const rotate = async () => {
    if (!confirm("Rotate token? Any agents currently using the old token will lose access until reconfigured.")) {
      return;
    }
    setRotating(true);
    try {
      const res = await fetch("/api/mcp-token", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "rotate failed");
      setToken(json.token);
      setRevealed(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setRotating(false);
    }
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="space-y-8">
      {/* ─── Token ─────────────────────────────────────────────────────── */}
      <section className="border border-(--indox-border)">
        <div className="flex items-center justify-between border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[13px]">
          <span className="text-[13px] font-medium">Bearer token</span>
          <div className="flex gap-2">
            <button
              onClick={() => setRevealed((v) => !v)}
              className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-foreground"
            >
              {revealed ? "hide" : "reveal"}
            </button>
            <span className="text-(--indox-dim)">·</span>
            <button
              onClick={() => copy(token)}
              className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-foreground"
            >
              copy
            </button>
            <span className="text-(--indox-dim)">·</span>
            <button
              onClick={rotate}
              disabled={rotating}
              className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-[#8a6a1e] disabled:opacity-40"
            >
              {rotating ? "rotating…" : "rotate"}
            </button>
          </div>
        </div>
        <div className="px-[18px] py-[14px] font-mono text-[12px] text-foreground break-all">
          {revealed ? token : masked}
        </div>
        <div className="border-t border-(--indox-border) bg-(--indox-surface)/40 px-[18px] py-[10px] font-mono text-[11px] text-(--indox-muted)">
          The token authorises tool calls as you. Treat it like a password —
          anyone who has it can read your indexed sources.
        </div>
      </section>

      {/* ─── Connection snippet ────────────────────────────────────────── */}
      <section className="border border-(--indox-border)">
        <div className="flex items-center justify-between border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[13px]">
          <span className="text-[13px] font-medium">Client config</span>
          <div className="flex gap-2">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                onClick={() => setClient(c.id)}
                className={`font-mono text-[11px] transition-colors ${
                  client === c.id ? "text-foreground" : "text-(--indox-muted) hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <pre className="overflow-x-auto px-[18px] py-[14px] font-mono text-[11.5px] text-foreground">
          {snippet}
        </pre>
        <div className="border-t border-(--indox-border) bg-(--indox-surface)/40 px-[18px] py-[10px] flex items-center justify-between">
          <span className="font-mono text-[11px] text-(--indox-muted)">
            {hintFor(client)}
          </span>
          <button
            onClick={() => copy(snippet)}
            className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-foreground"
          >
            copy
          </button>
        </div>
      </section>
    </div>
  );
}

function snippetFor(client: ClientId, url: string): string {
  switch (client) {
    case "cursor":
      return JSON.stringify(
        {
          mcpServers: {
            indox: { url },
          },
        },
        null,
        2,
      );
    case "claude-desktop":
      // Claude Desktop only speaks stdio — it bridges to HTTP via mcp-remote.
      return JSON.stringify(
        {
          mcpServers: {
            indox: {
              command: "npx",
              args: ["mcp-remote", url],
            },
          },
        },
        null,
        2,
      );
    case "claude-code":
      // The CLI registers via a single command, no JSON file editing.
      return `claude mcp add --transport http indox "${url}"`;
  }
}

function hintFor(client: ClientId): string {
  switch (client) {
    case "cursor":
      return "Paste into Cursor → Settings → MCP, then restart Cursor.";
    case "claude-desktop":
      return "Paste into claude_desktop_config.json, then restart Claude.";
    case "claude-code":
      return "Run in your terminal once; verify with `claude mcp list`.";
  }
}
