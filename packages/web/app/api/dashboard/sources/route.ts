import { getDashboardSources } from "@/lib/dashboard-data";
import { requireWorkspace } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { workspace } = await requireWorkspace();
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.max(1, Math.min(200, Number(limitParam))) : undefined;
  const sources = await getDashboardSources(workspace.id, limit);
  return Response.json({ sources });
}
