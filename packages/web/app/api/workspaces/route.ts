import { NextResponse } from "next/server";
import { z } from "zod";
import { createWorkspace, listUserWorkspaces } from "@indox/core";
import { requireUser } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  const workspaces = await listUserWorkspaces(user.id);
  return NextResponse.json({ workspaces });
}

const createSchema = z.object({
  name: z.string().min(1).max(64),
  slug: z.string().min(3).max(48).optional(),
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return csrfReject();
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const result = await createWorkspace({
    userId: user.id,
    name: parsed.data.name,
    slug: parsed.data.slug,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ workspace: result.workspace });
}
