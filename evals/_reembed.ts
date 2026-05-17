#!/usr/bin/env bun
/**
 * One-shot: re-embed every indexed source with the currently-configured
 * embedding model. Use after swapping models (e.g. text-embedding-3-small
 * → text-embedding-3-large) — old vectors live in a different embedding
 * space and querying against them with new query vectors yields garbage.
 *
 * Sequential per source to keep us inside OpenAI's TPM budget (the
 * github adapter already throttles internally; running sources in
 * parallel would just stack rate-limit waits).
 *
 *   bun --env-file=.env evals/_reembed.ts
 */
import { listSources, syncSource, logger } from "@indox/core";

async function main() {
  const sources = await listSources({ readyOnly: false });
  console.error(`Re-embedding ${sources.length} source(s)…`);
  let ok = 0;
  let fail = 0;
  for (const s of sources) {
    const t0 = Date.now();
    process.stderr.write(`  ${s.displayName} … `);
    try {
      await syncSource(s.id);
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      process.stderr.write(`done (${dt}s)\n`);
      ok++;
    } catch (err) {
      process.stderr.write(`FAILED: ${(err as Error).message}\n`);
      fail++;
    }
  }
  console.error(`Done — ${ok} ok, ${fail} failed.`);
  // logger keeps the import alive; without this Bun's tree-shake might drop it.
  logger.info("reembed", `${ok}/${sources.length} sources re-embedded`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
