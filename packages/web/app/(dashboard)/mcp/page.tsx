import { getOrCreatePersonalToken } from "@indox/core";
import { PageHead } from "@indox/ui";
import { requireUser } from "@/lib/session";
import McpTokenPanel from "@/components/dashboard/McpTokenPanel";

export const dynamic = "force-dynamic";

// The MCP server lives on its own subdomain in production. Configurable so
// self-hosters can point at their own deployment without editing source.
const MCP_URL = process.env.MCP_PUBLIC_URL ?? "https://mcp-production-4dae.up.railway.app/mcp";

export default async function McpPage() {
  const user = await requireUser();
  const token = await getOrCreatePersonalToken(user.id);

  return (
    <div>
      <PageHead
        title="MCP"
        subtitle="Connect Cursor, Claude, or any MCP-aware agent to your indexed sources."
      />

      <McpTokenPanel initialToken={token} mcpUrl={MCP_URL} />
    </div>
  );
}
