/*
  Warnings:

  - You are about to alter the column `embedding` on the `embeddings` table. The data in that column could be lost. The data in that column will be cast from `ByteA` to `Unsupported("vector(1536)")`.

*/
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "embeddings" DROP COLUMN "embedding";
ALTER TABLE "embeddings" ADD COLUMN "embedding" vector(1536);
