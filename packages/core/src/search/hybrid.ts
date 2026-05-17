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

// text-embedding-3-large at full 3072 dims. Stored as halfvec(3072) —
// pgvector's half-precision variant — which keeps storage per chunk
// identical to the old vector(1536) layout while letting HNSW index
// the full 3072-dim vectors (the standard `vector` type's HNSW caps at
// 2000 dims). float16 precision costs <0.1% on cosine similarity.
//
// OpenAI prices per input token, not per output dim, so the full 3072
// output costs the same as a Matryoshka-truncated 1536 — no reason to
// throw the extra dimensions away.
const embeddingModel = openai.embedding("text-embedding-3-large");

// Per-variant retrieval depth. The right chunk often sits at rank 16-20
// for terse queries; if it's outside the pool RRF can't recover it no
// matter how the other retrievers ranked it. HNSW search stays O(log n)
// at this depth, so widening is cheap.
const VECTOR_K = 25;
const BM25_K = 25;
const MAX_QUERY_VARIANTS = 3;

// What hybridSearch returns per hit. `url` is the citation URL the adapter
// produced at index time — the LLM must cite this verbatim rather than
// constructing one by hand (different adapters use different URL shapes,
// and SHA-pinning matters for github).
export type SearchHit = {
  text: string;
  url: string | null;
  // Retrieval confidence. `strong` means vector was clearly on-topic (or
  // both retrievers agreed on the file with a plausible vector distance).
  // `weak` means we surfaced a borderline match because no strong hit
  // came back — callers should caveat answers built from weak hits
  // rather than treat them as authoritative.
  confidence?: "strong" | "weak";
};

type ChunkRanked = Ranked<number, SearchHit>;

type Row = { id: number; chunk_text: string; chunk_url: string | null };
type VectorRow = Row & { distance: number };

// Stable, sha-independent file key extracted from a chunk URL. Two chunks
// from different sections of the same file share this key, so we can
// answer "did BM25 and vector agree on this *file*?" — which is the
// signal we actually want. Per-chunk-id cosign is too brittle: vector
// might rank `rrf.ts:L1-40`, BM25 might rank `rrf.ts:L41-80`, and a chunk-
// id check would call that disagreement.
const FILE_KEY_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/[^/]+\/([^#]+)/;
function fileKey(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(FILE_KEY_RE);
  return m ? `${m[1]}/${m[2]}/${m[3]}` : null;
}

// Cosine-distance floors for text-embedding-3-large at 3072 dims.
// Empirical distance bands on our corpus:
//   < 0.55  on-topic prose & code answers
//   0.55–0.70  borderline; right answer often sits here for terse or
//              casual phrasing ("wtf is rrf" → 0.55, "lost my token" → 0.66)
//   > 0.70  drift (e.g. auth schemas matching "delete my account" at 0.74)
//
// STRICT: vector alone is enough to call a chunk strong below this.
// RELAXED: cap for both the weak tier AND the file-cosign strong path —
//   a chunk that vector pinned far out but BM25 matched by accident
//   shouldn't get promoted to strong on lexical overlap alone.
const VECTOR_RELEVANCE_MAX_DISTANCE = 0.55;
const VECTOR_RELAXED_MAX_DISTANCE = 0.7;

// Minimum number of strong hits before we suppress the weak fallback entirely.
// One strong chunk is enough on its own; two or more means we definitely don't
// need to dilute the results with weaker ones.
const STRONG_HITS_SUFFICIENT = 2;

async function vectorSearch(
  vector: number[],
  limit: number,
  sourceIds?: string[]
): Promise<{ ranked: ChunkRanked[]; distanceById: Map<number, number> }> {
  const vectorStr = `[${vector.join(",")}]`;
  const rows =
    sourceIds && sourceIds.length
      ? await prisma.$queryRawUnsafe<VectorRow[]>(
          `SELECT id, chunk_text, chunk_url, (embedding <=> $2::halfvec)::float8 AS distance
         FROM embeddings
         WHERE source_id = ANY($1::text[])
         ORDER BY embedding <=> $2::halfvec
         LIMIT $3`,
          sourceIds,
          vectorStr,
          limit
        )
      : await prisma.$queryRawUnsafe<VectorRow[]>(
          `SELECT id, chunk_text, chunk_url, (embedding <=> $1::halfvec)::float8 AS distance
         FROM embeddings
         ORDER BY embedding <=> $1::halfvec
         LIMIT $2`,
          vectorStr,
          limit
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
  sourceIds?: string[]
): Promise<ChunkRanked[]> {
  // websearch_to_tsquery handles user-style input (spaces = AND, quoted
  // phrases, -negation). Returns nothing if the parsed query is empty,
  // which is safer than plainto_tsquery here.
  const rows =
    sourceIds && sourceIds.length
      ? await prisma.$queryRawUnsafe<Row[]>(
          `SELECT e.id, e.chunk_text, e.chunk_url
         FROM embeddings e, websearch_to_tsquery('english', $1) q
         WHERE e.source_id = ANY($3::text[]) AND e.chunk_text_tsv @@ q
         ORDER BY ts_rank(e.chunk_text_tsv, q) DESC
         LIMIT $2`,
          query,
          limit,
          sourceIds
        )
      : await prisma.$queryRawUnsafe<Row[]>(
          `SELECT e.id, e.chunk_text, e.chunk_url
         FROM embeddings e, websearch_to_tsquery('english', $1) q
         WHERE e.chunk_text_tsv @@ q
         ORDER BY ts_rank(e.chunk_text_tsv, q) DESC
         LIMIT $2`,
          query,
          limit
        );
  return rows.map((r, i) => ({
    id: r.id,
    rank: i + 1,
    meta: { text: r.chunk_text, url: r.chunk_url },
  }));
}

// Stop tokens that show up in every other question. Stripped before we
// pattern-match the query against chunk URLs — without this, "the" or
// "how" would match approximately every file path on earth.
const PATH_STOP_TOKENS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "of",
  "to",
  "in",
  "on",
  "at",
  "for",
  "with",
  "by",
  "from",
  "up",
  "out",
  "over",
  "and",
  "or",
  "but",
  "not",
  "if",
  "than",
  "then",
  "else",
  "that",
  "this",
  "these",
  "those",
  "i",
  "you",
  "we",
  "they",
  "it",
  "he",
  "she",
  "my",
  "your",
  "our",
  "their",
  "how",
  "does",
  "do",
  "did",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "can",
  "could",
  "should",
  "would",
  "will",
  "shall",
  "may",
  "might",
  "must",
  "much",
  "many",
  "some",
  "any",
  "all",
  "each",
  "every",
  "other",
  "such",
  "me",
  "us",
  "them",
  "also",
  "just",
  "only",
  "very",
  "really",
  "actually",
  "use",
  "uses",
  "used",
  "using",
  "way",
  "ways",
  "kind",
  "thing",
  "things",
  "get",
  "got",
  "make",
  "made",
  "set",
  "lot",
  "lots",
  "indox", // our own product name — too generic in indox's own paths
]);

// Strip common English suffixes so plural / participle forms still match
// singular path components. Naive on purpose — we only need it for path
// substring lookups, not for retrieval scoring.
//   "chunks"    → "chunk"   (matches chunker.ts)
//   "embedding" → "embed"   (matches embed-many call sites)
//   "queries"   → "query"
//   "applied"   → "appli"   (close enough; paths rarely contain "applied")
function stem(t: string): string {
  if (t.length < 5) return t;
  if (t.endsWith("ing")) return t.slice(0, -3);
  if (t.endsWith("ies")) return t.slice(0, -3) + "y";
  if (t.endsWith("es")) return t.slice(0, -2);
  if (t.endsWith("ed")) return t.slice(0, -2);
  if (t.endsWith("s")) return t.slice(0, -1);
  return t;
}

// Extract candidate tokens for path matching. Lowercased, alphanumeric,
// length ≥ 3, stop-words removed, then both the surface form AND a stem
// added so "chunks before embedding" gets "chunks", "chunk", "embedding",
// "embed". Dedup case-insensitively.
function extractPathTokens(...sources: string[]): string[] {
  const out = new Set<string>();
  for (const s of sources) {
    for (const raw of s.toLowerCase().split(/[^a-z0-9]+/)) {
      if (raw.length < 3 || PATH_STOP_TOKENS.has(raw)) continue;
      out.add(raw);
      const st = stem(raw);
      if (st !== raw && st.length >= 3) out.add(st);
    }
  }
  return [...out];
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
      // Pin temperature low so identical questions produce identical
      // variants run-to-run. The rewrite step is a translation, not a
      // brainstorm — randomness here just adds eval/cache-hit noise.
      temperature: 0,
      output: Output.object({
        schema: z.object({
          queries: z
            .array(z.string().min(1))
            .min(1)
            .max(2)
            .describe("Short search queries focused on terms likely to appear in the indexed content."),
        }),
      }),
      prompt: `The index contains a mix of source code (with identifiers, file names, manifests) and prose (notes, docs, transcripts, wiki pages). Rewrite the following question into 1-2 short search queries that are likely to appear *verbatim* in the indexed content. For code-shaped questions, prefer concrete identifiers, file names, or technical terms over conversational phrasing. For prose-shaped questions ("what does the page say about X", "summarise Y"), prefer topical keywords and proper nouns from the question — not a single generic word. Avoid one-word queries; they retrieve poorly.\n\nQuestion: ${question}`,
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
  opts: HybridSearchOptions = {}
): Promise<SearchHit[]> {
  const { rewrite = true, bm25 = true, sourceIds } = opts;
  const scope = sourceIds && sourceIds.length ? `${sourceIds.length} source(s)` : "all sources";
  logger.debug(
    "search",
    `hybrid search for "${question.slice(0, 60)}" across ${scope} (rewrite=${rewrite}, bm25=${bm25})`
  );

  const queries = rewrite ? await rewriteQuery(question) : [question];

  // One batched embedding call for all variants.
  const { embeddings: vectors } = await embedMany({
    model: embeddingModel,
    values: queries,
  });

  // Vector (+ optional BM25) in parallel for each variant. Track per-chunk
  // best vector distance so we can apply a relevance floor after fusion.
  const vectorResults = await Promise.all(
    queries.map((_, i) => vectorSearch(vectors[i], VECTOR_K, sourceIds))
  );
  const bm25Results = bm25
    ? await Promise.all(queries.map((q) => bm25Search(q, BM25_K, sourceIds)))
    : [];

  const bestVectorDistance = new Map<number, number>();
  // Cosign tracking lives at the file level — see fileKey() above for why.
  const fileByChunkId = new Map<number, string>();
  const seenInVectorByFile = new Set<string>();
  const seenInBm25ByFile = new Set<string>();
  for (const { distanceById, ranked } of vectorResults) {
    for (const [id, d] of distanceById) {
      const prev = bestVectorDistance.get(id);
      if (prev === undefined || d < prev) bestVectorDistance.set(id, d);
    }
    for (const r of ranked) {
      const f = fileKey(r.meta.url);
      if (f) {
        fileByChunkId.set(r.id, f);
        seenInVectorByFile.add(f);
      }
    }
  }
  for (const r of bm25Results) {
    for (const c of r) {
      const f = fileKey(c.meta.url);
      if (f) {
        fileByChunkId.set(c.id, f);
        seenInBm25ByFile.add(f);
      }
    }
  }

  // Path-token boost. Tokenize the question, then rank candidates that
  // already showed up in any retriever by how many of those tokens appear
  // in the chunk's URL. Acts as a third retrieval list that RRF folds in.
  // The point: when a user asks "how does indox chunk source files",
  // chunks under .../chunker.ts get lifted even if the rewrite never
  // produced "chunker" as a variant. Same idea rescues ratelimit, crypto,
  // etc — file paths carry topical signal the embedding can miss.
  // Pull tokens from both the original question and the rewrite variants.
  // Rewrites are where identifier-shaped guesses appear ("chunkFile",
  // "useAuth"), and those are exactly the tokens that match file paths.
  const tokens = extractPathTokens(question, ...queries);
  const pathRetrieval: ChunkRanked[] = [];
  if (tokens.length) {
    const candidates = new Map<number, ChunkRanked>();
    for (const v of vectorResults) for (const c of v.ranked) candidates.set(c.id, c);
    for (const r of bm25Results) for (const c of r) candidates.set(c.id, c);
    const matches: Array<{ chunk: ChunkRanked; hits: number }> = [];
    for (const chunk of candidates.values()) {
      const url = (chunk.meta.url ?? "").toLowerCase();
      if (!url) continue;
      let hits = 0;
      for (const t of tokens) if (url.includes(t)) hits++;
      if (hits > 0) matches.push({ chunk, hits });
    }
    matches.sort((a, b) => b.hits - a.hits);
    pathRetrieval.push(...matches.slice(0, VECTOR_K).map((m, i) => ({ ...m.chunk, rank: i + 1 })));
  }

  const retrievals: ChunkRanked[][] = [
    ...vectorResults.map((v) => v.ranked),
    ...bm25Results,
    ...(pathRetrieval.length ? [pathRetrieval] : []),
  ];
  const fused = fuse(retrievals);

  // Two-tier relevance scoring. Two routes into "strong":
  //   1. Vector alone is confident — d ≤ STRICT. Covers concept queries
  //      where BM25 misses because the answer chunk doesn't lexically
  //      overlap with the question.
  //   2. Vector and BM25 agreed on the same *file* AND vector wasn't
  //      outright distant — d ≤ RELAXED. The "same file" is the right
  //      grain (not the same chunk_id): a file is one bm25-rankable
  //      thing in our index, but the chunker splits it across many
  //      chunk rows, so vector might rank chunk_a and BM25 chunk_b of
  //      the same file. The distance cap stops "delete my account"
  //      lexical noise from being promoted on cosign alone.
  //
  // weak: any chunk inside RELAXED that didn't make strong.
  // drop: beyond RELAXED → silently filtered, refusal when nothing's left.
  const isStrong = (id: number): boolean => {
    const d = bestVectorDistance.get(id);
    if (d === undefined) return false;
    if (d <= VECTOR_RELEVANCE_MAX_DISTANCE) return true;
    const f = fileByChunkId.get(id);
    return (
      d <= VECTOR_RELAXED_MAX_DISTANCE &&
      f !== undefined &&
      seenInVectorByFile.has(f) &&
      seenInBm25ByFile.has(f)
    );
  };
  const isWeak = (id: number): boolean => {
    const d = bestVectorDistance.get(id);
    return d !== undefined && d <= VECTOR_RELAXED_MAX_DISTANCE;
  };

  const strong = fused.filter((c) => isStrong(c.id));
  const weak = fused.filter((c) => !isStrong(c.id) && isWeak(c.id));
  // No explicit refusal block needed — strong+weak emptying out IS the
  // refusal. The tier gates above already drop chunks beyond RELAXED, so
  // queries with no genuinely on-topic match (e.g. "how do i delete my
  // account" returning auth-schema chunks at d=0.73) naturally yield [].

  // Suppress the weak tier entirely when strong hits are sufficient — we
  // don't want to dilute a confident answer with weak matches.
  const useWeak = strong.length < STRONG_HITS_SUFFICIENT;
  const picked: Array<{ ranked: Fused<number, SearchHit>; tier: "strong" | "weak" }> = [
    ...strong.map((r) => ({ ranked: r, tier: "strong" as const })),
    ...(useWeak ? weak.map((r) => ({ ranked: r, tier: "weak" as const })) : []),
  ].slice(0, limit);

  logger.debug(
    "search",
    `fused ${fused.length} → ${strong.length} strong + ${useWeak ? weak.length : 0} weak (suppressed=${!useWeak}) → top ${picked.length} (${queries.length} variants)`
  );

  return picked.map(({ ranked, tier }) => ({ ...ranked.meta, confidence: tier }));
}
