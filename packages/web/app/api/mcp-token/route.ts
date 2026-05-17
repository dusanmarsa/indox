// MCP bearer-token management for the current user. The dashboard surfaces a
// single "Personal" token that implicitly covers all of the user's workspaces.
// GET    — return the existing personal token (creating one on first call).
// POST   — rotate: generate a fresh token and invalidate the old.

import { NextResponse } from "next/server";
import { getOrCreatePersonalToken, rotatePersonalToken } from "@indox/core";
import { requireUser } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  const token = await getOrCreatePersonalToken(user.id);
  return NextResponse.json({ token });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return csrfReject();
  const user = await requireUser();
  const token = await rotatePersonalToken(user.id);
  return NextResponse.json({ token });
}
