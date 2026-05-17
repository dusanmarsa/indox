import { NextRequest, NextResponse } from "next/server";
import { prisma, decryptToken } from "@indox/core";
import { listGithubRepos } from "@indox/core/adapters/github";
import { listNotionPages } from "@indox/core/adapters/notion";
import { requireWorkspace } from "@/lib/session";

export const dynamic = "force-dynamic";

// Browse sources visible to the adapter's auth token, marking which are
// already indexed. Powers the "pick sources" UI on /dashboard/adapters/[id].
// Github: needs ?mode=user|org&value=… (the repo namespace to list).
// Notion: no params — /v1/search returns every page the integration can see.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { workspace } = await requireWorkspace();
  const { id } = await ctx.params;

  const adapter = await prisma.adapter.findFirst({
    where: { id, workspaceId: workspace.id },
    include: { sources: { select: { externalId: true } } },
  });
  if (!adapter) return NextResponse.json({ error: "adapter not found" }, { status: 404 });

  const indexed = new Set(adapter.sources.map((s) => s.externalId));

  try {
    if (adapter.kind === "github") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("mode") as "user" | "org" | null;
      const value = url.searchParams.get("value");
      if (!mode || !value) {
        return NextResponse.json(
          { error: "mode and value query params are required" },
          { status: 400 }
        );
      }
      const repos = await listGithubRepos(decryptToken(adapter.token), { mode, value });
      return NextResponse.json({
        repos: repos.map((r) => ({ ...r, indexed: indexed.has(r.fullName.toLowerCase()) })),
      });
    }

    if (adapter.kind === "notion") {
      const pages = await listNotionPages(decryptToken(adapter.token));
      return NextResponse.json({
        pages: pages.map((p) => ({ ...p, indexed: indexed.has(p.pageId) })),
      });
    }

    return NextResponse.json({ error: `unsupported kind: ${adapter.kind}` }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
