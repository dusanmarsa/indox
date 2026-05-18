import { NextRequest, NextResponse } from "next/server";
import {
  prisma,
  removeSourceFromAdapter,
  enqueueSourceSync,
  markSourceRunning,
  logger,
} from "@indox/core";
import { requireWorkspace } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

async function authorize(sourceId: string, workspaceId: string): Promise<boolean> {
  const row = await prisma.source.findFirst({
    where: { id: sourceId, adapter: { workspaceId } },
    select: { id: true },
  });
  return !!row;
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return csrfReject();
  const { workspace } = await requireWorkspace();
  const { id } = await ctx.params;
  if (!(await authorize(id, workspace.id))) {
    return NextResponse.json({ error: "source not found" }, { status: 404 });
  }
  const result = await removeSourceFromAdapter(id);
  if (!result) return NextResponse.json({ error: "source not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// Re-index one source — used when the remote content has changed but the
// rest of the adapter is fine.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return csrfReject();
  const { workspace } = await requireWorkspace();
  const { id } = await ctx.params;
  if (!(await authorize(id, workspace.id))) {
    return NextResponse.json({ error: "source not found" }, { status: 404 });
  }
  try {
    const jobId = await enqueueSourceSync(id);
    if (!jobId) {
      // pg-boss dropped the send (most commonly a stale singleton row from a
      // prior version, or a queue config mismatch). Surface it instead of
      // pretending we queued.
      logger.error("api", `enqueueSourceSync returned null for ${id}`);
      return NextResponse.json(
        { error: "queue refused the job — try again in a moment" },
        { status: 503 }
      );
    }
    // Mark "running" immediately so router.refresh() shows the user that the
    // job is in flight instead of leaving the row at "ready" until the worker
    // happens to pick it up (polling interval is 2s). The worker calls
    // markSourceRunning again on pickup — idempotent.
    await markSourceRunning(id).catch((err) =>
      logger.error("api", `markSourceRunning optimistic update failed for ${id}: ${err}`)
    );
    logger.info("api", `enqueued source sync ${id} as job ${jobId}`);
    return NextResponse.json({ ok: true, jobId });
  } catch (err) {
    logger.error("api", `failed to enqueue source sync ${id}: ${err}`);
    return NextResponse.json({ error: "failed to enqueue sync" }, { status: 500 });
  }
}
