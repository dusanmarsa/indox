-- CreateTable
CREATE TABLE "profiles" (
    "url" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "ingested_at" TIMESTAMP(3),
    "raw_data" JSONB,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("url")
);

-- CreateTable
CREATE TABLE "repos" (
    "url" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ingested_at" TIMESTAMP(3),
    "raw_data" JSONB,

    CONSTRAINT "repos_pkey" PRIMARY KEY ("url")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "chunk_url" TEXT,
    "embedding" BYTEA,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cached_answers" (
    "url" TEXT NOT NULL,
    "normalized_question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cached_answers_pkey" PRIMARY KEY ("url","normalized_question")
);

-- CreateTable
CREATE TABLE "usage_log" (
    "ip" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "query_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usage_log_pkey" PRIMARY KEY ("ip","date")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE INDEX "embeddings_url_idx" ON "embeddings"("url");
