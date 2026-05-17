import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  prisma,
  enqueueAdapterSync,
  getDriver,
  listAdapterKinds,
  logger,
  encryptToken,
} from "@indox/core";
import { requireWorkspace } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

const createAdapterSchema = z.object({
  kind: z.enum(["github"] as [string, ...string[]]),
  authIdentity: z.string().min(1).optional().nullable(),
  token: z.string().min(1).max(4096),
  scope: z.unknown(),
});

export async function GET() {
  const { workspace } = await requireWorkspace();
  const adapters = await prisma.adapter.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sources: { select: { id: true, indexStatus: true } } },
  });
  return NextResponse.json({ adapters });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return csrfReject();
  const { workspace } = await requireWorkspace();

  const body = await req.json().catch(() => null);
  const parsed = createAdapterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { kind, authIdentity, token, scope: rawScope } = parsed.data;

  if (!listAdapterKinds().includes(kind as "github")) {
    return NextResponse.json({ error: `unknown adapter kind: ${kind}` }, { status: 400 });
  }

  const driver = getDriver(kind);
  let scope;
  try {
    scope = driver.parseScope(rawScope);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `invalid scope: ${msg}` }, { status: 400 });
  }

  const adapter = await prisma.adapter.create({
    data: {
      workspaceId: workspace.id,
      kind,
      authIdentity: authIdentity ?? null,
      token: encryptToken(token),
      scope: scope as object,
      syncStatus: "idle",
    },
  });

  // Empty repos[] is the normal path — user creates the adapter first, then
  // picks repos one by one via the per-source sync queue.
  const scopeHasWork =
    (scope as { mode: string; value: unknown }).mode !== "repos" ||
    (Array.isArray((scope as { value: unknown[] }).value) &&
      (scope as { value: unknown[] }).value.length > 0);
  if (scopeHasWork) {
    enqueueAdapterSync(adapter.id).catch((err) =>
      logger.error("api", `failed to enqueue sync for ${adapter.id}: ${err}`),
    );
  }

  return NextResponse.json({ adapter });
}
