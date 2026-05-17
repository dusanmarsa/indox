"use client";

import { useState, useMemo } from "react";
import { CodeCard, IconButton, Input, Label, SegmentedControl } from "@indox/ui";
import { RefreshCw } from "lucide-react";

// Token + rotate button + copy-pasteable snippets for the major clients.
// The MCP URL embeds the token as a query string so clients that don't pass
// custom headers (some Cursor versions, plain curl tests) still authenticate.

const CLIENTS = [
  { value: "cursor", label: "Cursor" },
  { value: "claude-desktop", label: "Claude Desktop" },
  { value: "claude-code", label: "Claude Code" },
] as const;
type ClientId = (typeof CLIENTS)[number]["value"];

export default function McpTokenPanel({
  initialToken,
  mcpUrl,
}: {
  initialToken: string;
  mcpUrl: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [rotating, setRotating] = useState(false);
  const [client, setClient] = useState<ClientId>("cursor");

  const fullUrl = useMemo(() => `${mcpUrl}?token=${token}`, [mcpUrl, token]);
  const snippet = useMemo(() => snippetFor(client, fullUrl), [client, fullUrl]);

  const rotate = async () => {
    if (
      !confirm(
        "Rotate token? Any agents currently using the old token will lose access until reconfigured."
      )
    ) {
      return;
    }
    setRotating(true);
    try {
      const res = await fetch("/api/mcp-token", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "rotate failed");
      setToken(json.token);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-[13px] font-medium tracking-[-0.01em] text-ink">Bearer token</span>
          <IconButton
            onClick={rotate}
            disabled={rotating}
            aria-label={rotating ? "Rotating token" : "Rotate token"}
            title="Rotate token"
          >
            <RefreshCw className={`size-3.5 ${rotating ? "animate-spin" : ""}`} />
          </IconButton>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4">
          <Label htmlFor="mcp-token">Token</Label>
          <Input
            id="mcp-token"
            type="password"
            value={token}
            readOnly
            revealable
            copyable
            className="font-mono text-[12.5px]"
          />
        </div>
        <p className="border-t border-border bg-overlay-tint px-4 py-2.5 font-mono text-[11px] text-ink-2">
          The token authorises tool calls as you. Treat it like a password — anyone who has it can
          read your indexed sources.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[13px] font-medium tracking-[-0.01em] text-ink">Client config</span>
          <SegmentedControl
            value={client}
            onValueChange={(v) => setClient(v as ClientId)}
            options={CLIENTS.map((c) => ({ value: c.value, label: c.label }))}
            className="self-start sm:self-auto"
          />
        </div>
        <CodeCard copyValue={snippet}>{snippet}</CodeCard>
        <p className="font-mono text-[11px] text-ink-3">{hintFor(client)}</p>
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
        2
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
        2
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
