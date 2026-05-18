-- AlterTable: make user_id optional and add anon_session_id for public embed sessions
ALTER TABLE "conversations" ADD COLUMN "anon_session_id" TEXT;
ALTER TABLE "conversations" ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex: fast lookup of anon conversations by workspace + session
CREATE INDEX "conversations_workspace_id_anon_session_id_updated_at_idx"
  ON "conversations"("workspace_id", "anon_session_id", "updated_at");
