-- Phase 3: public chat. Adds the columns that turn a workspace into a
-- public, embeddable chat surface (isPublic, BYO OpenAI key, model
-- selection, daily call ceiling) and a per-day usage counter table.

ALTER TABLE "workspaces"
  ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "openai_api_key_encrypted" TEXT,
  ADD COLUMN "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  ADD COLUMN "daily_call_limit" INTEGER NOT NULL DEFAULT 200;

CREATE TABLE "workspace_usage" (
  "workspace_id" TEXT NOT NULL,
  "ip"           TEXT NOT NULL,
  "date"         DATE NOT NULL,
  "count"        INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "workspace_usage_pkey"
    PRIMARY KEY ("workspace_id", "ip", "date"),
  CONSTRAINT "workspace_usage_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
);

CREATE INDEX "workspace_usage_workspace_date_idx"
  ON "workspace_usage"("workspace_id", "date");
