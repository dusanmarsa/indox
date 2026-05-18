// "Should we look at this file at all?" + "What flavour is it?"
//
// shouldIndex is the upstream gate every file passes through before the
// chunker ever runs. classifyFile picks which chunker strategy to dispatch
// (readme/manifest/code). Both are pure functions over path / size / a
// content sample — no I/O, no parser deps.

import { isVendoredPath } from "../vendor";
import { basename, ext } from "./path-tokens";

const MAX_FILE_BYTES = 200 * 1024;

// Paths whose presence inside means "skip this file".
const SKIP_DIR_PARTS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".cache",
  "out",
  "target",
  "vendor",
  "coverage",
  ".venv",
  "venv",
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  ".idea",
  ".vscode",
  ".gradle",
  ".dart_tool",
  "bin",
  "obj",
]);

// Lockfiles & generated files (case-sensitive match on basename).
const SKIP_BASENAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "Cargo.lock",
  "Gemfile.lock",
  "Pipfile.lock",
  "poetry.lock",
  "composer.lock",
  "go.sum",
]);

const SKIP_EXTS = new Set([
  // images / fonts / video / audio
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "bmp",
  "tiff",
  "svg",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
  "mp4",
  "mov",
  "webm",
  "avi",
  "mkv",
  "mp3",
  "wav",
  "ogg",
  "flac",
  // archives / binaries
  "zip",
  "gz",
  "tar",
  "bz2",
  "xz",
  "7z",
  "rar",
  "exe",
  "dll",
  "so",
  "dylib",
  "wasm",
  "class",
  "jar",
  "pyc",
  "o",
  "a",
  "lib",
  "node",
  // data dumps
  "pdf",
  "psd",
  "ai",
  "sketch",
]);

const MANIFEST_BASENAMES = new Set([
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "Gemfile",
  "composer.json",
  "build.gradle",
  "pom.xml",
  "setup.py",
  "requirements.txt",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
]);

const README_BASENAMES = new Set([
  "readme.md",
  "readme.markdown",
  "readme.rst",
  "readme.txt",
  "readme",
  "contributing.md",
  "architecture.md",
  "design.md",
  "docs.md",
]);

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

  // Binary sniff: a NUL byte in the first 8KB is a strong signal.
  const checkLen = Math.min(sample.length, 8192);
  for (let i = 0; i < checkLen; i++) if (sample[i] === 0) return false;

  // Minified-content sniff. A single line longer than ~1KB in the first 8KB
  // window is a near-certain signal of generated/minified output regardless
  // of filename (catches vendored libs that don't match the name patterns).
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

import type { ContentShape } from "./types";

// Map a file path to a content shape using filename / extension heuristics.
// Adapters can use this as a quick classifier for file-system-shaped sources
// (GitHub, GitLab, local dirs); adapters with native structural metadata
// (Notion blocks, Confluence pages) should pick the shape themselves and
// skip this helper.
export function defaultShape(path: string): ContentShape {
  const b = basename(path).toLowerCase();
  if (README_BASENAMES.has(b)) return "prose";
  if (b.endsWith(".md") || b.endsWith(".markdown") || b.endsWith(".rst")) return "prose";
  if (MANIFEST_BASENAMES.has(basename(path))) return "blob";
  return "code";
}
