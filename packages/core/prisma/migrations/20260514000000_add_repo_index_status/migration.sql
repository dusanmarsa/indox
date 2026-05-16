-- AlterTable
ALTER TABLE "repos"
  ADD COLUMN "index_status"      TEXT,
  ADD COLUMN "index_started_at"  TIMESTAMP(3),
  ADD COLUMN "indexed_at"        TIMESTAMP(3),
  ADD COLUMN "index_sha"         TEXT,
  ADD COLUMN "index_chunk_count" INTEGER,
  ADD COLUMN "index_error"       TEXT;
