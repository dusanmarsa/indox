import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  prisma,
  resolveGithubRepo,
  addSourceToAdapter,
  enqueueSourceSync,
  decryptToken,
  logger,
} from "@indox/core";
import { requireOwnerKey } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

const addSchema = z.object({
  fullName: z.string().min(1).max(200),
});

// Add one repo to an adapter and queue its index job. Cheaper than
// re-syncing the whole adapter when the user just wants to add one more.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) return csrfReject();
  const ownerKey = await requireOwnerKey();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const adapter = await prisma.adapter.findFirst({ where: { id, ownerKey } });
  if (!adapter) return NextResponse.json({ error: "adapter not found" }, { status: 404 });
  if (adapter.kind !== "github") {
    return NextResponse.json({ error: `unsupported kind: ${adapter.kind}` }, { status: 400 });
  }

  let enumerated;
  try {
    enumerated = await resolveGithubRepo(decryptToken(adapter.token), parsed.data.fullName);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const source = await addSourceToAdapter(id, enumerated);
  enqueueSourceSync(source.id).catch((err) =>
    logger.error("api", `failed to enqueue source sync for ${source.id}: ${err}`),
  );

  return NextResponse.json({ source });
}
