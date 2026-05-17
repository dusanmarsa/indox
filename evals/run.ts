#!/usr/bin/env bun
/**
 * Retrieval eval runner.
 *
 * Loads cases.json, calls @indox/core's hybridSearch directly (no MCP
 * transport in the loop — we're measuring the engine, not JSON-RPC), and
 * prints a scorecard. Each run is also snapshotted to evals/runs/<ts>.json
 * so we can diff metrics across changes.
 *
 * Metrics:
 *   recall@k     — any chunk URL in top-k contains an expected substring
 *   MRR          — 1 / rank of the first matching chunk (0 if none)
 *   confidence   — top tier returned matches expected ("strong"/"weak"/"empty")
 *   paraphrases  — Jaccard of top-k URL sets between query + each paraphrase
 *   source-aware:
 *     scopedTo      — when caller passed sourceIds, every chunk must belong there
 *     primarySource — majority of top-k chunks belong to expected source
 *     multiSource   — top-k spans ≥2 sources (signal for agent to disambiguate)
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { hybridSearch, listSources, type Chunk } from "@indox/core";

const HERE = dirname(fileURLToPath(import.meta.url));
const LIMIT = 8;

type HistoryTurn = { role: "user" | "assistant"; content: string };

type Expected = {
  urls: string[];
  confidence: "strong" | "weak" | "empty";
  // Source-aware expectations (all optional).
  //   scopedTo:      every returned chunk must come from this source name
  //                  (used together with `sourceName` on the case to filter
  //                  retrieval — proves the explicit-scope path works)
  //   primarySource: majority of top-k chunks must come from this source
  //                  (engine inferred scope from query/history)
  //   multiSource:   top-k must span ≥2 distinct sources (intentionally
  //                  ambiguous — engine should surface the spread)
  scopedTo?: string;
  primarySource?: string;
  multiSource?: boolean;
};

type Case = {
  id: string;
  profile: string;
  query: string;
  expected: Expected;
  paraphrases?: string[];
  // Source-scoped probe: caller restricts retrieval to this source's IDs.
  // Resolved against listSources() at runtime by substring match on display
  // name (so cases stay portable across machines / re-indexed corpora).
  sourceName?: string;
  // Multi-turn: if present, the runner does THREE retrievals.
  //   naive    — just `query` (ambiguous follow-up alone)
  //   context  — history + query concatenated (proxy for a context-aware agent)
  //   resolved — `resolvedQuery` (gold-standard rewrite a smart agent would produce)
  history?: HistoryTurn[];
  resolvedQuery?: string;
  notes?: string;
};

type ProbeResult = {
  recall: boolean;
  rank: number | null;
  mrr: number;
  confidence: "strong" | "weak" | "empty";
  confidenceOk: boolean;
  urls: (string | null)[];
  sources: string[]; // distinct source display names in top-k, in rank order
  scopedToOk: boolean | null;
  primarySourceOk: boolean | null;
  multiSourceOk: boolean | null;
};

type CaseResult = {
  id: string;
  profile: string;
  query: string;
  expectedConfidence: Case["expected"]["confidence"];
  // Single-turn cases populate `main` and (optionally) `paraphraseJaccard`.
  // Multi-turn cases populate naive/context/resolved instead.
  main?: ProbeResult;
  naive?: ProbeResult;
  context?: ProbeResult;
  resolved?: ProbeResult;
  historyLift?: number | null; // context.recall - naive.recall, as -1 | 0 | 1
  paraphraseJaccard: number | null;
};

// ─── CLI args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const profileFilter = argValue("--profile");
const filterSubstr = argValue("--filter");
const skipParaphrase = args.includes("--no-paraphrase");

function argValue(flag: string): string | null {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
}

// ─── helpers ──────────────────────────────────────────────────────────────

function urlMatchesAny(url: string | null | undefined, expected: string[]): boolean {
  if (!url) return false;
  return expected.some((e) => url.includes(e));
}

// ─── source resolution ────────────────────────────────────────────────────

type IndexedSource = { id: string; displayName: string };
let SOURCES: IndexedSource[] = [];

async function loadSources(): Promise<void> {
  const rows = await listSources({ readyOnly: true });
  SOURCES = rows.map((r) => ({ id: r.id, displayName: r.displayName }));
}

// Resolve a human-friendly source name ("indox", "validvision") to the
// indexed source's id, by substring match against displayName. Throws if
// no source matches — that's a case-definition bug, not silent skip.
function resolveSourceIds(name: string): string[] {
  const matches = SOURCES.filter((s) =>
    s.displayName.toLowerCase().includes(name.toLowerCase()),
  );
  if (matches.length === 0) {
    throw new Error(
      `No indexed source matched "${name}". Indexed: ${SOURCES.map((s) => s.displayName).join(", ")}`,
    );
  }
  return matches.map((s) => s.id);
}

// Map a chunk URL (e.g. https://github.com/owner/repo/blob/sha/...) to the
// source displayName ("github.com/owner/repo"). Returns null if the URL
// doesn't match the github blob shape.
const GITHUB_RE = /https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob/;
function sourceFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(GITHUB_RE);
  return m ? `github.com/${m[1]}/${m[2]}` : null;
}

// Same human-name match used for resolveSourceIds, but for source displayNames
// we extracted from URLs. e.g. "indox" matches "github.com/dusanmarsa/indox".
function sourceMatchesName(displayName: string, name: string): boolean {
  return displayName.toLowerCase().includes(name.toLowerCase());
}

function topTier(chunks: Chunk[]): "strong" | "weak" | "empty" {
  if (chunks.length === 0) return "empty";
  if (chunks.some((c) => c.confidence === "strong")) return "strong";
  return "weak";
}

function firstMatchRank(chunks: Chunk[], expected: string[]): number | null {
  for (let i = 0; i < chunks.length; i++) {
    if (urlMatchesAny(chunks[i].url, expected)) return i + 1;
  }
  return null;
}

function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
}

// ─── runner ───────────────────────────────────────────────────────────────

async function probe(
  q: string,
  expected: Expected,
  sourceIds?: string[],
): Promise<ProbeResult> {
  const chunks = await hybridSearch(q, LIMIT, sourceIds ? { sourceIds } : undefined);
  const rank = firstMatchRank(chunks, expected.urls);
  const confidence = topTier(chunks);
  const recall = expected.confidence === "empty" ? chunks.length === 0 : rank !== null;
  const confidenceOk =
    expected.confidence === "empty"
      ? confidence === "empty"
      : expected.confidence === "weak"
        ? confidence === "weak"
        : confidence === "strong" && rank !== null;

  // ─── source-aware checks ────────────────────────────────────────────
  // distinct sources in top-k, preserving rank order (used for the
  // "primary" check: rank 1's source is the primary).
  const seen = new Set<string>();
  const sources: string[] = [];
  for (const c of chunks) {
    const s = sourceFromUrl(c.url);
    if (s && !seen.has(s)) {
      seen.add(s);
      sources.push(s);
    }
  }

  // scopedTo: every returned chunk's source must match the expected name.
  // A null URL means we couldn't parse the source from the chunk's URL —
  // but the engine's sourceIds filter already guarantees scope at the SQL
  // layer, so treat unparseable URLs as in-scope rather than failing on
  // them. This check only fires if a URL parses *and* points elsewhere.
  const scopedToOk =
    expected.scopedTo === undefined
      ? null
      : chunks.length > 0 &&
        chunks.every((c) => {
          const s = sourceFromUrl(c.url);
          if (s === null) return true;
          return sourceMatchesName(s, expected.scopedTo!);
        });

  // primarySource: majority of top-k chunks belong to the expected source.
  // We require strict majority (> half) — a plurality wouldn't be a strong
  // enough signal that the engine actually inferred scope.
  const primarySourceOk =
    expected.primarySource === undefined
      ? null
      : (() => {
          if (chunks.length === 0) return false;
          const hits = chunks.filter((c) => {
            const s = sourceFromUrl(c.url);
            return s !== null && sourceMatchesName(s, expected.primarySource!);
          }).length;
          return hits > chunks.length / 2;
        })();

  // multiSource: top-k contains ≥2 distinct sources.
  const multiSourceOk =
    expected.multiSource === undefined ? null : sources.length >= 2;

  return {
    recall,
    rank,
    mrr: rank ? 1 / rank : 0,
    confidence,
    confidenceOk,
    urls: chunks.map((x) => x.url),
    sources,
    scopedToOk,
    primarySourceOk,
    multiSourceOk,
  };
}

// Build a context-augmented query from history. We use a plain
// concatenation rather than an LLM rewrite — this measures whether the
// retrieval engine alone can resolve the reference when given the prior
// turns verbatim. A real chat agent would feed something similar to its
// own query-construction step.
function buildContextQuery(history: HistoryTurn[], followUp: string): string {
  const lines = history.map((t) => `${t.role}: ${t.content}`);
  lines.push(`user: ${followUp}`);
  return lines.join("\n");
}

async function runCase(c: Case): Promise<CaseResult> {
  // Resolve sourceName → sourceIds for the explicit-scope path. We do this
  // once per case; if it's set, every probe in the case uses the same scope.
  const sourceIds = c.sourceName ? resolveSourceIds(c.sourceName) : undefined;

  // ─── multi-turn ────────────────────────────────────────────────────────
  if (c.history && c.history.length > 0) {
    const naive = await probe(c.query, c.expected, sourceIds);
    const ctxQuery = buildContextQuery(c.history, c.query);
    const context = await probe(ctxQuery, c.expected, sourceIds);
    const resolved = c.resolvedQuery
      ? await probe(c.resolvedQuery, c.expected, sourceIds)
      : undefined;
    const historyLift = (context.recall ? 1 : 0) - (naive.recall ? 1 : 0);
    return {
      id: c.id,
      profile: c.profile,
      query: c.query,
      expectedConfidence: c.expected.confidence,
      naive,
      context,
      resolved,
      historyLift,
      paraphraseJaccard: null,
    };
  }

  // ─── single-turn ───────────────────────────────────────────────────────
  const main = await probe(c.query, c.expected, sourceIds);

  let paraphraseJaccard: number | null = null;
  if (!skipParaphrase && c.paraphrases?.length) {
    const baseUrls = new Set(main.urls.filter((u): u is string => !!u));
    const scores: number[] = [];
    for (const p of c.paraphrases) {
      const pChunks = await hybridSearch(
        p,
        LIMIT,
        sourceIds ? { sourceIds } : undefined,
      );
      const pUrls = new Set(pChunks.map((x) => x.url ?? "").filter(Boolean));
      scores.push(jaccard(baseUrls, pUrls));
    }
    paraphraseJaccard = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  return {
    id: c.id,
    profile: c.profile,
    query: c.query,
    expectedConfidence: c.expected.confidence,
    main,
    paraphraseJaccard,
  };
}

function fmtPct(n: number, total: number): string {
  return total === 0 ? "—" : `${((n / total) * 100).toFixed(0)}% (${n}/${total})`;
}

async function main() {
  const raw = await readFile(join(HERE, "cases.json"), "utf8");
  let cases: Case[] = JSON.parse(raw);
  if (profileFilter) cases = cases.filter((c) => c.profile === profileFilter);
  if (filterSubstr)
    cases = cases.filter((c) => c.id.toLowerCase().includes(filterSubstr.toLowerCase()));

  if (cases.length === 0) {
    console.error("No cases matched filters.");
    process.exit(1);
  }

  // Load indexed sources once. Used to resolve case.sourceName to ids and
  // to attribute every returned chunk back to its source.
  await loadSources();
  console.error(`Indexed sources (${SOURCES.length}): ${SOURCES.map((s) => s.displayName).join(", ")}`);

  console.error(`Running ${cases.length} cases…`);
  const results: CaseResult[] = [];
  for (const c of cases) {
    process.stderr.write(`  ${c.id} … `);
    try {
      const r = await runCase(c);
      results.push(r);
      // Pick the canonical probe for the inline summary line:
      // single-turn → main, multi-turn → context (the realistic agent path).
      const headline = r.main ?? r.context;
      const tag = headline?.recall && headline?.confidenceOk ? "✓" : headline?.recall ? "~" : "✗";
      const pj = r.paraphraseJaccard !== null ? ` p=${r.paraphraseJaccard.toFixed(2)}` : "";
      const mt = r.naive
        ? ` [naive ${r.naive.recall ? "✓" : "✗"} ctx ${r.context!.recall ? "✓" : "✗"}${r.resolved ? ` resolved ${r.resolved.recall ? "✓" : "✗"}` : ""}]`
        : "";
      process.stderr.write(
        `${tag} rank=${headline?.rank ?? "—"} obs=${headline?.confidence ?? "—"}${pj}${mt}\n`,
      );
    } catch (err) {
      process.stderr.write(`ERROR: ${(err as Error).message}\n`);
    }
  }

  // ─── aggregate ─────────────────────────────────────────────────────────
  // Single-turn cases score on `main`. Multi-turn cases score on `context`
  // (the realistic "agent forwards history" path) — `naive` and `resolved`
  // are reported separately to show the lift.
  const total = results.length;
  const headlineOf = (r: CaseResult): ProbeResult | undefined => r.main ?? r.context;
  const recallHits = results.filter((r) => headlineOf(r)?.recall).length;
  const confHits = results.filter((r) => headlineOf(r)?.confidenceOk).length;
  const mrrSum = results.reduce((a, r) => a + (headlineOf(r)?.mrr ?? 0), 0);
  const paraResults = results.filter((r) => r.paraphraseJaccard !== null);
  const paraMean =
    paraResults.length === 0
      ? null
      : paraResults.reduce((a, r) => a + (r.paraphraseJaccard ?? 0), 0) / paraResults.length;

  console.log("\n─── Scorecard ───────────────────────────────────────");
  console.log(`Cases:                ${total}`);
  console.log(`recall@${LIMIT}:           ${fmtPct(recallHits, total)}`);
  console.log(`MRR:                  ${(mrrSum / total).toFixed(3)}`);
  console.log(`Confidence calibrated:${fmtPct(confHits, total)}`);
  if (paraMean !== null) {
    console.log(`Paraphrase Jaccard:   ${paraMean.toFixed(3)} (n=${paraResults.length})`);
  }

  // ─── source-aware breakdown ───────────────────────────────────────────
  // Every probe carries scopedToOk / primarySourceOk / multiSourceOk fields,
  // each either null (the case didn't ask) or a boolean. We aggregate across
  // headline probes (single-turn main, multi-turn context).
  const headlines = results.map((r) => ({ r, h: headlineOf(r) })).filter((x) => x.h);
  type Bucket = { pass: number; total: number };
  const buckets = {
    scopedTo: { pass: 0, total: 0 } as Bucket,
    primary: { pass: 0, total: 0 } as Bucket,
    multi: { pass: 0, total: 0 } as Bucket,
  };
  for (const { h } of headlines) {
    if (h!.scopedToOk !== null) {
      buckets.scopedTo.total++;
      if (h!.scopedToOk) buckets.scopedTo.pass++;
    }
    if (h!.primarySourceOk !== null) {
      buckets.primary.total++;
      if (h!.primarySourceOk) buckets.primary.pass++;
    }
    if (h!.multiSourceOk !== null) {
      buckets.multi.total++;
      if (h!.multiSourceOk) buckets.multi.pass++;
    }
  }
  const hasSourceChecks =
    buckets.scopedTo.total + buckets.primary.total + buckets.multi.total > 0;
  if (hasSourceChecks) {
    console.log("\n─── Source-aware ────────────────────────────────────");
    if (buckets.scopedTo.total)
      console.log(`scopedTo (explicit filter):    ${fmtPct(buckets.scopedTo.pass, buckets.scopedTo.total)}`);
    if (buckets.primary.total)
      console.log(`primarySource (inferred scope):${fmtPct(buckets.primary.pass, buckets.primary.total)}`);
    if (buckets.multi.total)
      console.log(`multiSource (≥2 sources):      ${fmtPct(buckets.multi.pass, buckets.multi.total)}`);
  }

  // ─── multi-turn breakdown ─────────────────────────────────────────────
  const mt = results.filter((r) => r.naive);
  if (mt.length) {
    const naiveR = mt.filter((r) => r.naive!.recall).length;
    const ctxR = mt.filter((r) => r.context!.recall).length;
    const resolvedAvailable = mt.filter((r) => r.resolved);
    const resolvedR = resolvedAvailable.filter((r) => r.resolved!.recall).length;
    const lift = ctxR - naiveR;
    console.log("\n─── Multi-turn ──────────────────────────────────────");
    console.log(`Cases:                ${mt.length}`);
    console.log(`naive recall:         ${fmtPct(naiveR, mt.length)}   (follow-up alone)`);
    console.log(`context recall:       ${fmtPct(ctxR, mt.length)}   (history + follow-up)`);
    if (resolvedAvailable.length) {
      console.log(
        `resolved recall:      ${fmtPct(resolvedR, resolvedAvailable.length)}   (gold-standard rewrite — upper bound)`,
      );
    }
    console.log(`history lift:         ${lift >= 0 ? "+" : ""}${lift} cases (${(lift / mt.length * 100).toFixed(0)} pp)`);
  }

  // Per-profile breakdown
  const profiles = [...new Set(results.map((r) => r.profile))].sort();
  console.log("\n─── By profile ──────────────────────────────────────");
  for (const p of profiles) {
    const sub = results.filter((r) => r.profile === p);
    const recall = sub.filter((r) => headlineOf(r)?.recall).length;
    const conf = sub.filter((r) => headlineOf(r)?.confidenceOk).length;
    const mrrV = sub.reduce((a, r) => a + (headlineOf(r)?.mrr ?? 0), 0) / sub.length;
    console.log(
      `${p}: recall ${fmtPct(recall, sub.length).padEnd(14)} conf ${fmtPct(conf, sub.length).padEnd(14)} MRR ${mrrV.toFixed(2)}`,
    );
  }

  // Failures (recall, confidence, or any source-aware check miss on headline)
  const failures = results.filter((r) => {
    const h = headlineOf(r);
    if (!h) return false;
    return (
      !h.recall ||
      !h.confidenceOk ||
      h.scopedToOk === false ||
      h.primarySourceOk === false ||
      h.multiSourceOk === false
    );
  });
  if (failures.length) {
    console.log("\n─── Failures ────────────────────────────────────────");
    for (const f of failures) {
      const h = headlineOf(f)!;
      const why: string[] = [];
      if (!h.recall) why.push("recall");
      if (!h.confidenceOk) {
        if (f.expectedConfidence === "strong" && h.confidence === "strong" && h.rank === null) {
          why.push("strong-but-wrong-chunks");
        } else {
          why.push(`confidence(${h.confidence} ≠ ${f.expectedConfidence})`);
        }
      }
      if (h.scopedToOk === false) why.push("scopedTo leaked");
      if (h.primarySourceOk === false) why.push("wrong primary source");
      if (h.multiSourceOk === false) why.push("only one source returned");
      console.log(`  ${f.id.padEnd(28)} ${why.join(", ")}`);
      console.log(`    query: ${f.query}`);
      if (h.urls.length) {
        console.log(`    top-3: ${h.urls.slice(0, 3).map((u) => u ?? "null").join(" | ")}`);
        console.log(`    sources: ${h.sources.join(", ") || "(none)"}`);
      } else {
        console.log(`    top-3: (no results)`);
      }
    }
  }

  // ─── snapshot ──────────────────────────────────────────────────────────
  const runsDir = join(HERE, "runs");
  if (!existsSync(runsDir)) await mkdir(runsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const out = join(runsDir, `${stamp}.json`);
  await writeFile(
    out,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        limit: LIMIT,
        filters: { profile: profileFilter, filter: filterSubstr, skipParaphrase },
        aggregate: {
          total,
          recallAtK: recallHits / total,
          mrr: mrrSum / total,
          confidenceCalibrated: confHits / total,
          paraphraseJaccard: paraMean,
        },
        results,
      },
      null,
      2,
    ),
  );
  console.log(`\nSnapshot: ${out}`);

  // Exit non-zero if any case failed both recall AND confidence on the
  // headline probe — that's a regression worth blocking CI on.
  const hardFails = results.filter((r) => {
    const h = headlineOf(r);
    return h && !h.recall && !h.confidenceOk;
  });
  process.exit(hardFails.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
