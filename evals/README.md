# Indox retrieval evals

Deterministic retrieval evals that exercise `hybridSearch` end-to-end against
the live Postgres + OpenAI setup. No LLM-judge step — every metric is a count
or a rank over the chunks the engine actually returned.

## Run

```bash
bun run eval                    # all cases
bun run eval --profile P3       # one profile
bun run eval --filter token     # case ids matching substring
bun run eval --no-paraphrase    # skip the paraphrase consistency pass
```

Output goes to the terminal as a scorecard and a JSON snapshot under
`evals/runs/<ISO-timestamp>.json` for diffing across changes.

## Case shape

`cases.json` mixes two case types in one array.

### Single-turn

```jsonc
{
  "id": "P1-rrf-concept",
  "profile": "P1",                            // user profile bucket
  "query": "how does reciprocal rank fusion combine results",
  "expected": {
    "urls": ["GLOSSARY.md", "search/rrf.ts"], // substring match against chunk.url; ANY = pass
    "confidence": "strong"                     // "strong" | "weak" | "empty"
  },
  "paraphrases": [                             // optional — same intent, different phrasing
    "what is RRF and how do you compute it"
  ]
}
```

### Multi-turn

A case with a `history` block + an elliptical follow-up. The runner does
**three** retrievals and reports each separately:

| probe        | what it's called with                              | what it tells you                                 |
|--------------|----------------------------------------------------|---------------------------------------------------|
| `naive`      | just `query`                                       | Can the engine handle the fragment alone? (often no — that's the point.) |
| `context`    | history turns + `query`, plain-text concatenated   | The realistic agent-style retrieval path.         |
| `resolved`   | `resolvedQuery` (a gold rewrite)                    | Upper bound — is the answer even reachable?       |

```jsonc
{
  "id": "MT-rrf-followup",
  "profile": "MT",
  "history": [
    { "role": "user", "content": "how does indox merge vector and bm25 results" },
    { "role": "assistant", "content": "It uses Reciprocal Rank Fusion (RRF) with k=60..." }
  ],
  "query": "and why 60?",                          // elliptical follow-up
  "resolvedQuery": "why is k set to 60 in RRF",    // what a smart agent would have asked
  "expected": { "urls": ["GLOSSARY.md"], "confidence": "strong" }
}
```

The **history lift** = `context.recall − naive.recall`. Positive means
"the engine got it right *because* history was in the query"; zero means
"the follow-up was rich enough on its own"; negative means "history
confused the retrieval." All three are interesting.

### Profiles
- `P1` Backend dev onboarding
- `P2` Self-hoster debugging deploy
- `P3` Security-conscious reviewer
- `P4` Connector author
- `P5` Pre-signup evaluator (includes refusal/absence cases)
- `R`  Real-user shorthand (typos, fragments, non-coder framing)
- `MT` Multi-turn / conversational
- `S`  **Source-scoped** — caller passes `sourceName`; verifies every chunk stays in scope
- `N`  **Source named inline** — user mentions the source in the query; verifies the engine biases retrieval toward it
- `X`  **Cross-source ambiguous** — query genuinely spans multiple indexed sources; engine should return a spread so the agent can ask the user to disambiguate

### Source-aware expectations
Any case may add these to `expected`:

| Field | Pass condition |
|---|---|
| `scopedTo: "indox"` | Every chunk in top-k belongs to a source whose displayName contains "indox" |
| `primarySource: "indox"` | Strict majority (>½) of top-k chunks belong to the matching source |
| `multiSource: true` | top-k spans ≥2 distinct sources |

The runner resolves `sourceName` to actual source IDs at startup via
`listSources()`, then passes them to `hybridSearch` as the `sourceIds`
option — this exercises the real source-filter code path the chat UI uses.

`expected.confidence`:
- `strong` — at least one returned chunk must be `confidence: "strong"` AND a URL must match.
- `weak`   — engine should return only weak hits (no strong tier).
- `empty`  — engine should return zero chunks (genuine topic absence).

## Metrics

- **recall@k** — fraction of cases where any returned URL (top `limit`) matches `expected.urls`.
- **MRR** — mean reciprocal rank of the first matching URL.
- **confidence calibration** — fraction of cases whose top-tier matches `expected.confidence`.
- **paraphrase consistency** — Jaccard of top-k URL sets across `query` + each paraphrase.
