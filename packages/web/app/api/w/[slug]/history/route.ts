import { getWorkspaceBySlug, getAnonConversation } from "@indox/core";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const sessionId = new URL(req.url).searchParams.get("sessionId") ?? "";

  if (!UUID_RE.test(sessionId)) {
    return new Response("Invalid sessionId", { status: 400 });
  }

  const ws = await getWorkspaceBySlug(slug);
  if (!ws || !ws.isPublic) {
    return new Response("Not found", { status: 404 });
  }

  const conv = await getAnonConversation({ workspaceId: ws.id, anonSessionId: sessionId });
  return Response.json({ messages: conv?.messages ?? [] });
}
