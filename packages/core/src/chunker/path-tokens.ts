// Path → BM25-friendly tokens. Used by every chunk-emitting function to
// attach searchable file-path tokens (camelCase-split, dot/dash-split) to
// the chunk header. URL construction lives in the adapter — each source
// kind links differently and the chunker shouldn't care.

export function basename(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? path : path.slice(i + 1);
}

export function ext(path: string): string {
  const b = basename(path);
  const i = b.lastIndexOf(".");
  return i === -1 ? "" : b.slice(i + 1).toLowerCase();
}

// Decompose a path segment into BM25-friendly tokens. Postgres' english
// parser keeps `app/vector/walkCodebase.ts` as opaque-ish tokens —
// splitting it into the parts a user is likely to type ("walk",
// "codebase", "vector") lets BM25 match natural-language queries that
// name the file in their own words. CamelCase, snake_case, kebab-case,
// and dotted segments all decompose.
export function tokenizePathSegment(seg: string): string[] {
  const out = new Set<string>();
  // Split on non-alphanumerics first (`.`, `_`, `-`)
  for (const raw of seg.split(/[^A-Za-z0-9]+/)) {
    if (!raw) continue;
    out.add(raw.toLowerCase());
    // CamelCase + acronym-aware split: `walkCodebase` → walk, codebase;
    // `APIController` → api, controller; `URLParser` → url, parser.
    const parts = raw.match(/[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g);
    if (parts) for (const p of parts) if (p.length > 1) out.add(p.toLowerCase());
  }
  return [...out];
}

export function pathTokens(path: string): string[] {
  const tokens = new Set<string>();
  for (const seg of path.split("/")) {
    for (const t of tokenizePathSegment(seg)) tokens.add(t);
  }
  return [...tokens];
}

