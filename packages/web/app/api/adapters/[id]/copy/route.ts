import { NextResponse } from "next/server";
import { z } from "zod";
import { copyAdapterToWorkspace, enqueueAdapterSync, logger } from "@indox/core";
import { requireUser } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

const schema = z.object({ targetWorkspaceId: z.string().min(1) });

// Clone an adapter (credentials + scope) into another workspace owned by
// the same user. The new adapter starts in "idle" status; we auto-enqueue
// a sync so the user doesn't have to remember to click sync afterwards.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return csrfReject();
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const result = await copyAdapterToWorkspace({
    adapterId: id,
    targetWorkspaceId: parsed.data.targetWorkspaceId,
    userId: user.id,
  });
  if (!result.ok) {
    const status = result.reason === "source_not_found" ? 404 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }

  enqueueAdapterSync(result.adapterId).catch((err) =>
    logger.error("api", `failed to enqueue sync for copied adapter ${result.adapterId}: ${err}`)
  );
  return NextResponse.json({ adapterId: result.adapterId });
}
