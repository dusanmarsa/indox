// Blob chunker — for content that should stay whole. Manifests, small
// config files, table-shaped data, the "tree" overview an adapter might
// emit per source.

import type { Chunk, ContentItem } from "./types";
import { pathTokens } from "./path-tokens";

const MAX_BLOB_CHARS = 4800;

export function chunkBlob(item: ContentItem): Chunk[] {
  const body =
    item.body.length > MAX_BLOB_CHARS
      ? item.body.slice(0, MAX_BLOB_CHARS) + "\n…(truncated)"
      : item.body;
  const tokens = pathTokens(item.displayPath).join(" ");
  return [
    {
      shape: "blob",
      text: `# ${item.headerPrefix} — ${item.displayPath}\ntokens: ${tokens}\n\n${body}`,
      url: item.citationUrl(),
    },
  ];
}
