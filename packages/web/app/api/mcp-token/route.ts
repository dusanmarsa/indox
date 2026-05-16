// MCP bearer-token management for the current user.
// GET    — return the existing token (creating one on first call).
// POST   — rotate: generate a fresh token and invalidate the old.

import { NextResponse } from "next/server";
import { getOrCreateMcpToken, rotateMcpToken } from "@indox/core";
import { requireOwnerKey } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireOwnerKey();
  const token = await getOrCreateMcpToken(userId);
  return NextResponse.json({ token });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return csrfReject();
  const userId = await requireOwnerKey();
  const token = await rotateMcpToken(userId);
  return NextResponse.json({ token });
}
