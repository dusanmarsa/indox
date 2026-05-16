import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";
import { listSources } from "@indox/core";
import { authenticate, isAuthFailure } from "../auth";

export const schema = {
  status: z
    .enum(["ready", "running", "failed", "idle", "any"])
    .optional()
    .describe(
      "Filter by index status. Defaults to 'ready' (only sources that are fully searchable).",
    ),
};

export const metadata: ToolMetadata = {
  name: "list_indexed_sources",
  description:
    "List every source you have indexed in indox. Call this to discover what search_code can find. Scoped to the user that issued the MCP bearer token. Returns source display names, kinds, chunk counts, and indexing status.",
  annotations: {
    title: "List indexed sources",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export default async function listIndexedSourcesTool({
  status,
}: InferSchema<typeof schema>) {
  const auth = await authenticate();
  if (isAuthFailure(auth)) return auth;

  const filter = status ?? "ready";
  const sources = await listSources({
    readyOnly: filter === "ready",
    ownerKey: auth.userId,
  });
  const filtered = filter === "any" || filter === "ready"
    ? sources
    : sources.filter((s) => s.indexStatus === filter);

  if (filtered.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            filter === "any" || filter === "ready"
              ? "No sources are indexed yet. Add one from the indox dashboard."
              : `No sources with status "${filter}".`,
        },
      ],
    };
  }

  const payload = {
    count: filtered.length,
    sources: filtered.map((s) => ({
      name: s.displayName,
      kind: s.kind,
      status: s.indexStatus,
      indexedAt: s.indexedAt?.toISOString() ?? null,
      chunkCount: s.chunkCount,
    })),
  };
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}
