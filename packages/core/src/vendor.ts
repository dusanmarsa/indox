// Path-based vendor detection, sourced from github-linguist's `vendor.yml`.
// The snapshot in `data/linguist-vendor.yml` is the gold standard for "this
// path looks like checked-in third-party code that we should not index" — it
// covers caches, dist/build output, language-specific dep dirs (node_modules,
// vendor/, deps/, Carthage/, Pods/, …), framework boilerplate, generated
// parsers, and many ecosystem-specific patterns we'd never enumerate by hand.
//
// Refresh procedure:
//   curl -sSL https://raw.githubusercontent.com/github-linguist/linguist/main/lib/linguist/vendor.yml \
//     > packages/core/src/data/linguist-vendor.yml

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { logger } from "./logger";

function loadPatterns(): RegExp[] {
  const here = dirname(fileURLToPath(import.meta.url));
  const yaml = readFileSync(join(here, "data", "linguist-vendor.yml"), "utf8");

  // The file is a flat YAML list of unquoted regex strings. Linguist's loader
  // is Ruby's `Regexp.new` — most of those patterns are JS-compatible, but a
  // handful use Ruby-only syntax (e.g. `(?-mix:...)` mode toggles, `\h`).
  // We compile each one defensively and drop the ones that don't parse so a
  // single bad pattern doesn't disable the whole list.
  const out: RegExp[] = [];
  let dropped = 0;
  for (const raw of yaml.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (!trimmed.startsWith("- ")) continue;
    const pattern = trimmed.slice(2).trim();
    if (!pattern) continue;
    try {
      out.push(new RegExp(pattern));
    } catch {
      dropped++;
    }
  }
  if (dropped) {
    logger.warn("vendor", `dropped ${dropped} linguist patterns incompatible with JS regex`);
  }
  logger.info("vendor", `loaded ${out.length} linguist vendor patterns`);
  return out;
}

const VENDOR_PATTERNS = loadPatterns();

// Returns true if the path matches any of linguist's vendor patterns. The
// patterns are anchored explicitly with `^` / `(^|/)` where intended, so we
// just run each one in turn against the full repo-relative path.
export function isVendoredPath(path: string): boolean {
  for (const re of VENDOR_PATTERNS) {
    if (re.test(path)) return true;
  }
  return false;
}
