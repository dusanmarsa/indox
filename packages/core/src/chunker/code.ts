// Code chunker. Splits a content item with shape="code" into one chunk
// per top-level decl using adapter-supplied boundaries (from tree-sitter
// or the adapter's equivalent). When boundaries aren't available the
// chunker falls back to a fixed sliding window — keeps unsupported
// languages chunked, just less precisely.

import type {
  Chunk,
  ContentItem,
  StructuralBoundary,
} from "./types";
import { pathTokens, tokenizePathSegment } from "./path-tokens";

const WINDOW_LINES = 60;
const OVERLAP_LINES = 15;

// Merge consecutive small ranges so we don't emit a flurry of one-line
// chunks (e.g. a block of single-line type aliases). A chunk smaller than
// this loses too much surrounding context for prose-style queries to
// anchor onto.
const MIN_CHUNK_LINES = 8;

export function chunkCode(item: ContentItem): Chunk[] {
  const lines = item.body.split("\n");
  const code = item.codeStructure;
  const boundaries: StructuralBoundary[] = code?.boundaries ?? [];
  const tsSymbols = code?.symbols;
  const tsImports = code?.imports ?? [];

  // Per-chunk symbol picker. Filters the adapter's symbol list by line
  // range. When no symbols are supplied (file in an unsupported language)
  // chunks just get a leaner header — no regex fallback.
  const pickSymbols = (sliceStart0: number, sliceEnd0: number): string[] => {
    if (!tsSymbols) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of tsSymbols) {
      if (s.line >= sliceStart0 && s.line < sliceEnd0 && !seen.has(s.name)) {
        seen.add(s.name);
        out.push(s.name);
        if (out.length >= 12) break;
      }
    }
    return out;
  };

  // Tiny files — one chunk regardless of boundaries.
  if (lines.length <= WINDOW_LINES) {
    return [
      makeChunk(item, item.body, 1, lines.length, pickSymbols(0, lines.length), tsImports),
    ];
  }

  // No boundaries → sliding window fallback. Preserves chunking quality
  // for languages we don't have a grammar for and for files with no
  // top-level decls.
  if (boundaries.length < 2) {
    return slidingWindow(item, lines, tsImports, pickSymbols);
  }

  // Build [start, end) ranges from the boundary list. Prepend a preamble
  // range when the first decl isn't at the very top — keeps file-level
  // imports, top-of-file comments, and module-init code chunked.
  const rawRanges: Array<[number, number]> = [];
  if (boundaries[0].startLine > 0) rawRanges.push([0, boundaries[0].startLine]);
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i].startLine;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].startLine : lines.length;
    rawRanges.push([start, end]);
  }

  // Coalesce ranges that are too small to stand alone.
  const ranges: Array<[number, number]> = [];
  let pending: [number, number] | null = null;
  for (const [s, e] of rawRanges) {
    if (pending) {
      pending[1] = e;
      if (pending[1] - pending[0] >= MIN_CHUNK_LINES) {
        ranges.push(pending);
        pending = null;
      }
    } else if (e - s < MIN_CHUNK_LINES) {
      pending = [s, e];
    } else {
      ranges.push([s, e]);
    }
  }
  if (pending) {
    if (ranges.length) ranges[ranges.length - 1][1] = pending[1];
    else ranges.push(pending);
  }

  const out: Chunk[] = [];
  for (const [start, end] of ranges) {
    // Drop ranges that are pure whitespace.
    if (end - start <= 1 && lines.slice(start, end).every((l) => !l.trim())) continue;

    // Long block (big class, dense generated factory) — sub-split with the
    // sliding window so a single chunk never dilutes the embedder's signal.
    if (end - start > WINDOW_LINES * 2) {
      let sub = start;
      while (sub < end) {
        const subEnd = Math.min(sub + WINDOW_LINES, end);
        const slice = lines.slice(sub, subEnd).join("\n");
        out.push(
          makeChunk(item, slice, sub + 1, subEnd, pickSymbols(sub, subEnd), tsImports),
        );
        if (subEnd >= end) break;
        sub = subEnd - OVERLAP_LINES;
      }
      continue;
    }

    const slice = lines.slice(start, end).join("\n");
    out.push(makeChunk(item, slice, start + 1, end, pickSymbols(start, end), tsImports));
  }

  return out;
}

function slidingWindow(
  item: ContentItem,
  lines: string[],
  imports: string[],
  pickSymbols: (start0: number, end0: number) => string[],
): Chunk[] {
  const out: Chunk[] = [];
  let start = 0;
  while (start < lines.length) {
    const end = Math.min(start + WINDOW_LINES, lines.length);
    const slice = lines.slice(start, end).join("\n");
    out.push(makeChunk(item, slice, start + 1, end, pickSymbols(start, end), imports));
    if (end >= lines.length) break;
    start = end - OVERLAP_LINES;
  }
  return out;
}

// Build a Chunk with its embedding-ready header. Header carries:
//   - the source prefix + display path + line range
//   - the symbol list (decl names inside this chunk's range)
//   - a `tokens:` line with path + camelCase-split symbol tokens for BM25
//   - an `imports:` block so the embedder knows what's in scope
function makeChunk(
  item: ContentItem,
  body: string,
  startLine1Based: number,
  endLine1Based: number,
  symbols: string[],
  imports: string[],
): Chunk {
  const sym = symbols.length ? ` — ${symbols.join(", ")}` : "";
  const tokenSet = new Set<string>(pathTokens(item.displayPath));
  for (const s of symbols) for (const t of tokenizePathSegment(s)) tokenSet.add(t);
  const tokens = [...tokenSet].join(" ");
  // The imports header gives chunks pulled from the middle of a file a
  // "what's in scope" prefix. Without it, a chunk at line 200 of a 500-line
  // file has no idea what's imported, and queries like "how is ratelimit
  // configured" miss because the actual ratelimit mention lives in the
  // imports block at the top.
  const importLines = imports.slice(0, 12);
  let importsBlock = "";
  if (importLines.length) {
    let joined = importLines.join("\n");
    if (joined.length > 600) joined = joined.slice(0, 600) + " …";
    importsBlock = `imports:\n${joined}\n\n`;
  }
  return {
    shape: "code",
    startLine: startLine1Based,
    endLine: endLine1Based,
    text: `# ${item.headerPrefix} — ${item.displayPath}:L${startLine1Based}-L${endLine1Based}${sym}\ntokens: ${tokens}\n\n${importsBlock}${body}`,
    url: item.citationUrl({ start: startLine1Based, end: endLine1Based }),
  };
}
