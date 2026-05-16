import { getOrCreateMcpToken } from "@indox/core";
import { requireOwnerKey } from "@/lib/session";
import McpTokenPanel from "@/components/dashboard/McpTokenPanel";

export const dynamic = "force-dynamic";

// The MCP server lives on its own subdomain in production. Configurable so
// self-hosters can point at their own deployment without editing source.
const MCP_URL =
  process.env.MCP_PUBLIC_URL ??
  "https://mcp-production-4dae.up.railway.app/mcp";

export default async function McpPage() {
  const userId = await requireOwnerKey();
  const token = await getOrCreateMcpToken(userId);

  return (
    <div>
      <div className="mb-9">
        <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">MCP</h1>
        <p className="font-mono text-[13px] text-(--indox-muted)">
          Connect Cursor, Claude, or any MCP-aware agent to your indexed sources.
        </p>
      </div>

      <McpTokenPanel initialToken={token} mcpUrl={MCP_URL} />
    </div>
  );
}
