// Chunker types. The chunker is content-shape-aware, not source-shape-aware:
// adapters (GitHub, Notion, Confluence, …) translate their native data
// model into ContentItems and hand them off; the chunker only knows
// about the shape of what's inside.

// ─── content shape ────────────────────────────────────────────────────────
//
// The two real distinguishing axes are "has AST-like structure" vs "has
// section hierarchy" vs "neither". File extensions and storage backends
// don't enter into it.
//
//   code  — source files / Notion code blocks / Confluence code macros.
//           Tree-sitter (or equivalent) can produce boundaries + symbols
//           + imports for fine-grained chunking.
//   prose — Markdown, README, Notion page, Confluence page, doc comments,
//           anything with headings and paragraphs. May embed code blocks
//           which we surface as their own chunks alongside the prose.
//   blob  — small structured-but-opaque content (package.json, config
//           snippets, a Notion table). Emit as one chunk.
export type ContentShape = "code" | "prose" | "blob";

// ─── pre-parsed structure (adapter-supplied) ──────────────────────────────

export type StructuralBoundary = {
  /** 0-based line, inclusive */
  startLine: number;
  /** 0-based line, exclusive */
  endLine: number;
};

export type SymbolHit = {
  name: string;
  /** 0-based line where the decl starts. */
  line: number;
};

export type CodeStructure = {
  boundaries: StructuralBoundary[];
  symbols?: SymbolHit[];
  imports?: string[];
};

export type ProseSection = {
  /** 0-based start line (inclusive) of the section body. */
  startLine: number;
  /** 0-based end line (exclusive). */
  endLine: number;
  /** Heading hierarchy from H1 down. Empty for the preamble. */
  breadcrumb: string[];
};

export type ProseCodeBlock = {
  startLine: number;
  endLine: number;
  /** Language tag from the fence, e.g. "ts", "python", "sql"; empty for unlabelled blocks. */
  lang: string;
};

export type ProseStructure = {
  sections: ProseSection[];
  /** Standalone code blocks embedded in the prose. The chunker emits these as their own chunks too. */
  codeBlocks: ProseCodeBlock[];
};

// ─── content item ─────────────────────────────────────────────────────────

export type ContentItem = {
  /** Stable, opaque identifier (e.g. github://repo/path@sha, notion://page/id). Not shown to the user. */
  sourceUri: string;
  /** Display path for chunk headers. Adapters choose: file path, page title, breadcrumb, etc. */
  displayPath: string;
  /** Prefix that goes ahead of displayPath in every chunk header. Usually the source name. */
  headerPrefix: string;
  /** Categorical hint for which chunker strategy to dispatch. */
  shape: ContentShape;
  /** Raw text content. The chunker slices this by line. */
  body: string;
  /** Adapter-supplied structure when available — speeds up chunking and lifts quality. */
  codeStructure?: CodeStructure;
  proseStructure?: ProseStructure;
  /**
   * Adapter-supplied citation URL builder. Receives an optional [start,end] line
   * range (1-based, inclusive — matches our chunk metadata). Adapter formats the
   * URL however its source links work: SHA-pinned GitHub blob, Notion page,
   * Confluence anchor, etc.
   */
  citationUrl: (range?: { start: number; end: number }) => string;
};

// ─── output ───────────────────────────────────────────────────────────────

export type Chunk = {
  /** Embedding-ready text: header + body. */
  text: string;
  /** Resolved citation URL (from item.citationUrl). Stored on the embedding row. */
  url: string;
  shape: ContentShape;
  /** 1-based inclusive start line in the original content, if applicable. */
  startLine?: number;
  /** 1-based inclusive end line in the original content, if applicable. */
  endLine?: number;
};
