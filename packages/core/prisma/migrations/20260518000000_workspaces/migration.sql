-- Introduce workspaces (Tier 1: single owner). Backfills every existing
-- user with a "Default" workspace, moves their adapters / conversations /
-- mcp token into it, then drops the old ownerKey columns.
--
-- IDEMPOTENCY: this migration is destructive on the schema side (drops
-- adapters.owner_key, conversations.owner_key, users.mcp_token); rolling it
-- back requires restoring from backup, not just reversing SQL.

-- ─── 1. Create new tables ────────────────────────────────────────────────

CREATE TABLE "workspaces" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "owner_id"   TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "slug"       TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workspaces_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "workspaces_slug_key"   ON "workspaces"("slug");
CREATE        INDEX "workspaces_owner_idx"  ON "workspaces"("owner_id");

CREATE TABLE "workspace_tokens" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "user_id"       TEXT NOT NULL,
  "token"         TEXT NOT NULL,
  "label"         TEXT,
  "workspace_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workspace_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "workspace_tokens_token_key"  ON "workspace_tokens"("token");
CREATE        INDEX "workspace_tokens_user_idx"   ON "workspace_tokens"("user_id");

-- ─── 2. One "Default" workspace per existing user ────────────────────────
-- The slug embeds the user id so it stays unique without collision logic.
-- gen_random_uuid()-based cuids aren't available in plain SQL; we use the
-- user id as the workspace id so the mapping is trivially recoverable if
-- something downstream needs to backfill again.

INSERT INTO "workspaces" ("id", "owner_id", "name", "slug", "updated_at")
SELECT
  'ws_' || "id"             AS id,
  "id"                      AS owner_id,
  'Default'                 AS name,
  'default-' || "id"        AS slug,
  CURRENT_TIMESTAMP         AS updated_at
FROM "users";

-- ─── 3. Adapters: add workspace_id, backfill, drop owner_key ─────────────

ALTER TABLE "adapters" ADD COLUMN "workspace_id" TEXT;

UPDATE "adapters" a
SET    "workspace_id" = 'ws_' || a."owner_key"
WHERE  a."owner_key" IN (SELECT "id" FROM "users");

-- Legacy / orphan rows (ownerKey = "" sentinel or pointing to a user that no
-- longer exists) can't be assigned to any workspace. They were already
-- unreachable from the app — delete them so we can enforce NOT NULL.
DELETE FROM "adapters" WHERE "workspace_id" IS NULL;

ALTER TABLE "adapters" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "adapters" ADD CONSTRAINT "adapters_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
CREATE INDEX "adapters_workspace_idx" ON "adapters"("workspace_id");

DROP INDEX IF EXISTS "adapters_owner_key_idx";
ALTER TABLE "adapters" DROP COLUMN "owner_key";

-- ─── 4. Conversations: add workspace_id + user_id, backfill, drop owner_key

ALTER TABLE "conversations" ADD COLUMN "workspace_id" TEXT;
ALTER TABLE "conversations" ADD COLUMN "user_id"      TEXT;

UPDATE "conversations" c
SET    "workspace_id" = 'ws_' || c."owner_key",
       "user_id"      = c."owner_key"
WHERE  c."owner_key" IN (SELECT "id" FROM "users");

DELETE FROM "conversations" WHERE "workspace_id" IS NULL;

ALTER TABLE "conversations" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "conversations" ALTER COLUMN "user_id"      SET NOT NULL;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
CREATE INDEX "conversations_workspace_user_updated_idx"
  ON "conversations"("workspace_id", "user_id", "updated_at");

DROP INDEX IF EXISTS "conversations_owner_key_updated_at_idx";
ALTER TABLE "conversations" DROP COLUMN "owner_key";

-- ─── 5. Migrate mcp_token → workspace_tokens, then drop the column ───────
-- Each user that has a token gets a single token row with empty
-- workspace_ids (= "all my workspaces"), preserving today's behavior where
-- the token scopes to the whole user.

INSERT INTO "workspace_tokens" ("id", "user_id", "token", "label", "updated_at")
SELECT
  'wt_' || u."id",
  u."id",
  u."mcp_token",
  'Personal',
  CURRENT_TIMESTAMP
FROM "users" u
WHERE u."mcp_token" IS NOT NULL;

ALTER TABLE "users" DROP COLUMN "mcp_token";
