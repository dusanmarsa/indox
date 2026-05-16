import { isVendoredPath } from "./vendor";

// Hybrid code chunker:
//   - README/markdown   → split on H1/H2/H3, with a hard char cap per section
//   - Manifests         → single chunk with parsed highlights
//   - Code (and other)  → windowed line chunks (~60 lines, 15-line overlap)
// Each chunk carries `path` and an optional symbol-ish header in `text`, plus
// `chunkUrl` pointing to the blob on GitHub at the indexed SHA so retrieved
// chunks can link out.

export type CodeChunk = {
  path: string;
  text: string;
  chunkUrl: string;
  kind: "readme" | "manifest" | "code" | "tree";
  startLine?: number;
  endLine?: number;
};

const MAX_SECTION_CHARS = 2400;
const WINDOW_LINES = 60;
const OVERLAP_LINES = 15;
const MAX_FILE_BYTES = 200 * 1024;

// Paths whose presence inside means "skip this file"
const SKIP_DIR_PARTS = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".turbo", ".cache",
  "out", "target", "vendor", "coverage", ".venv", "venv", "__pycache__",
  ".pytest_cache", ".mypy_cache", ".idea", ".vscode", ".gradle", ".dart_tool",
  "bin", "obj",
]);

// Lockfiles & generated files (case-sensitive match on basename)
const SKIP_BASENAMES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb",
  "Cargo.lock", "Gemfile.lock", "Pipfile.lock", "poetry.lock",
  "composer.lock", "go.sum",
]);

const SKIP_EXTS = new Set([
  // images / fonts / video / audio
  "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "tiff", "svg",
  "woff", "woff2", "ttf", "otf", "eot",
  "mp4", "mov", "webm", "avi", "mkv", "mp3", "wav", "ogg", "flac",
  // archives / binaries
  "zip", "gz", "tar", "bz2", "xz", "7z", "rar", "exe", "dll", "so", "dylib",
  "wasm", "class", "jar", "pyc", "o", "a", "lib", "node",
  // data dumps
  "pdf", "psd", "ai", "sketch",
]);

const MANIFEST_BASENAMES = new Set([
  "package.json", "pyproject.toml", "Cargo.toml", "go.mod", "Gemfile",
  "composer.json", "build.gradle", "pom.xml", "setup.py", "requirements.txt",
  "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
]);

const README_BASENAMES = new Set([
  "readme.md", "readme.markdown", "readme.rst", "readme.txt", "readme",
  "contributing.md", "architecture.md", "design.md", "docs.md",
]);

function basename(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? path : path.slice(i + 1);
}

function ext(path: string): string {
  const b = basename(path);
  const i = b.lastIndexOf(".");
  return i === -1 ? "" : b.slice(i + 1).toLowerCase();
}

export function shouldIndex(path: string, size: number, sample: Uint8Array): boolean {
  if (size > MAX_FILE_BYTES) return false;

  // Path-based vendor/generated detection, delegated to the snapshot of
  // github-linguist's vendor.yml. Covers far more ground than a hand-rolled
  // basename list — caches, dist/build output, ecosystem dep dirs, generated
  // parsers, and framework boilerplate across dozens of languages.
  if (isVendoredPath(path)) return false;

  const parts = path.split("/");
  for (const p of parts) if (SKIP_DIR_PARTS.has(p)) return false;

  const b = basename(path);
  if (SKIP_BASENAMES.has(b)) return false;
  if (b.endsWith(".min.js") || b.endsWith(".min.css") || b.endsWith(".map")) return false;

  const e = ext(path);
  if (SKIP_EXTS.has(e)) return false;

  // Binary sniff: a NUL byte in the first 8KB is a strong signal
  const checkLen = Math.min(sample.length, 8192);
  for (let i = 0; i < checkLen; i++) if (sample[i] === 0) return false;

  // Minified-content sniff. A single line longer than ~1KB in the first 8KB
  // window is a near-certain signal of generated/minified output regardless of
  // filename (catches vendored libs that don't match the name patterns).
  let lineStart = 0;
  for (let i = 0; i < checkLen; i++) {
    if (sample[i] === 0x0a /* \n */) {
      if (i - lineStart > 1024) return false;
      lineStart = i + 1;
    }
  }
  if (checkLen - lineStart > 1024) return false;

  return true;
}

export function classifyFile(path: string): "readme" | "manifest" | "code" {
  const b = basename(path).toLowerCase();
  if (README_BASENAMES.has(b)) return "readme";
  if (b.endsWith(".md") || b.endsWith(".markdown") || b.endsWith(".rst")) return "readme";
  if (MANIFEST_BASENAMES.has(basename(path))) return "manifest";
  return "code";
}

// Decompose a file path into BM25-friendly tokens. Postgres' english parser
// keeps `app/vector/walkCodebase.ts` as opaque-ish tokens — splitting it into
// the parts a user is likely to type ("walk", "codebase", "vector") lets the
// BM25 corpus match natural-language queries that name the file in their own
// words. CamelCase, snake_case, kebab-case, and dotted segments all decompose.
function tokenizePathSegment(seg: string): string[] {
  const out = new Set<string>();
  // Split on non-alphanumerics first (`.`, `_`, `-`)
  for (const raw of seg.split(/[^A-Za-z0-9]+/)) {
    if (!raw) continue;
    out.add(raw.toLowerCase());
    // CamelCase + acronym-aware split: `walkCodebase` → walk, codebase;
    // `APIController` → api, controller; `URLParser` → url, parser.
    const parts = raw.match(/[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g);
    if (parts) for (const p of parts) if (p.length > 1) out.add(p.toLowerCase());
  }
  return [...out];
}

function pathTokens(path: string): string[] {
  const tokens = new Set<string>();
  for (const seg of path.split("/")) {
    for (const t of tokenizePathSegment(seg)) tokens.add(t);
  }
  return [...tokens];
}

function blobUrl(repoFullName: string, sha: string, path: string, line?: { start: number; end: number }) {
  const base = `https://github.com/${repoFullName}/blob/${sha}/${path}`;
  return line ? `${base}#L${line.start}-L${line.end}` : base;
}

function chunkReadme(repoFullName: string, sha: string, path: string, content: string): CodeChunk[] {
  const sections = content.split(/(?=^#{1,3} )/m).filter((s) => s.trim());
  const out: CodeChunk[] = [];
  const tokens = pathTokens(path).join(" ");
  const header = `# ${repoFullName} — ${path}\ntokens: ${tokens}\n\n`;

  const slices = sections.length ? sections : [content];
  for (const s of slices) {
    if (s.length <= MAX_SECTION_CHARS) {
      out.push({
        path,
        kind: "readme",
        text: header + s.trim(),
        chunkUrl: blobUrl(repoFullName, sha, path),
      });
    } else {
      for (let off = 0; off < s.length; off += MAX_SECTION_CHARS) {
        out.push({
          path,
          kind: "readme",
          text: header + s.slice(off, off + MAX_SECTION_CHARS).trim(),
          chunkUrl: blobUrl(repoFullName, sha, path),
        });
      }
    }
  }
  return out;
}

function chunkManifest(repoFullName: string, sha: string, path: string, content: string): CodeChunk[] {
  // Manifests are usually short. Keep them whole, with a header naming the file
  // so retrieval surfaces them on "what stack does this repo use" style questions.
  const trimmed = content.length > MAX_SECTION_CHARS * 2
    ? content.slice(0, MAX_SECTION_CHARS * 2) + "\n…(truncated)"
    : content;
  const tokens = pathTokens(path).join(" ");
  return [{
    path,
    kind: "manifest",
    text: `# ${repoFullName} — ${path} (manifest)\ntokens: ${tokens}\n\n${trimmed}`,
    chunkUrl: blobUrl(repoFullName, sha, path),
  }];
}

function chunkCode(repoFullName: string, sha: string, path: string, content: string): CodeChunk[] {
  const lines = content.split("\n");
  const out: CodeChunk[] = [];

  // Heuristic symbol picker: capture top-level function/class/method signatures
  // so the chunk header surfaces searchable names without needing tree-sitter.
  const symbolRegex = /\b(?:function|class|def|fn|interface|type|const|let|var)\s+([A-Za-z_$][\w$]*)/g;

  if (lines.length <= WINDOW_LINES) {
    const symbols = collectSymbols(content, symbolRegex);
    out.push({
      path,
      kind: "code",
      startLine: 1,
      endLine: lines.length,
      text: makeCodeChunkText(repoFullName, path, 1, lines.length, symbols, content),
      chunkUrl: blobUrl(repoFullName, sha, path, { start: 1, end: lines.length }),
    });
    return out;
  }

  let start = 0;
  while (start < lines.length) {
    const end = Math.min(start + WINDOW_LINES, lines.length);
    const slice = lines.slice(start, end).join("\n");
    const symbols = collectSymbols(slice, symbolRegex);
    out.push({
      path,
      kind: "code",
      startLine: start + 1,
      endLine: end,
      text: makeCodeChunkText(repoFullName, path, start + 1, end, symbols, slice),
      chunkUrl: blobUrl(repoFullName, sha, path, { start: start + 1, end }),
    });
    if (end >= lines.length) break;
    start = end - OVERLAP_LINES;
  }

  return out;
}

function collectSymbols(text: string, re: RegExp): string[] {
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    if (m[1]) seen.add(m[1]);
    if (seen.size >= 12) break;
  }
  return [...seen];
}

function makeCodeChunkText(repoFullName: string, path: string, startLine: number, endLine: number, symbols: string[], body: string) {
  const sym = symbols.length ? ` — ${symbols.join(", ")}` : "";
  // CamelCase-split the symbols too — `walkCodebase` should match queries
  // that say "walk" or "codebase". Path tokens cover filenames.
  const tokenSet = new Set<string>(pathTokens(path));
  for (const s of symbols) for (const t of tokenizePathSegment(s)) tokenSet.add(t);
  const tokens = [...tokenSet].join(" ");
  return `# ${repoFullName} — ${path}:L${startLine}-L${endLine}${sym}\ntokens: ${tokens}\n\n${body}`;
}

export function chunkFile(repoFullName: string, sha: string, path: string, content: string): CodeChunk[] {
  const kind = classifyFile(path);
  if (kind === "readme") return chunkReadme(repoFullName, sha, path, content);
  if (kind === "manifest") return chunkManifest(repoFullName, sha, path, content);
  return chunkCode(repoFullName, sha, path, content);
}

export function makeTreeChunk(repoFullName: string, sha: string, paths: string[]): CodeChunk {
  // Coarse "table of contents" chunk — helps retrieval answer
  // "where does X live" without semantic match on every file.
  const sorted = [...paths].sort();
  const capped = sorted.length > 500 ? [...sorted.slice(0, 500), `…(+${sorted.length - 500} more)`] : sorted;
  return {
    path: "(tree)",
    kind: "tree",
    text: `# ${repoFullName} — file tree\n\n${capped.join("\n")}`,
    chunkUrl: `https://github.com/${repoFullName}/tree/${sha}`,
  };
}
