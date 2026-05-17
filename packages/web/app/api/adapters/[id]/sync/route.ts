import { NextRequest, NextResponse } from "next/server";
import { prisma, enqueueAdapterSync } from "@indox/core";
import { requireWorkspace } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return csrfReject();
  const { workspace } = await requireWorkspace();
  const { id } = await params;
  const adapter = await prisma.adapter.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!adapter) return NextResponse.json({ error: "adapter not found" }, { status: 404 });
  await enqueueAdapterSync(id);
  return NextResponse.json({ ok: true });
}
