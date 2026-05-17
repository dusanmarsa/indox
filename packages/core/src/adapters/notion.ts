// Notion adapter driver. Each Source = one Notion page. We fetch the page
// as markdown via the official @notionhq/client and let the prose chunker
// section it by heading. Citations point at https://notion.so/<page-id>.
//
// Auth: internal integration token (secret_…). User creates an integration
// at https://notion.so/my-integrations, shares the target pages with it, and
// pastes the secret. Stored encrypted at rest by the API layer.

import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  BlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Adapter, Source } from "../../prisma/generated/client";
import { logger } from "../logger";
import { chunkContent, type Chunk, type ContentItem } from "../chunker";
import { replaceSourceEmbeddings } from "../source-index";
import { decryptToken } from "../crypto";
import type {
  AdapterDriver,
  EnumeratedSource,
  NotionScope,
  NotionSourceMetadata,
} from "./types";

const embeddingModel = openai.embedding("text-embedding-3-large");
const EMBED_BATCH = 64;
const MAX_CHUNKS = 4000;
const EMBED_MAX_RETRIES = 10;
const TPM_BUDGET = 800_000;
const CHARS_PER_TOKEN = 4;
const MAX_CHUNK_CHARS = 24000;
const SEARCH_CAP = 200;
const MAX_BLOCK_DEPTH = 8;
const MAX_PAGES_PER_SOURCE = 200;
const MAX_PAGE_DEPTH = 6;

// ─── scope validation ────────────────────────────────────────────────────────

const notionScopeSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("pages"), value: z.array(z.string().min(1)) }),
  z.object({ mode: z.literal("search") }),
]);

function parseScope(raw: unknown): NotionScope {
  return notionScopeSchema.parse(raw);
}

// ─── id helpers ──────────────────────────────────────────────────────────────

// Notion page IDs are 32 hex chars. Pages copied from the URL may appear with
// or without dashes, and may carry a trailing slug before the id. We take the
// last matching 32-char hex run so a hex-heavy page title in the slug doesn't
// shadow the actual id.
function normalizePageId(input: string): string {
  const last = input.split(/[/?#]/).pop() ?? input;
  const matches = last.replace(/-/g, "").match(/[0-9a-f]{32}/gi);
  const hex = matches?.at(-1);
  if (!hex) throw new Error(`not a valid Notion page id: "${input}"`);
  return hex.toLowerCase();
}

function dashedId(hex32: string): string {
  return `${hex32.slice(0, 8)}-${hex32.slice(8, 12)}-${hex32.slice(12, 16)}-${hex32.slice(16, 20)}-${hex32.slice(20)}`;
}

function pageUrl(pageIdHex: string): string {
  return `https://www.notion.so/${pageIdHex}`;
}

// ─── client factory ──────────────────────────────────────────────────────────

function getClient(token: string): Client {
  return new Client({ auth: token });
}

// ─── page helpers ────────────────────────────────────────────────────────────

type FullPage = PageObjectResponse;

function isFullPage(p: PageObjectResponse | PartialPageObjectResponse): p is FullPage {
  return "properties" in p;
}

function extractTitle(page: FullPage): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && Array.isArray(prop.title)) {
      const joined = prop.title
        .map((t) => ("plain_text" in t ? t.plain_text : ""))
        .join("")
        .trim();
      if (joined) return joined;
    }
  }
  return "(untitled)";
}

async function getPage(notion: Client, pageId: string): Promise<FullPage> {
  const res = await notion.pages.retrieve({ page_id: dashedId(pageId) });
  if (!isFullPage(res)) throw new Error(`notion: page ${pageId} returned partial response`);
  return res;
}

async function searchPages(notion: Client): Promise<FullPage[]> {
  const out: FullPage[] = [];
  let cursor: string | undefined;
  while (out.length < SEARCH_CAP) {
    const res = await notion.search({
      filter: { property: "object", value: "page" },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    for (const r of res.results) {
      if (r.object === "page" && isFullPage(r)) out.push(r);
    }
    if (!res.has_more || !res.next_cursor) break;
    cursor = res.next_cursor;
  }
  return out.slice(0, SEARCH_CAP);
}

// ─── enumerate ───────────────────────────────────────────────────────────────

async function enumerate(adapter: Adapter): Promise<EnumeratedSource[]> {
  const scope = parseScope(adapter.scope);
  const notion = getClient(decryptToken(adapter.token));

  if (scope.mode === "pages") {
    return Promise.all(
      scope.value.map(async (raw) => {
        const pageId = normalizePageId(raw);
        const page = await getPage(notion, pageId);
        const title = extractTitle(page);
        return {
          externalId: pageId,
          displayName: title,
          metadata: {
            pageId,
            title,
            lastEditedTime: page.last_edited_time,
          } satisfies NotionSourceMetadata,
        };
      })
    );
  }

  const pages = await searchPages(notion);
  return pages.map((p) => {
    const pageId = normalizePageId(p.id);
    const title = extractTitle(p);
    return {
      externalId: pageId,
      displayName: title,
      metadata: {
        pageId,
        title,
        lastEditedTime: p.last_edited_time,
      } satisfies NotionSourceMetadata,
    };
  });
}

// ─── public helpers (used by API routes) ─────────────────────────────────────

export async function listNotionPages(
  token: string
): Promise<Array<{ pageId: string; title: string; lastEditedTime?: string }>> {
  const notion = getClient(token);
  const pages = await searchPages(notion);
  return pages.map((p) => ({
    pageId: normalizePageId(p.id),
    title: extractTitle(p),
    lastEditedTime: p.last_edited_time,
  }));
}

export async function resolveNotionPage(
  token: string,
  pageInput: string
): Promise<EnumeratedSource> {
  const pageId = normalizePageId(pageInput);
  const notion = getClient(token);
  const page = await getPage(notion, pageId);
  const title = extractTitle(page);
  return {
    externalId: pageId,
    displayName: title,
    metadata: {
      pageId,
      title,
      lastEditedTime: page.last_edited_time,
    } satisfies NotionSourceMetadata,
  };
}

// ─── child-page discovery ────────────────────────────────────────────────────

// Walk a block subtree collecting child_page / child_database IDs. We only
// recurse into blocks that have children and are safe to query — synced block
// duplicates (synced_from !== null) point at a different block id that the
// integration can't fetch, and link_to_page / unsupported blocks have no
// useful subtree. Everything else (columns, toggles, callouts …) may contain
// nested child pages so we recurse into them.
//
// Note: we are NOT rendering any content here — that's handled by
// retrieveMarkdown. This walk is purely for page-tree discovery.
function shouldRecurse(block: BlockObjectResponse): boolean {
  if (block.type === "unsupported" || block.type === "link_to_page") return false;
  if (block.type === "synced_block") {
    return block.synced_block.synced_from === null;
  }
  return true;
}

async function listChildPageIds(
  notion: Client,
  blockId: string,
  depth: number
): Promise<string[]> {
  if (depth > MAX_BLOCK_DEPTH) return [];
  const childPageIds: string[] = [];
  let cursor: string | undefined;
  // blockId may be a 32-char hex (from source metadata) or already a dashed
  // UUID (from block.id returned by the API). Normalise to dashed for the call.
  const dashedBlockId = dashedId(normalizePageId(blockId));

  do {
    const res = await notion.blocks.children.list({
      block_id: dashedBlockId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const raw of res.results) {
      if (!("type" in raw)) continue; // PartialBlockObjectResponse — skip
      const block = raw as BlockObjectResponse;

      if (block.type === "child_page" || block.type === "child_database") {
        childPageIds.push(normalizePageId(block.id));
        // Don't recurse into the child page itself — it becomes its own BFS node
        continue;
      }

      if (block.has_children && shouldRecurse(block)) {
        const nested = await listChildPageIds(notion, block.id, depth + 1);
        childPageIds.push(...nested);
      }
    }

    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);

  return childPageIds;
}

// ─── page → markdown ─────────────────────────────────────────────────────────

async function fetchPageMarkdown(
  notion: Client,
  pageId: string,
  title: string
): Promise<string> {
  const res = await notion.pages.retrieveMarkdown({ page_id: dashedId(pageId) });
  if (res.truncated) {
    logger.warn("notion", `page ${pageId} markdown was truncated by the API`);
  }
  if (res.unknown_block_ids.length > 0) {
    logger.warn(
      "notion",
      `page ${pageId}: ${res.unknown_block_ids.length} block(s) could not be rendered`
    );
  }
  return `# ${title}\n\n${res.markdown}`;
}

// ─── embed (shared shape with github) ────────────────────────────────────────

async function embedChunks(chunks: Chunk[]): Promise<number[][]> {
  const vectors: number[][] = new Array(chunks.length);
  const window: { at: number; tokens: number }[] = [];

  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH);
    const tokens = batch.reduce((s, c) => s + Math.ceil(c.text.length / CHARS_PER_TOKEN), 0);

    while (true) {
      const cutoff = Date.now() - 60_000;
      while (window.length && window[0].at < cutoff) window.shift();
      const used = window.reduce((s, e) => s + e.tokens, 0);
      if (used + tokens <= TPM_BUDGET) break;
      const waitMs = window[0].at + 60_000 - Date.now() + 250;
      logger.info("notion", `embed pacing: ${used}/${TPM_BUDGET} TPM used, sleeping ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, Math.max(waitMs, 250)));
    }

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batch.map((c) => c.text),
      maxRetries: EMBED_MAX_RETRIES,
    });
    for (let j = 0; j < embeddings.length; j++) vectors[i + j] = embeddings[j];
    window.push({ at: Date.now(), tokens });
  }

  return vectors;
}

// ─── indexSource ─────────────────────────────────────────────────────────────

async function indexSource(
  adapter: Adapter,
  source: Source
): Promise<{ chunkCount: number; metadata: NotionSourceMetadata }> {
  const meta = source.metadata as NotionSourceMetadata | null;
  if (!meta?.pageId) throw new Error(`source ${source.id} missing notion metadata`);

  const notion = getClient(decryptToken(adapter.token));
  const rootPage = await getPage(notion, meta.pageId);
  const rootTitle = extractTitle(rootPage);
  logger.info("notion", `indexing page tree ${meta.pageId} "${rootTitle}"`);

  // BFS the page tree. Each page becomes its own ContentItem so citations
  // point at the right page URL. listChildPageIds walks the block tree (for
  // discovery only); retrieveMarkdown fetches the rendered content — so
  // columns, synced blocks, toggles etc. are all handled correctly by
  // Notion's own renderer.
  const items: ContentItem[] = [];
  const visited = new Set<string>([meta.pageId]);
  const queue: Array<{ pageId: string; title: string; depth: number }> = [
    { pageId: meta.pageId, title: rootTitle, depth: 0 },
  ];
  let pagesRendered = 0;

  while (queue.length > 0 && pagesRendered < MAX_PAGES_PER_SOURCE) {
    const node = queue.shift()!;

    let body: string;
    try {
      body = await fetchPageMarkdown(notion, node.pageId, node.title);
    } catch (err) {
      logger.warn(
        "notion",
        `skipping ${node.pageId}: ${err instanceof Error ? err.message : err}`
      );
      continue;
    }

    const capturedPageId = node.pageId;
    items.push({
      sourceUri: `notion://${node.pageId}`,
      displayPath: node.title,
      headerPrefix: "notion",
      shape: "prose",
      body,
      citationUrl: () => pageUrl(capturedPageId),
    });
    pagesRendered++;

    if (node.depth + 1 > MAX_PAGE_DEPTH) continue;

    let childIds: string[];
    try {
      childIds = await listChildPageIds(notion, node.pageId, 0);
    } catch (err) {
      logger.warn(
        "notion",
        `child discovery failed for ${node.pageId}: ${err instanceof Error ? err.message : err}`
      );
      continue;
    }

    for (const childId of childIds) {
      if (visited.has(childId)) continue;
      visited.add(childId);
      let childTitle = "(untitled)";
      try {
        const childPage = await getPage(notion, childId);
        childTitle = extractTitle(childPage);
      } catch (err) {
        logger.warn(
          "notion",
          `child ${childId} metadata failed: ${err instanceof Error ? err.message : err}`
        );
      }
      queue.push({ pageId: childId, title: childTitle, depth: node.depth + 1 });
    }
  }

  if (queue.length > 0) {
    logger.warn(
      "notion",
      `${meta.pageId}: page cap (${MAX_PAGES_PER_SOURCE}) hit, ${queue.length} pages skipped`
    );
  }

  const chunks: Chunk[] = [];
  for (const item of items) {
    for (const c of chunkContent(item)) {
      if (c.text.length > MAX_CHUNK_CHARS) {
        c.text = c.text.slice(0, MAX_CHUNK_CHARS) + "\n…(truncated)";
      }
      chunks.push(c);
      if (chunks.length >= MAX_CHUNKS) break;
    }
    if (chunks.length >= MAX_CHUNKS) {
      logger.warn("notion", `${meta.pageId}: chunk cap (${MAX_CHUNKS}) hit, stopping`);
      break;
    }
  }

  const vectors = await embedChunks(chunks);
  await replaceSourceEmbeddings(
    source.id,
    chunks.map((c, i) => ({ chunkText: c.text, chunkUrl: c.url, vector: vectors[i] }))
  );
  logger.info(
    "notion",
    `persisted ${chunks.length} embeddings across ${pagesRendered} pages for ${meta.pageId}`
  );

  return {
    chunkCount: chunks.length,
    metadata: { pageId: meta.pageId, title: rootTitle, lastEditedTime: rootPage.last_edited_time },
  };
}

// ─── driver export ───────────────────────────────────────────────────────────

export const notionDriver: AdapterDriver<NotionScope> = {
  kind: "notion",
  parseScope,
  enumerate,
  indexSource,
};
