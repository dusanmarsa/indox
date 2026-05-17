import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";
import { hybridSearch, listSources } from "@indox/core";
import { authenticate, isAuthFailure } from "../auth";

export const schema = {
  query: z
    .string()
    .min(1)
    .describe(
      "What to search for. Natural language is fine — Indox runs hybrid retrieval (vector + BM25) and rewrites the query internally for code-shaped lookups.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe("How many chunks to return. Defaults to 8."),
};

export const metadata: ToolMetadata = {
  name: "search_code",
  description:
    "Semantic + lexical search across your indexed sources. Returns the most relevant chunks with SHA-pinned blob URLs. Scoped to the user that issued the MCP bearer token — your agent can only see your own indexes. Call list_indexed_sources first to discover what's available.",
  annotations: {
    title: "Search indexed code",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export default async function searchCode({
  query,
  limit,
}: InferSchema<typeof schema>) {
  const auth = await authenticate();
  if (isAuthFailure(auth)) return auth;

  // Workspace-scoped search: the token resolves to a set of accessible
  // workspaces; pull every ready source within them. Without this filter
  // we'd surface other users' indexed content to whoever has the URL.
  if (auth.workspaceIds.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "This token has no accessible workspaces. Create one in the indox dashboard, or rotate your token.",
        },
      ],
    };
  }
  const sources = await listSources({
    readyOnly: true,
    workspaceIds: auth.workspaceIds,
  });
  if (sources.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "You have no indexed sources yet. Add one from the indox dashboard.",
        },
      ],
    };
  }

  const sourceIds = sources.map((s) => s.id);
  const chunks = await hybridSearch(query, limit ?? 8, { sourceIds });
  if (chunks.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `No matches for "${query}" in your indexed sources.`,
        },
      ],
    };
  }
  const payload = {
    query,
    chunks: chunks.map((c) => ({ url: c.url, text: c.text, confidence: c.confidence })),
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
