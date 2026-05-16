// GitHub adapter driver: handles repos / user / org scopes. Enumerates which
// repos belong to the adapter, then indexes each by downloading the zipball,
// chunking, and embedding.

import { unzipSync, strFromU8 } from "fflate";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Adapter, Source } from "../../prisma/generated/client";
import { logger } from "../logger";
import { chunkFile, makeTreeChunk, shouldIndex, type CodeChunk } from "../chunker";
import { replaceSourceEmbeddings } from "../source-index";
import { decryptToken } from "../crypto";
import type {
  AdapterDriver,
  EnumeratedSource,
  GithubScope,
  GithubSourceMetadata,
} from "./types";

const embeddingModel = openai.embedding("text-embedding-3-small");
const EMBED_BATCH = 64;
const MAX_CHUNKS = 4000;
const EMBED_MAX_RETRIES = 10;
const TPM_BUDGET = 800_000;
const CHARS_PER_TOKEN = 4;
// text-embedding-3-small hard-rejects inputs over 8192 tokens. The chunker's
// 60-line code window is normally fine but blows up on minified or single-line
// files (giant JSON literals, generated bundles, base64 blobs). Clip to a
// conservative char budget — code can be denser than the 4 chars/token guess.
const MAX_CHUNK_CHARS = 24000;
const ENUMERATE_CAP = 100; // safety: avoid enumerating thousands of repos

// ─── scope validation ────────────────────────────────────────────────────────

const githubScopeSchema = z.discriminatedUnion("mode", [
  // Empty repos array is allowed: adapter created without picking repos yet,
  // user will add them later via the manage page.
  z.object({ mode: z.literal("repos"), value: z.array(z.string().min(1)) }),
  z.object({ mode: z.literal("user"), value: z.string().min(1) }),
  z.object({ mode: z.literal("org"), value: z.string().min(1) }),
]);

function parseScope(raw: unknown): GithubScope {
  return githubScopeSchema.parse(raw);
}

// ─── github API helpers ──────────────────────────────────────────────────────

type GithubRepoRow = {
  full_name: string;
  name: string;
  owner: { login: string };
  default_branch: string;
  private: boolean;
};

async function ghFetch(path: string, token: string): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "indox-adapter",
    },
  });
}

async function ghGetRepo(token: string, owner: string, name: string): Promise<GithubRepoRow> {
  const res = await ghFetch(`/repos/${owner}/${name}`, token);
  if (!res.ok) throw new Error(`github: GET /repos/${owner}/${name} → ${res.status}`);
  return (await res.json()) as GithubRepoRow;
}

async function ghListRepos(token: string, basePath: string): Promise<GithubRepoRow[]> {
  const out: GithubRepoRow[] = [];
  let page = 1;
  while (out.length < ENUMERATE_CAP) {
    const res = await ghFetch(`${basePath}?per_page=100&page=${page}`, token);
    if (!res.ok) throw new Error(`github: GET ${basePath} → ${res.status}`);
    const batch = (await res.json()) as GithubRepoRow[];
    if (!batch.length) break;
    out.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return out.slice(0, ENUMERATE_CAP);
}

// Resolve a single "owner/name" to an EnumeratedSource. Used by the dashboard
// when the user adds one repo to an existing adapter without re-enumerating
// the adapter's whole scope.
export async function resolveGithubRepo(
  token: string,
  fullName: string,
): Promise<EnumeratedSource> {
  const [owner, name] = fullName.split("/");
  if (!owner || !name) throw new Error(`bad repo spec "${fullName}", expected owner/name`);
  const r = await ghGetRepo(token, owner, name);
  return {
    externalId: `${r.owner.login}/${r.name}`.toLowerCase(),
    displayName: `github.com/${r.owner.login}/${r.name}`,
    metadata: {
      owner: r.owner.login,
      name: r.name,
      defaultBranch: r.default_branch,
    } satisfies GithubSourceMetadata,
  };
}

// Public helper used by the dashboard's "pick repos" UX when adding an
// adapter in user/org mode. Returns lightweight rows for selection.
export async function listGithubRepos(
  token: string,
  scope: { mode: "user" | "org"; value: string },
): Promise<Array<{ fullName: string; defaultBranch: string; private: boolean }>> {
  const path = scope.mode === "user"
    ? `/users/${scope.value}/repos`
    : `/orgs/${scope.value}/repos`;
  const rows = await ghListRepos(token, path);
  return rows.map((r) => ({
    fullName: r.full_name,
    defaultBranch: r.default_branch,
    private: r.private,
  }));
}

// ─── enumerate ────────────────────────────────────────────────────────────────

async function enumerate(adapter: Adapter): Promise<EnumeratedSource[]> {
  const scope = parseScope(adapter.scope);
  const token = decryptToken(adapter.token);

  let rows: GithubRepoRow[];
  if (scope.mode === "repos") {
    rows = await Promise.all(
      scope.value.map(async (full) => {
        const [owner, name] = full.split("/");
        if (!owner || !name) throw new Error(`bad repo spec "${full}", expected owner/name`);
        return ghGetRepo(token, owner, name);
      }),
    );
  } else {
    const basePath = scope.mode === "user"
      ? `/users/${scope.value}/repos`
      : `/orgs/${scope.value}/repos`;
    rows = await ghListRepos(token, basePath);
  }

  return rows.map((r) => ({
    externalId: `${r.owner.login}/${r.name}`.toLowerCase(),
    displayName: `github.com/${r.owner.login}/${r.name}`,
    metadata: {
      owner: r.owner.login,
      name: r.name,
      defaultBranch: r.default_branch,
    } satisfies GithubSourceMetadata,
  }));
}

// ─── indexSource: zip → chunk → embed → persist ───────────────────────────────

async function fetchZip(
  token: string,
  owner: string,
  name: string,
  defaultBranch: string,
): Promise<{ zip: Uint8Array; sha: string }> {
  const url = `https://api.github.com/repos/${owner}/${name}/zipball/${defaultBranch}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, "User-Agent": "indox-adapter" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`zip download failed: ${res.status} ${res.statusText}`);
  const shaMatch = res.url.match(/\/([0-9a-f]{40})(?:\.zip)?$/i);
  const sha = shaMatch ? shaMatch[1] : res.url.split("/").pop() ?? "unknown";
  const buf = new Uint8Array(await res.arrayBuffer());
  return { zip: buf, sha };
}

function extractChunks(
  owner: string,
  name: string,
  sha: string,
  zip: Uint8Array,
): CodeChunk[] {
  const fullName = `${owner}/${name}`;
  const files = unzipSync(zip, { filter: (f) => !f.name.endsWith("/") });
  const entries = Object.entries(files);
  const prefix = entries.length ? entries[0][0].split("/")[0] + "/" : "";

  const chunks: CodeChunk[] = [];
  const indexedPaths: string[] = [];

  for (const [entryName, data] of entries) {
    const path = entryName.startsWith(prefix) ? entryName.slice(prefix.length) : entryName;
    if (!path) continue;
    if (!shouldIndex(path, data.byteLength, data)) continue;

    let content: string;
    try {
      content = strFromU8(data);
    } catch {
      continue;
    }
    indexedPaths.push(path);
    for (const c of chunkFile(fullName, sha, path, content)) {
      if (c.text.length > MAX_CHUNK_CHARS) {
        c.text = c.text.slice(0, MAX_CHUNK_CHARS) + "\n…(truncated)";
      }
      chunks.push(c);
    }

    if (chunks.length >= MAX_CHUNKS) {
      logger.warn("github", `${fullName}: chunk cap (${MAX_CHUNKS}) hit, stopping early`);
      break;
    }
  }

  chunks.unshift(makeTreeChunk(fullName, sha, indexedPaths));
  return chunks;
}

async function embedChunks(chunks: CodeChunk[]): Promise<number[][]> {
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
      logger.info("github", `embed pacing: ${used}/${TPM_BUDGET} TPM used, sleeping ${waitMs}ms`);
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

async function indexSource(
  adapter: Adapter,
  source: Source,
): Promise<{ chunkCount: number; metadata: GithubSourceMetadata }> {
  const meta = source.metadata as GithubSourceMetadata | null;
  if (!meta?.owner || !meta?.name || !meta?.defaultBranch) {
    throw new Error(`source ${source.id} missing github metadata`);
  }

  logger.info("github", `indexing ${meta.owner}/${meta.name}@${meta.defaultBranch}`);
  const { zip, sha } = await fetchZip(decryptToken(adapter.token), meta.owner, meta.name, meta.defaultBranch);
  const chunks = extractChunks(meta.owner, meta.name, sha, zip);
  const vectors = await embedChunks(chunks);

  await replaceSourceEmbeddings(
    source.id,
    chunks.map((c, i) => ({
      chunkText: c.text,
      chunkUrl: c.chunkUrl,
      vector: vectors[i],
    })),
  );
  logger.info("github", `persisted ${chunks.length} embeddings for ${meta.owner}/${meta.name}@${sha.slice(0, 7)}`);

  return {
    chunkCount: chunks.length,
    metadata: { ...meta, sha },
  };
}

// ─── driver export ────────────────────────────────────────────────────────────

export const githubDriver: AdapterDriver<GithubScope> = {
  kind: "github",
  parseScope,
  enumerate,
  indexSource,
};
