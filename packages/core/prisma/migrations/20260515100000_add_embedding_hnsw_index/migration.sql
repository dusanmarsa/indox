-- HNSW index for fast approximate nearest-neighbor over pgvector. Without it,
-- `ORDER BY embedding <=> ...` falls back to a sequential scan + sort, which
-- dominates retrieval latency once a repo has more than a few thousand chunks.
-- Hybrid retrieval fires vector lookups multiple times per question, so this
-- compounds.
--
-- Index choice: HNSW > IVFFlat for our access pattern (small per-query K,
-- frequent updates per repo). vector_cosine_ops matches the `<=>` operator we
-- use in queries.
CREATE INDEX IF NOT EXISTS "embeddings_embedding_hnsw_idx"
  ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);
