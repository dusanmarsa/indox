-- Scope adapters to the session/owner that created them so a leaked or
-- guessed adapter id can't be acted on by another anonymous visitor.
ALTER TABLE "adapters"
  ADD COLUMN "owner_key" TEXT NOT NULL DEFAULT '';

CREATE INDEX "adapters_owner_key_idx" ON "adapters"("owner_key");
