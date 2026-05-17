import { listSources } from "@indox/core";
import { requireWorkspace } from "@/lib/session";

export async function GET() {
  const { workspace } = await requireWorkspace();
  const sources = await listSources({ readyOnly: true, workspaceId: workspace.id });
  return Response.json({
    sources: sources.map((s) => ({
      id: s.id,
      displayName: s.displayName,
      externalId: s.externalId,
      kind: s.kind,
    })),
  });
}
