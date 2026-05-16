import {
  createConversation,
  listConversations,
} from "@indox/core";
import { requireOwnerKey } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export async function GET() {
  const ownerKey = await requireOwnerKey();
  const conversations = await listConversations(ownerKey);
  return Response.json({ conversations });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return csrfReject();
  const ownerKey = await requireOwnerKey();
  const conv = await createConversation(ownerKey);
  return Response.json({ conversation: conv });
}
