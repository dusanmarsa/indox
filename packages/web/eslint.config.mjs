import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Guard the @indox/core barrel split. Each name below pulls in the
    // chunker → vendor.ts → tree-sitter graph; importing them from the root
    // barrel would re-leak `[indox:vendor] loaded N linguist vendor patterns`
    // (and the underlying module evaluations) into the web process. The
    // subpath entries are the supported import surface — see
    // packages/core/src/index.ts for the long explanation.
    //
    // The sync orchestrator is worker-only and has no business in the web
    // package at all, so we ban its subpath outright.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@indox/core",
              importNames: [
                "syncAdapter",
                "syncSource",
                "getDriver",
                "listAdapterKinds",
                "listGithubRepos",
                "resolveGithubRepo",
                "listNotionPages",
                "resolveNotionPage",
              ],
              message:
                "Import from a subpath instead — @indox/core/adapters, @indox/core/adapters/github, @indox/core/adapters/notion, or @indox/core/sync. Re-adding these to the root barrel re-leaks the chunker/vendor graph into the web process.",
            },
            {
              name: "@indox/core/sync",
              message:
                "@indox/core/sync is worker-only — the web should enqueue jobs via @indox/core { enqueueAdapterSync, enqueueSourceSync } instead of running syncs inline.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
