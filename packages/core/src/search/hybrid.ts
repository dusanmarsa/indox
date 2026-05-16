// Hybrid retrieval: vector ANN catches semantic matches; Postgres FTS catches
// exact identifier matches that embeddings miss. A small LLM call rewrites the
// user's question into a couple of code-shaped variants so we pull a wider net
// of candidates. Everything is fused via RRF — no score calibration needed.

import { embedMany, generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import prisma from "../db";
import { logger } from "../logger";
import { fuse, type Ranked, type Fused } from "./rrf";

const embeddingModel = openai.embedding("text-embedding-3-small");

const VECTOR_K = 15;
const BM25_K = 15;
const MAX_QUERY_VARIANTS = 3;

// What we return per chunk. `url` is the SHA-pinned blob URL written at index
// time — the LLM must cite this rather than constructing /blob/main/... by
// hand (which silently breaks on repos whose default branch is "master" or
// anything else, or on repos where main has since moved).
export type Chunk = {
  text: string;
  url: string | null;
  // Retrieval confidence. `strong` means at least one paradigm (vector or
  // bm25, ideally both) clearly matched. `weak` means we relaxed the floor
  // because nothing strong came back — callers should caveat answers built
  // from weak chunks rather than treat them as authoritative.
  confidence?: "strong" | "weak";
};

type ChunkRanked = Ranked<number, Chunk>;

type Row = { id: number; chunk_text: string; chunk_url: string | null };
type VectorRow = Row & { distance: number };

// Cosine-distance cutoff for a vector match to count as "actually about" the
// query (not just thematically nearby). text-embedding-3-small puts genuinely
// on-topic chunks well below this; matches above 0.5 are usually the model
// grasping at format/topic overlap (e.g. "yaml" → any json/yaml file).
const VECTOR_RELEVANCE_MAX_DISTANCE = 0.5;

// Relaxed cutoff used as a fallback when nothing crosses the strict floor.
// Chunks between STRICT and RELAXED come back tagged `confidence: "weak"`
// instead of being dropped, so the model can still produce a hedged answer
// (or honestly say "the closest I found was X — not certain") for prose-y
// queries on code-heavy corpora where the strict floor is too tight.
const VECTOR_RELAXED_MAX_DISTANCE = 0.65;

// Minimum number of strong hits before we suppress the weak fallback entirely.
// One strong chunk is enough on its own; two or more means we definitely don't
// need to dilute the results with weaker ones.
const STRONG_HITS_SUFFICIENT = 2;

async function vectorSearch(
  vector: number[],
  limit: number,
  sourceIds?: string[],
): Promise<{ ranked: ChunkRanked[]; distanceById: Map<number, number> }> {
  const vectorStr = `[${vector.join(",")}]`;
  const rows = sourceIds && sourceIds.length
    ? await prisma.$queryRawUnsafe<VectorRow[]>(
        `SELECT id, chunk_text, chunk_url, (embedding <=> $2::vector)::float8 AS distance
         FROM embeddings
         WHERE source_id = ANY($1::text[])
         ORDER BY embedding <=> $2::vector
         LIMIT $3`,
        sourceIds,
        vectorStr,
        limit,
      )
    : await prisma.$queryRawUnsafe<VectorRow[]>(
        `SELECT id, chunk_text, chunk_url, (embedding <=> $1::vector)::float8 AS distance
         FROM embeddings
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        vectorStr,
        limit,
      );
  const distanceById = new Map<number, number>();
  for (const r of rows) distanceById.set(r.id, r.distance);
  return {
    ranked: rows.map((r, i) => ({
      id: r.id,
      rank: i + 1,
      meta: { text: r.chunk_text, url: r.chunk_url },
    })),
    distanceById,
  };
}

async function bm25Search(
  query: string,
  limit: number,
  sourceIds?: string[],
): Promise<ChunkRanked[]> {
  // websearch_to_tsquery handles user-style input (spaces = AND, quoted
  // phrases, -negation). Returns nothing if the parsed query is empty,
  // which is safer than plainto_tsquery here.
  const rows = sourceIds && sourceIds.length
    ? await prisma.$queryRawUnsafe<Row[]>(
        `SELECT e.id, e.chunk_text, e.chunk_url
         FROM embeddings e, websearch_to_tsquery('english', $1) q
         WHERE e.source_id = ANY($3::text[]) AND e.chunk_text_tsv @@ q
         ORDER BY ts_rank(e.chunk_text_tsv, q) DESC
         LIMIT $2`,
        query,
        limit,
        sourceIds,
      )
    : await prisma.$queryRawUnsafe<Row[]>(
        `SELECT e.id, e.chunk_text, e.chunk_url
         FROM embeddings e, websearch_to_tsquery('english', $1) q
         WHERE e.chunk_text_tsv @@ q
         ORDER BY ts_rank(e.chunk_text_tsv, q) DESC
         LIMIT $2`,
        query,
        limit,
      );
  return rows.map((r, i) => ({
    id: r.id,
    rank: i + 1,
    meta: { text: r.chunk_text, url: r.chunk_url },
  }));
}

// Identifier-shaped questions ("chatRatelimit", "PUT /api/users", "useFoo")
// don't benefit from rewriting — BM25 already nails them and the LLM call
// just adds latency. Skip rewrite when the query is short, single-tokenish,
// or already looks like code.
function looksLikeIdentifier(question: string): boolean {
  const q = question.trim();
  if (q.length < 4) return true;
  if (q.length < 40 && !/\s/.test(q)) return true;
  if (/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+$/.test(q)) return true; // foo.bar.baz
  if (/^(GET|POST|PUT|PATCH|DELETE)\s+\/\S+$/i.test(q)) return true;
  return false;
}

async function rewriteQuery(question: string): Promise<string[]> {
  if (looksLikeIdentifier(question)) {
    logger.debug("search", `skipping rewrite for identifier-shaped query "${question}"`);
    return [question];
  }
  try {
    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({
        schema: z.object({
          queries: z
            .array(z.string().min(1))
            .min(1)
            .max(2)
            .describe("Short search queries focused on code symbols, identifiers, and concepts."),
        }),
      }),
      prompt:
        `Rewrite the following question into 1-2 short search queries that are likely to appear in source code, READMEs, or manifests. Prefer concrete identifiers, file names, or technical terms over conversational phrasing.\n\nQuestion: ${question}`,
    });
    // Always include the original — sometimes the user's phrasing is already
    // the best query. Dedup case-insensitively and cap the fan-out.
    const all = [question, ...output.queries.map((q) => q.trim()).filter(Boolean)];
    const seen = new Set<string>();
    return all
      .filter((q) => {
        const k = q.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, MAX_QUERY_VARIANTS);
  } catch (e) {
    logger.warn("search", `query rewrite failed, using raw question: ${(e as Error).message}`);
    return [question];
  }
}

export type HybridSearchOptions = {
  // Set false on prose-heavy corpora (e.g. profile metadata + READMEs) where
  // the LLM rewrite call adds ~500-800ms of latency for little recall gain.
  rewrite?: boolean;
  // Set false where identifier matching doesn't help — same prose case as
  // above. Saves the parallel FTS query.
  bm25?: boolean;
  // Restrict retrieval to a subset of indexed sources. Omitted = search all.
  sourceIds?: string[];
};

export async function hybridSearch(
  question: string,
  limit = 8,
  opts: HybridSearchOptions = {},
): Promise<Chunk[]> {
  const { rewrite = true, bm25 = true, sourceIds } = opts;
  const scope = sourceIds && sourceIds.length ? `${sourceIds.length} source(s)` : "all sources";
  logger.debug(
    "search",
    `hybrid search for "${question.slice(0, 60)}" across ${scope} (rewrite=${rewrite}, bm25=${bm25})`,
  );

  const queries = rewrite ? await rewriteQuery(question) : [question];

  // One batched embedding call for all variants.
  const { embeddings: vectors } = await embedMany({ model: embeddingModel, values: queries });

  // Vector (+ optional BM25) in parallel for each variant. Track per-chunk
  // best vector distance so we can apply a relevance floor after fusion.
  const vectorResults = await Promise.all(
    queries.map((_, i) => vectorSearch(vectors[i], VECTOR_K, sourceIds)),
  );
  const bm25Results = bm25
    ? await Promise.all(queries.map((q) => bm25Search(q, BM25_K, sourceIds)))
    : [];

  const bestVectorDistance = new Map<number, number>();
  const seenInVector = new Set<number>();
  const seenInBm25 = new Set<number>();
  for (const { distanceById, ranked } of vectorResults) {
    for (const [id, d] of distanceById) {
      const prev = bestVectorDistance.get(id);
      if (prev === undefined || d < prev) bestVectorDistance.set(id, d);
    }
    for (const r of ranked) seenInVector.add(r.id);
  }
  for (const r of bm25Results) for (const c of r) seenInBm25.add(c.id);

  const retrievals: ChunkRanked[][] = [
    ...vectorResults.map((v) => v.ranked),
    ...bm25Results,
  ];
  const fused = fuse(retrievals);

  // Two-tier relevance scoring:
  //   strong: BOTH retrievers hit OR cosine distance ≤ STRICT (0.5). High
  //     confidence the chunk is actually about the question.
  //   weak:   not strong, but cosine distance ≤ RELAXED (0.65). Plausible
  //     match worth surfacing only if we have no strong hits — otherwise
  //     it just dilutes the answer.
  // Anything beyond RELAXED is dropped (truly off-topic).
  const isStrong = (id: number): boolean => {
    if (seenInVector.has(id) && seenInBm25.has(id)) return true;
    const d = bestVectorDistance.get(id);
    return d !== undefined && d <= VECTOR_RELEVANCE_MAX_DISTANCE;
  };
  const isWeak = (id: number): boolean => {
    const d = bestVectorDistance.get(id);
    return d !== undefined && d <= VECTOR_RELAXED_MAX_DISTANCE;
  };

  const strong = fused.filter((c) => isStrong(c.id));
  const weak = fused.filter((c) => !isStrong(c.id) && isWeak(c.id));

  // Suppress the weak tier entirely when strong hits are sufficient — we
  // don't want to dilute a confident answer with weak matches.
  const useWeak = strong.length < STRONG_HITS_SUFFICIENT;
  const picked: Array<{ ranked: Fused<number, Chunk>; tier: "strong" | "weak" }> = [
    ...strong.map((r) => ({ ranked: r, tier: "strong" as const })),
    ...(useWeak ? weak.map((r) => ({ ranked: r, tier: "weak" as const })) : []),
  ].slice(0, limit);

  logger.debug(
    "search",
    `fused ${fused.length} → ${strong.length} strong + ${useWeak ? weak.length : 0} weak (suppressed=${!useWeak}) → top ${picked.length} (${queries.length} variants)`,
  );

  return picked.map(({ ranked, tier }) => ({ ...ranked.meta, confidence: tier }));
}
