import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteWorkspace,
  getOwnedWorkspace,
  getWorkspaceSettings,
  updateWorkspaceSettings,
  getWorkspaceUsageToday,
} from "@indox/core";
import { requireUser } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const owned = await getOwnedWorkspace(id, user.id);
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const [settings, usageToday] = await Promise.all([
    getWorkspaceSettings(id),
    getWorkspaceUsageToday(id),
  ]);
  return NextResponse.json({ settings, usageToday });
}

// Same shape as core's UpdateWorkspaceSettings. zod here is just a runtime
// guard against junk payloads; field-level validation happens in core.
const patchSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  slug: z.string().min(3).max(48).optional(),
  isPublic: z.boolean().optional(),
  // `null` clears the stored key; "" is treated as "no change" by core.
  openaiApiKey: z.union([z.string(), z.null()]).optional(),
  model: z.string().optional(),
  dailyCallLimit: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) return csrfReject();
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const result = await updateWorkspaceSettings(id, user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason, field: result.field },
      { status: 400 },
    );
  }
  return NextResponse.json({ settings: result.settings });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) return csrfReject();
  const user = await requireUser();
  const { id } = await ctx.params;
  const result = await deleteWorkspace(id, user.id);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true });
}
