import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { join } from "node:path";

// Load repo-root .env for local CLI runs (migrate, studio). On Railway/CI
// the env comes from the platform; dotenv no-ops when the file is missing.
config({ path: join(import.meta.dirname, "../../.env") });

// `process.env.DATABASE_URL` instead of prisma's `env()` helper: the helper
// validates eagerly at config-load and throws when missing, which breaks
// `prisma generate` on Railway's build step (build runs before runtime
// secrets attach). Operations that actually connect — `migrate deploy`,
// `db push` — still fail clearly when the URL is empty.
export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
