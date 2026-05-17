import { createConversation, listConversations } from "@indox/core";
import { requireWorkspace } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export async function GET() {
  const { user, workspace } = await requireWorkspace();
  const conversations = await listConversations({
    workspaceId: workspace.id,
    userId: user.id,
  });
  return Response.json({ conversations });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return csrfReject();
  const { user, workspace } = await requireWorkspace();
  const conv = await createConversation({
    workspaceId: workspace.id,
    userId: user.id,
  });
  return Response.json({ conversation: conv });
}
