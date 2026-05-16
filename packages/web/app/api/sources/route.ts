import { listSources } from "@indox/core";
import { requireOwnerKey } from "@/lib/session";

export async function GET() {
  const ownerKey = await requireOwnerKey();
  const sources = await listSources({ readyOnly: true, ownerKey });
  return Response.json({
    sources: sources.map((s) => ({
      id: s.id,
      displayName: s.displayName,
      externalId: s.externalId,
      kind: s.kind,
    })),
  });
}
