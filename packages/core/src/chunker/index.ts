// Public chunker entry point. Adapters build a ContentItem (source-shape
// agnostic) and call chunkContent — the chunker dispatches by `shape`,
// not by file extension or platform.
//
// Internal split:
//   types.ts       — ContentItem, Chunk, ContentShape, CodeStructure, ProseStructure, …
//   classify.ts    — shouldIndex + defaultShape (path-based heuristics for filesystem adapters)
//   path-tokens.ts — path → BM25 tokens helpers
//   code.ts        — chunkCode
//   prose.ts       — chunkProse + markdown fallback walker
//   blob.ts        — chunkBlob

import type { Chunk, ContentItem } from "./types";
import { chunkCode } from "./code";
import { chunkProse } from "./prose";
import { chunkBlob } from "./blob";

export type {
  Chunk,
  ContentItem,
  ContentShape,
  CodeStructure,
  ProseStructure,
  ProseSection,
  ProseCodeBlock,
  StructuralBoundary,
  SymbolHit,
} from "./types";
export { shouldIndex, defaultShape } from "./classify";
export { walkMarkdown } from "./prose";

export function chunkContent(item: ContentItem): Chunk[] {
  switch (item.shape) {
    case "code":
      return chunkCode(item);
    case "prose":
      return chunkProse(item);
    case "blob":
      return chunkBlob(item);
  }
}
