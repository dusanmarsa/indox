import { getConversation, deleteConversation } from "@indox/core";
import { requireWorkspace } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user, workspace } = await requireWorkspace();
  const conv = await getConversation(id, { workspaceId: workspace.id, userId: user.id });
  if (!conv) return new Response("Not found", { status: 404 });
  return Response.json(conv);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return csrfReject();
  const { id } = await ctx.params;
  const { user, workspace } = await requireWorkspace();
  const ok = await deleteConversation(id, { workspaceId: workspace.id, userId: user.id });
  if (!ok) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 204 });
}
