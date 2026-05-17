import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  prisma,
  addSourceToAdapter,
  enqueueSourceSync,
  decryptToken,
  logger,
} from "@indox/core";
import { resolveGithubRepo } from "@indox/core/adapters/github";
import { resolveNotionPage } from "@indox/core/adapters/notion";
import { requireWorkspace } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

export const dynamic = "force-dynamic";

// Accept either `fullName` (github "owner/name") or `ref` (notion page id/URL).
// Older clients used `fullName`; the field is reused below as a generic ref.
const addSchema = z.object({
  fullName: z.string().min(1).max(500).optional(),
  ref: z.string().min(1).max(500).optional(),
});

// Add one source to an adapter and queue its index job. Cheaper than
// re-syncing the whole adapter when the user just wants to add one more.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return csrfReject();
  const { workspace } = await requireWorkspace();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  const ref = parsed.success ? (parsed.data.ref ?? parsed.data.fullName) : undefined;
  if (!parsed.success || !ref) {
    return NextResponse.json(
      { error: "invalid payload — provide `ref` or `fullName`" },
      { status: 400 }
    );
  }

  const adapter = await prisma.adapter.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!adapter) return NextResponse.json({ error: "adapter not found" }, { status: 404 });

  const token = decryptToken(adapter.token);
  let enumerated;
  try {
    if (adapter.kind === "github") {
      enumerated = await resolveGithubRepo(token, ref);
    } else if (adapter.kind === "notion") {
      enumerated = await resolveNotionPage(token, ref);
    } else {
      return NextResponse.json({ error: `unsupported kind: ${adapter.kind}` }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const source = await addSourceToAdapter(id, enumerated);
  enqueueSourceSync(source.id).catch((err) =>
    logger.error("api", `failed to enqueue source sync for ${source.id}: ${err}`)
  );

  return NextResponse.json({ source });
}
