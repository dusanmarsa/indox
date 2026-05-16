-- Generated tsvector column for BM25-style full-text search alongside the
-- existing pgvector ANN. Hybrid retrieval (vector + FTS, fused via RRF) catches
-- exact-identifier queries that embeddings miss.
ALTER TABLE "embeddings"
  ADD COLUMN "chunk_text_tsv" tsvector
    GENERATED ALWAYS AS (to_tsvector('english', "chunk_text")) STORED;

CREATE INDEX "embeddings_chunk_text_tsv_idx"
  ON "embeddings" USING GIN ("chunk_text_tsv");
