import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listGithubRepos } from "@indox/core/adapters/github";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().min(1).max(4096),
  mode: z.enum(["user", "org"]),
  value: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return csrfReject();
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  try {
    const repos = await listGithubRepos(parsed.data.token, {
      mode: parsed.data.mode,
      value: parsed.data.value,
    });
    return NextResponse.json({ repos });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
