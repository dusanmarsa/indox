// Sets the `indox_workspace` cookie that pins the user's active workspace
// across requests. Ownership is verified server-side so a tampered cookie
// can never reach a workspace the user doesn't own.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getOwnedWorkspace } from "@indox/core";
import { requireUser, ACTIVE_WORKSPACE_COOKIE } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

const schema = z.object({ id: z.string().min(1) });

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return csrfReject();
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const owned = await getOwnedWorkspace(parsed.data.id, user.id);
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const jar = await cookies();
  jar.set(ACTIVE_WORKSPACE_COOKIE, owned.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    // 1 year — basically "until they switch again".
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.json({ ok: true, workspace: owned });
}
