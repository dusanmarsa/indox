// Tree-sitter glue for the chunker.
//
// We use tree-sitter to find structural boundaries in source files (top-level
// functions, classes, methods, etc.) so each chunk is one logical unit instead
// of a fixed sliding window. Markdown and any-language-with-no-grammar fall
// back to the regex/window paths in chunker.ts.
//
// Runtime model:
//   - One-time `preloadParsers()` does Parser.init + loads every grammar we
//     ship. After it resolves, `parseStructure()` is synchronous.
//   - The github adapter calls preload once at the start of indexSource.
//   - All other callers (the eval script, ad-hoc scripts) call it too.
//   - Grammar wasms come from the `tree-sitter-wasms` package; the core
//     wasm comes from `web-tree-sitter`. Both are resolved via Node's
//     module resolver so we don't hard-code paths.

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
// web-tree-sitter is pinned to 0.22.6 to keep ABI compatibility with the
// grammars shipped by tree-sitter-wasms@0.1.x (built against tree-sitter
// 0.20-0.22). 0.26.x rejects those grammars at load time with a dylink
// metadata error. Bumping web-tree-sitter requires either bumping
// tree-sitter-wasms (no compatible version available yet) or rebuilding
// every grammar locally with current tree-sitter-cli — both bigger lifts
// than pinning here.
import Parser from "web-tree-sitter";
import { logger } from "./logger";

const require = createRequire(import.meta.url);

// Languages we support. The key is the wasm name used by tree-sitter-wasms
// (e.g. "typescript" → "tree-sitter-typescript.wasm"). Each entry holds the
// query string used to find chunk-boundary nodes for that language. We keep
// the queries narrow on purpose — better to fall back to file-level chunks
// than to over-fragment a file with every nested method becoming its own
// chunk (and losing the surrounding class context in the process).
// One pattern per "structural decl" node type per language. Kept narrow on
// purpose:
//   - Methods inside classes are NOT captured separately — the class chunk
//     covers them, and the sub-splitter handles big classes by sliding window.
//   - Top-level constants / variables are NOT captured — `const VECTOR_K = 25`
//     doesn't deserve its own chunk.
//   - Tree-sitter would happily match these patterns at any depth; we
//     filter to top-level after the query in JS (see isTopLevel below).
const LANG_QUERIES: Record<string, string> = {
  typescript: `
    (function_declaration) @chunk
    (class_declaration) @chunk
    (interface_declaration) @chunk
    (enum_declaration) @chunk
    (type_alias_declaration) @chunk
  `,
  tsx: `
    (function_declaration) @chunk
    (class_declaration) @chunk
    (interface_declaration) @chunk
    (enum_declaration) @chunk
    (type_alias_declaration) @chunk
  `,
  javascript: `
    (function_declaration) @chunk
    (class_declaration) @chunk
  `,
  python: `
    (function_definition) @chunk
    (class_definition) @chunk
  `,
  go: `
    (function_declaration) @chunk
    (method_declaration) @chunk
    (type_declaration) @chunk
  `,
  rust: `
    (function_item) @chunk
    (impl_item) @chunk
    (struct_item) @chunk
    (enum_item) @chunk
    (trait_item) @chunk
  `,
  java: `
    (class_declaration) @chunk
    (interface_declaration) @chunk
  `,
  kotlin: `
    (class_declaration) @chunk
    (function_declaration) @chunk
  `,
  ruby: `
    (class) @chunk
    (module) @chunk
  `,
  cpp: `
    (function_definition) @chunk
    (class_specifier) @chunk
    (struct_specifier) @chunk
  `,
  c: `
    (function_definition) @chunk
    (struct_specifier) @chunk
  `,
  c_sharp: `
    (class_declaration) @chunk
    (interface_declaration) @chunk
  `,
  php: `
    (function_definition) @chunk
    (class_declaration) @chunk
  `,
  swift: `
    (function_declaration) @chunk
    (class_declaration) @chunk
    (protocol_declaration) @chunk
    (struct_declaration) @chunk
  `,
  scala: `
    (function_definition) @chunk
    (class_definition) @chunk
    (trait_definition) @chunk
    (object_definition) @chunk
  `,
};

// Root node types per language — used to identify top-level scope. Most
// tree-sitter grammars name this `program` or `source_file`. Anything not
// at that depth is nested (inside a function, class body, etc) and shouldn't
// generate its own chunk.
const ROOT_NODE_TYPES = new Set([
  "program",
  "source_file",
  "module",
  "translation_unit", // C / C++
  "compilation_unit", // Java / C# / Kotlin
]);

// Some grammars wrap top-level decls in export/decorator nodes; walk past
// those to find the actual scope.
const TRANSPARENT_PARENT_TYPES = new Set([
  "export_statement",
  "export_default_declaration",
  "decorated_definition", // python decorators
  "decorator_list",
  "modifier_list",
]);

function isTopLevel(node: { parent: { type: string; parent: unknown } | null }): boolean {
  let p = node.parent;
  while (p && TRANSPARENT_PARENT_TYPES.has(p.type)) {
    p = (p as { parent: typeof p }).parent;
  }
  return !!p && ROOT_NODE_TYPES.has(p.type);
}

// Symbol queries. Capture the NAME of each interesting decl so we can
// surface searchable identifiers in the chunk header's `tokens:` line.
// Tree-sitter sees method names, deconstructed property identifiers,
// nested decls, and arrow-const-as-value patterns — all the things the
// previous regex (`/\b(function|class|def|fn|...)\s+(\w+)/g`) silently
// skipped or got wrong.
const SYMBOL_QUERIES: Record<string, string> = {
  typescript: `
    (function_declaration name: (_) @symbol)
    (class_declaration name: (_) @symbol)
    (interface_declaration name: (_) @symbol)
    (enum_declaration name: (_) @symbol)
    (type_alias_declaration name: (_) @symbol)
    (method_definition name: (_) @symbol)
    (variable_declarator name: (identifier) @symbol)
  `,
  tsx: `
    (function_declaration name: (_) @symbol)
    (class_declaration name: (_) @symbol)
    (interface_declaration name: (_) @symbol)
    (enum_declaration name: (_) @symbol)
    (type_alias_declaration name: (_) @symbol)
    (method_definition name: (_) @symbol)
    (variable_declarator name: (identifier) @symbol)
  `,
  javascript: `
    (function_declaration name: (_) @symbol)
    (class_declaration name: (_) @symbol)
    (method_definition name: (_) @symbol)
    (variable_declarator name: (identifier) @symbol)
  `,
  python: `
    (function_definition name: (identifier) @symbol)
    (class_definition name: (identifier) @symbol)
  `,
  go: `
    (function_declaration name: (identifier) @symbol)
    (method_declaration name: (field_identifier) @symbol)
    (type_spec name: (type_identifier) @symbol)
  `,
  rust: `
    (function_item name: (identifier) @symbol)
    (struct_item name: (type_identifier) @symbol)
    (enum_item name: (type_identifier) @symbol)
    (trait_item name: (type_identifier) @symbol)
    (impl_item type: (type_identifier) @symbol)
  `,
  java: `
    (class_declaration name: (identifier) @symbol)
    (interface_declaration name: (identifier) @symbol)
    (method_declaration name: (identifier) @symbol)
  `,
  kotlin: `
    (class_declaration (type_identifier) @symbol)
    (function_declaration (simple_identifier) @symbol)
  `,
  ruby: `
    (class name: (constant) @symbol)
    (module name: (constant) @symbol)
    (method name: (identifier) @symbol)
    (singleton_method name: (identifier) @symbol)
  `,
  cpp: `
    (function_definition declarator: (function_declarator declarator: (identifier) @symbol))
    (class_specifier name: (type_identifier) @symbol)
    (struct_specifier name: (type_identifier) @symbol)
  `,
  c: `
    (function_definition declarator: (function_declarator declarator: (identifier) @symbol))
    (struct_specifier name: (type_identifier) @symbol)
  `,
  c_sharp: `
    (class_declaration name: (identifier) @symbol)
    (interface_declaration name: (identifier) @symbol)
    (method_declaration name: (identifier) @symbol)
  `,
  php: `
    (function_definition name: (name) @symbol)
    (class_declaration name: (name) @symbol)
  `,
  swift: `
    (function_declaration name: (simple_identifier) @symbol)
    (class_declaration name: (type_identifier) @symbol)
    (protocol_declaration name: (type_identifier) @symbol)
    (struct_declaration name: (type_identifier) @symbol)
  `,
  scala: `
    (function_definition name: (identifier) @symbol)
    (class_definition name: (identifier) @symbol)
    (trait_definition name: (identifier) @symbol)
    (object_definition name: (identifier) @symbol)
  `,
};

// Import-statement queries. We capture the whole statement node and the
// chunker uses its text verbatim for the chunk header's `imports:` block.
// This catches multi-line imports, type-only imports, namespace imports,
// dynamic imports — anything the source's import grammar recognises —
// which the previous big-union regex routinely missed.
const IMPORT_QUERIES: Record<string, string> = {
  typescript: `(import_statement) @import`,
  tsx: `(import_statement) @import`,
  javascript: `(import_statement) @import`,
  python: `
    (import_statement) @import
    (import_from_statement) @import
  `,
  go: `(import_declaration) @import`,
  rust: `(use_declaration) @import`,
  java: `(import_declaration) @import`,
  kotlin: `(import_header) @import`,
  ruby: `(call method: (identifier) @_m (#match? @_m "^require") @import)`,
  cpp: `(preproc_include) @import`,
  c: `(preproc_include) @import`,
  c_sharp: `(using_directive) @import`,
  php: `(namespace_use_declaration) @import`,
  swift: `(import_declaration) @import`,
  scala: `(import_declaration) @import`,
};

// File extension → tree-sitter-wasms grammar name.
const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  rb: "ruby",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  hh: "cpp",
  cxx: "cpp",
  c: "c",
  h: "c",
  cs: "c_sharp",
  php: "php",
  swift: "swift",
  scala: "scala",
  sc: "scala",
};

export function langForExt(ext: string): string | null {
  return EXT_TO_LANG[ext.toLowerCase()] ?? null;
}

// Cache the loaded Language + compiled Query per grammar. Languages are
// expensive to load (parses the WASM); queries are cheap but we still
// cache to avoid re-allocating across the thousands of chunkFile calls
// in a typical sync.
// A loaded language ships three queries: chunk-boundary nodes, identifier
// names of decls (for the header's tokens line), and import statements
// (for the per-chunk "what's in scope" header). All three live on the
// same language, so we compile them once at grammar load time.
type LangBundle = {
  language: Parser.Language;
  chunkQuery: Parser.Query;
  symbolQuery: Parser.Query | null;
  importQuery: Parser.Query | null;
};
const bundles = new Map<string, LangBundle>();

let initPromise: Promise<void> | null = null;
let initFailed = false;

async function loadGrammar(name: string): Promise<LangBundle | null> {
  try {
    const wasmPath = require.resolve(`tree-sitter-wasms/out/tree-sitter-${name}.wasm`);
    const bytes = await readFile(wasmPath);
    const language = await Parser.Language.load(bytes);
    const chunkQuery = language.query(LANG_QUERIES[name]);
    // Symbol / import queries can fail to compile against a given
    // grammar (e.g. a node type doesn't exist or got renamed). Don't
    // let that take down chunk-boundary parsing — just disable the
    // sub-query and fall back to regex for that language.
    let symbolQuery: Parser.Query | null = null;
    if (SYMBOL_QUERIES[name]) {
      try {
        symbolQuery = language.query(SYMBOL_QUERIES[name]);
      } catch (err) {
        logger.warn(
          "tree-sitter",
          `symbol query failed to compile for "${name}": ${(err as Error).message}`
        );
      }
    }
    let importQuery: Parser.Query | null = null;
    if (IMPORT_QUERIES[name]) {
      try {
        importQuery = language.query(IMPORT_QUERIES[name]);
      } catch (err) {
        logger.warn(
          "tree-sitter",
          `import query failed to compile for "${name}": ${(err as Error).message}`
        );
      }
    }
    return { language, chunkQuery, symbolQuery, importQuery };
  } catch (err) {
    logger.warn("tree-sitter", `failed to load grammar "${name}": ${(err as Error).message}`);
    return null;
  }
}

// One-time setup. Must complete before parseStructure() is called.
// Calling it more than once is safe — subsequent calls return the cached
// init promise. Calling it concurrently from many places (eval runner + the
// adapter, say) is safe for the same reason.
export async function preloadParsers(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      await Parser.init({
        // web-tree-sitter 0.22 ships its core WASM as `tree-sitter.wasm`
        // next to the JS entry. Resolve through Node so the path is correct
        // regardless of cwd / bundler layout.
        locateFile: (file: string) => {
          if (file === "tree-sitter.wasm") {
            return require.resolve("web-tree-sitter/tree-sitter.wasm");
          }
          return file;
        },
      });
      // Load all supported grammars in parallel. ~5-10MB total of WASM,
      // most of it parses in a few hundred ms combined.
      const names = Object.keys(LANG_QUERIES);
      const results = await Promise.all(names.map((n) => loadGrammar(n)));
      let loaded = 0;
      for (let i = 0; i < names.length; i++) {
        if (results[i]) {
          bundles.set(names[i], results[i]!);
          loaded++;
        }
      }
      logger.info("tree-sitter", `initialised parser with ${loaded}/${names.length} grammars`);
    } catch (err) {
      initFailed = true;
      logger.error(
        "tree-sitter",
        `parser init failed, falling back to regex/window chunking: ${(err as Error).message}`
      );
    }
  })();
  return initPromise;
}

export type Boundary = {
  /** 0-based line, inclusive */
  startLine: number;
  /** 0-based line, exclusive */
  endLine: number;
};

export type SymbolHit = {
  name: string;
  /** 0-based line where the decl starts; used to filter symbols per chunk range. */
  line: number;
};

export type ParseResult = {
  boundaries: Boundary[];
  symbols: SymbolHit[];
  imports: string[];
};

const EMPTY: ParseResult = { boundaries: [], symbols: [], imports: [] };

// Parse a file once and pull everything the chunker / indexer needs out of
// the same tree: structural boundaries, decl-name symbols, and import
// statements. One parse, three answers — cheaper than running tree-sitter
// three times, and the caller doesn't need to know about tree-sitter at all.
// Synchronous; relies on the caller having awaited preloadParsers().
export function parseStructure(content: string, lang: string): ParseResult {
  if (initFailed) return EMPTY;
  const bundle = bundles.get(lang);
  if (!bundle) return EMPTY;

  let tree;
  const parser = new Parser();
  try {
    parser.setLanguage(bundle.language);
    tree = parser.parse(content);
  } catch (err) {
    logger.warn("tree-sitter", `parse failed for ${lang}: ${(err as Error).message}`);
    parser.delete();
    return EMPTY;
  } finally {
    // The parser instance is single-use here; reusing it across files
    // would save a few microseconds but tangles ownership across calls.
    // tree-sitter parsers are cheap to allocate.
    parser.delete();
  }
  if (!tree) return EMPTY;

  // ─── boundaries (top-level decls) ─────────────────────────────────────
  const byStart = new Map<number, Boundary>();
  for (const c of bundle.chunkQuery.captures(tree.rootNode)) {
    if (!isTopLevel(c.node)) continue;
    const startLine = c.node.startPosition.row;
    const endLine = c.node.endPosition.row + 1; // tree-sitter end is inclusive; ours is exclusive
    if (!byStart.has(startLine)) {
      byStart.set(startLine, { startLine, endLine });
    }
  }
  const boundaries = [...byStart.values()].sort((a, b) => a.startLine - b.startLine);

  // ─── symbols (decl names) ─────────────────────────────────────────────
  // We capture every decl-name regardless of depth — methods inside
  // classes, nested functions, etc. The chunker filters by line range
  // when assembling each chunk's header tokens. Dedupe by line+name in
  // case the query matches the same node through more than one pattern.
  const symbols: SymbolHit[] = [];
  if (bundle.symbolQuery) {
    const seen = new Set<string>();
    for (const c of bundle.symbolQuery.captures(tree.rootNode)) {
      const name = c.node.text;
      if (!name) continue;
      const line = c.node.startPosition.row;
      const key = `${line}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      symbols.push({ name, line });
    }
  }

  // ─── imports (whole statement text) ───────────────────────────────────
  // Capture the full statement node and reproduce its source. Tree-sitter
  // preserves the original text so multi-line imports come back joined
  // with their newlines collapsed to single spaces for header neatness.
  const imports: string[] = [];
  if (bundle.importQuery) {
    const seen = new Set<string>();
    for (const c of bundle.importQuery.captures(tree.rootNode)) {
      if (c.name !== "import") continue;
      const text = c.node.text.replace(/\s+/g, " ").trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      imports.push(text);
      if (imports.length >= 20) break; // cap header bloat (matches the regex path)
    }
  }

  tree.delete();
  return { boundaries, symbols, imports };
}

// True iff preloadParsers has been awaited at least once successfully.
// Useful for assertion in code paths that need the parser warm.
export function parsersReady(): boolean {
  return bundles.size > 0;
}
