import { headers } from "xmcp/headers";
import { resolveMcpToken } from "@indox/core";

// Bearer-token auth for MCP tool handlers. Returns the resolved user id +
// the set of workspace ids this token can act on, or a content-block error
// the model surfaces back to the user.

export type Authed = {
  userId: string;
  // Workspaces this token may search. Empty means the token resolves but no
  // workspaces are currently accessible (e.g. all deleted, scope drift).
  workspaceIds: string[];
};
export type AuthFailure = {
  isError: true;
  content: Array<{ type: "text"; text: string }>;
};

export async function authenticate(): Promise<Authed | AuthFailure> {
  // HTTP transport: bearer comes from the Authorization header.
  // stdio transport: there is no request context, so headers() throws —
  // fall back to INDOX_TOKEN from the process env so local agents
  // (Claude Code/Desktop) can authenticate via their MCP env block.
  let header: string | undefined;
  try {
    const raw = headers()?.authorization;
    header = Array.isArray(raw) ? raw[0] : raw;
  } catch {
    // No HTTP context (stdio). Fall through to env lookup below.
  }
  if (!header && process.env.INDOX_TOKEN) {
    header = `Bearer ${process.env.INDOX_TOKEN}`;
  }
  if (!header || typeof header !== "string" || !header.toLowerCase().startsWith("bearer ")) {
    return fail("Missing bearer token. Get one from /dashboard/mcp.");
  }
  const resolved = await resolveMcpToken(header.slice(7).trim());
  if (!resolved) return fail("Token invalid or rotated — copy a fresh one from /dashboard/mcp.");
  return { userId: resolved.userId, workspaceIds: resolved.workspaceIds };
}

export function isAuthFailure(x: Authed | AuthFailure): x is AuthFailure {
  return (x as AuthFailure).isError === true;
}

function fail(message: string): AuthFailure {
  return { isError: true, content: [{ type: "text", text: message }] };
}
