// Prose chunker — for content with section/heading structure. Source-agnostic:
// works for Markdown files, Notion pages, Confluence pages, any rich-text
// surface, as long as the adapter either:
//   (a) supplies a pre-parsed ProseStructure (sections + code blocks), or
//   (b) passes raw markdown-shaped text in `item.body` for the chunker to
//       walk via the fallback markdown parser below.
//
// Notion / Confluence adapters should do (a) — they have native block info
// that's more reliable than re-parsing markdown. The GitHub adapter does
// (b) for .md files.

import type {
  Chunk,
  ContentItem,
  ProseCodeBlock,
  ProseSection,
  ProseStructure,
} from "./types";
import { pathTokens } from "./path-tokens";

const MAX_SECTION_CHARS = 2400;
// Minimum code-block size to also emit as its own chunk. Below this we
// keep the block inline with the prose section — small snippets aren't
// useful on their own.
const MIN_STANDALONE_CODE_LINES = 8;

export function chunkProse(item: ContentItem): Chunk[] {
  const lines = item.body.split("\n");
  const tokens = pathTokens(item.displayPath).join(" ");

  const structure = item.proseStructure ?? walkMarkdown(lines);
  const out: Chunk[] = [];

  for (const sec of structure.sections) {
    const body = lines.slice(sec.startLine, sec.endLine).join("\n").trim();
    if (!body) continue;

    const breadcrumb = sec.breadcrumb.length ? sec.breadcrumb.join(" › ") : "(preamble)";
    const sectionHeader = `# ${item.headerPrefix} — ${item.displayPath} › ${breadcrumb}\ntokens: ${tokens}\n\n`;

    if (body.length <= MAX_SECTION_CHARS) {
      out.push({
        shape: "prose",
        text: sectionHeader + body,
        url: item.citationUrl(),
      });
    } else {
      // Long section: split, but try to break at paragraph boundaries
      // (a blank line) so we don't slice mid-sentence.
      let off = 0;
      while (off < body.length) {
        let take = Math.min(MAX_SECTION_CHARS, body.length - off);
        if (off + take < body.length) {
          const slice = body.slice(off, off + take);
          const lastBreak = slice.lastIndexOf("\n\n");
          if (lastBreak > MAX_SECTION_CHARS / 2) take = lastBreak;
        }
        out.push({
          shape: "prose",
          text: sectionHeader + body.slice(off, off + take).trim(),
          url: item.citationUrl(),
        });
        off += take;
      }
    }
  }

  // Also surface non-trivial code blocks as their own chunks. The prose
  // chunks above give context; this gives queries like "show me the SQL
  // that creates the embeddings table" a direct hit on the code itself.
  for (const block of structure.codeBlocks) {
    if (block.endLine - block.startLine < MIN_STANDALONE_CODE_LINES) continue;
    // Find which section this block lives in so the chunk header keeps
    // a meaningful breadcrumb instead of falling back to "(preamble)".
    const owningSection = structure.sections.find(
      (s) => block.startLine >= s.startLine && block.endLine <= s.endLine,
    );
    const breadcrumb = owningSection?.breadcrumb.length
      ? owningSection.breadcrumb.join(" › ")
      : "(preamble)";
    const codeHeader =
      `# ${item.headerPrefix} — ${item.displayPath} › ${breadcrumb} › code (${block.lang || "snippet"})\n` +
      `tokens: ${tokens}\n\n`;
    out.push({
      shape: "prose",
      text: codeHeader + lines.slice(block.startLine, block.endLine).join("\n"),
      url: item.citationUrl({ start: block.startLine + 1, end: block.endLine }),
    });
  }

  return out;
}

// ─── markdown fallback walker ─────────────────────────────────────────────
//
// Used when the adapter didn't supply a ProseStructure. Walks markdown text
// tracking fence state (so a "#" inside ``` doesn't trigger a fake section
// break) and a heading hierarchy stack. ATX headings only — setext (===/---
// underlines) are rare in tech docs and false-positive on table separators.

export function walkMarkdown(lines: string[]): ProseStructure {
  const sections: ProseSection[] = [];
  const codeBlocks: ProseCodeBlock[] = [];
  // Heading stack indexed by depth (1=H1, ...). Higher levels are
  // truncated when we see a shallower heading.
  const stack: string[] = [];
  let inFence = false;
  let fenceMarker = "";
  let fenceLang = "";
  let fenceStartLine = 0;
  let curStart = 0;
  let curBreadcrumb: string[] = [];

  const flushSection = (end: number) => {
    sections.push({ startLine: curStart, endLine: end, breadcrumb: [...curBreadcrumb] });
  };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const trimmed = ln.trimStart();

    // Fence tracking. A fence toggles state; the closing fence has to
    // match the opener (so a ``` inside a ~~~ block doesn't confuse us).
    const fenceMatch = trimmed.match(/^(```+|~~~+)(.*)$/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
        fenceLang = fenceMatch[2].trim();
        fenceStartLine = i + 1; // body starts after the fence line
      } else if (fenceMatch[1][0] === fenceMarker) {
        codeBlocks.push({ startLine: fenceStartLine, endLine: i, lang: fenceLang });
        inFence = false;
        fenceMarker = "";
        fenceLang = "";
      }
      continue;
    }
    if (inFence) continue;

    const headMatch = trimmed.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!headMatch) continue;
    const level = headMatch[1].length;
    const heading = headMatch[2].trim();

    if (i > curStart) flushSection(i);

    stack.length = level - 1;
    stack.push(heading);

    curStart = i;
    curBreadcrumb = [...stack];
  }
  flushSection(lines.length);

  return { sections, codeBlocks };
}
