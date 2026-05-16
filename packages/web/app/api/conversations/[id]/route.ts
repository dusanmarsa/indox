import {
  getConversation,
  deleteConversation,
} from "@indox/core";
import { requireOwnerKey } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const ownerKey = await requireOwnerKey();
  const conv = await getConversation(id, ownerKey);
  if (!conv) return new Response("Not found", { status: 404 });
  return Response.json(conv);
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) return csrfReject();
  const { id } = await ctx.params;
  const ownerKey = await requireOwnerKey();
  const ok = await deleteConversation(id, ownerKey);
  if (!ok) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 204 });
}
