import { NextRequest, NextResponse } from "next/server";
import { prisma, listGithubRepos, decryptToken } from "@indox/core";
import { requireWorkspace } from "@/lib/session";

export const dynamic = "force-dynamic";

// Browse repos visible to the adapter's PAT for a given user/org, marking
// which are already indexed. Powers the "pick repos" UI on /dashboard/adapters/[id].
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { workspace } = await requireWorkspace();
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") as "user" | "org" | null;
  const value = url.searchParams.get("value");
  if (!mode || !value) {
    return NextResponse.json(
      { error: "mode and value query params are required" },
      { status: 400 },
    );
  }

  const adapter = await prisma.adapter.findFirst({
    where: { id, workspaceId: workspace.id },
    include: { sources: { select: { externalId: true } } },
  });
  if (!adapter) return NextResponse.json({ error: "adapter not found" }, { status: 404 });
  if (adapter.kind !== "github") {
    return NextResponse.json({ error: `unsupported kind: ${adapter.kind}` }, { status: 400 });
  }

  try {
    const repos = await listGithubRepos(decryptToken(adapter.token), { mode, value });
    const indexed = new Set(adapter.sources.map((s) => s.externalId));
    return NextResponse.json({
      repos: repos.map((r) => ({
        ...r,
        indexed: indexed.has(r.fullName.toLowerCase()),
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
