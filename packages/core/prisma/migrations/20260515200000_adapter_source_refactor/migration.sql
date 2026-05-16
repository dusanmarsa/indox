-- Adapter/Source refactor: ingestion is now driven by configured Adapters that
-- enumerate Sources (repos, spaces, …). Embeddings rekey from a stringy URL to
-- Source.id with proper FK + cascade. Old data is wiped — confirmed acceptable
-- since the prior model conflated chat triggering with indexing.

-- 1. Drop dependent indexes on embeddings before mutating the table.
DROP INDEX IF EXISTS "embeddings_url_idx";
DROP INDEX IF EXISTS "embeddings_chunk_text_tsv_idx";
DROP INDEX IF EXISTS "embeddings_embedding_hnsw_idx";

-- 2. Drop old tables. `repos` and `cached_answers` are tied to the URL-keyed
--    flow and are easier to recreate than to migrate.
DROP TABLE IF EXISTS "cached_answers";
DROP TABLE IF EXISTS "embeddings";
DROP TABLE IF EXISTS "repos";

-- 3. Adapter: configured connection to an external source. Token is plaintext
--    for now (encryption is a follow-up).
CREATE TABLE "adapters" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "auth_identity" TEXT,
    "token" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "last_synced_at" TIMESTAMP(3),
    "sync_status" TEXT,
    "sync_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adapters_pkey" PRIMARY KEY ("id")
);

-- 4. Source: one indexable thing under an Adapter (a repo, a space, …).
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "adapter_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "metadata" JSONB,
    "index_status" TEXT,
    "indexed_at" TIMESTAMP(3),
    "index_error" TEXT,
    "chunk_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sources_adapter_id_external_id_key" ON "sources"("adapter_id", "external_id");
CREATE INDEX "sources_adapter_id_idx" ON "sources"("adapter_id");

ALTER TABLE "sources"
  ADD CONSTRAINT "sources_adapter_id_fkey"
  FOREIGN KEY ("adapter_id") REFERENCES "adapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Recreate embeddings keyed by source_id. Preserves the tsvector generated
--    column + GIN index and the HNSW vector index from earlier migrations.
CREATE TABLE "embeddings" (
    "id" SERIAL NOT NULL,
    "source_id" TEXT NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "chunk_url" TEXT,
    "embedding" vector(1536),
    "chunk_text_tsv" tsvector GENERATED ALWAYS AS (to_tsvector('english', "chunk_text")) STORED,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "embeddings_source_id_idx" ON "embeddings"("source_id");
CREATE INDEX "embeddings_chunk_text_tsv_idx" ON "embeddings" USING GIN ("chunk_text_tsv");
CREATE INDEX IF NOT EXISTS "embeddings_embedding_hnsw_idx"
  ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);

ALTER TABLE "embeddings"
  ADD CONSTRAINT "embeddings_source_id_fkey"
  FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
