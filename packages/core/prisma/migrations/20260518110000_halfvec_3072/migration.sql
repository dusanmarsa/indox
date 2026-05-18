-- Switch embedding storage from vector(1536) to halfvec(3072) so we can
-- store the full text-embedding-3-large output instead of throwing half
-- the dimensions away to Matryoshka truncation.
--
-- pgvector's standard `vector` type caps HNSW at 2000 dimensions, which
-- ruled out vector(3072). halfvec is the half-precision (float16) variant:
-- HNSW supports it up to 4000 dimensions, storage stays identical to the
-- old vector(1536) (2 bytes × 3072 ≈ 4 bytes × 1536), and the precision
-- loss from float32 → float16 is below 0.1% on cosine similarity.
--
-- Existing embeddings are already invalid after the model swap (different
-- embedding space), so this migration drops the column outright; the
-- re-embed script (evals/_reembed.ts) repopulates with the new model.
-- Requires pgvector ≥ 0.7 (halfvec_cosine_ops). Verified 0.8.0 in prod.

DROP INDEX IF EXISTS "embeddings_embedding_hnsw_idx";
ALTER TABLE "embeddings" DROP COLUMN "embedding";
ALTER TABLE "embeddings" ADD COLUMN "embedding" halfvec(3072);

CREATE INDEX "embeddings_embedding_hnsw_idx"
  ON "embeddings" USING hnsw ("embedding" halfvec_cosine_ops);
