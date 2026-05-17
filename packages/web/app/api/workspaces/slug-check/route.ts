import { NextResponse } from "next/server";
import { prisma, validateSlug } from "@indox/core";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Read-only slug availability probe powered by the settings form. Returns
// `{ ok }` plus, when not ok, a human-readable reason. Auth-gated to keep
// the live workspace slug namespace from being enumerable by anonymous
// clients.
export async function GET(req: Request) {
  await requireUser();
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
  // `excludeId` lets the settings page mark "this is my current slug" as
  // available even though it's taken by the workspace being edited.
  const excludeId = url.searchParams.get("excludeId") ?? null;

  if (!slug) {
    return NextResponse.json({ ok: false, reason: "Slug is required." });
  }
  const v = validateSlug(slug);
  if (!v.ok) {
    return NextResponse.json({ ok: false, reason: v.reason });
  }
  const existing = await prisma.workspace.findFirst({
    where: { slug },
    select: { id: true },
  });
  if (existing && existing.id !== excludeId) {
    return NextResponse.json({ ok: false, reason: "That slug is already taken." });
  }
  return NextResponse.json({ ok: true });
}
