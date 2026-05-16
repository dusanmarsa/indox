import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@indox/core";
import { requireOwnerKey } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return csrfReject();
  const ownerKey = await requireOwnerKey();
  const { id } = await params;
  // deleteMany lets not-found and not-owned both return count=0, so the
  // 404 below doesn't disclose which one it was.
  const r = await prisma.adapter.deleteMany({ where: { id, ownerKey } });
  if (r.count === 0) {
    return NextResponse.json({ error: "adapter not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
