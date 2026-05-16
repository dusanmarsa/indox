import { NextRequest, NextResponse } from "next/server";
import {
  prisma,
  removeSourceFromAdapter,
  enqueueSourceSync,
  logger,
} from "@indox/core";
import { requireOwnerKey } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

async function authorize(sourceId: string, ownerKey: string): Promise<boolean> {
  const row = await prisma.source.findFirst({
    where: { id: sourceId, adapter: { ownerKey } },
    select: { id: true },
  });
  return !!row;
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) return csrfReject();
  const ownerKey = await requireOwnerKey();
  const { id } = await ctx.params;
  if (!(await authorize(id, ownerKey))) {
    return NextResponse.json({ error: "source not found" }, { status: 404 });
  }
  const result = await removeSourceFromAdapter(id);
  if (!result) return NextResponse.json({ error: "source not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// Re-index one source — used when the remote content has changed but the
// rest of the adapter is fine.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) return csrfReject();
  const ownerKey = await requireOwnerKey();
  const { id } = await ctx.params;
  if (!(await authorize(id, ownerKey))) {
    return NextResponse.json({ error: "source not found" }, { status: 404 });
  }
  enqueueSourceSync(id).catch((err) =>
    logger.error("api", `failed to enqueue source sync ${id}: ${err}`),
  );
  return NextResponse.json({ ok: true });
}
