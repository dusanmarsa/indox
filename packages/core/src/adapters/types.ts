// Adapter contracts: a discriminated union keyed on `kind`. Each adapter
// defines its own scope shape (the *what to index* configuration) and its own
// metadata shape on the Source rows it produces. Storage stays uniform — only
// ingestion code is adapter-specific.

import type { Adapter, Source } from "../../prisma/generated/client";

// ─── kinds ────────────────────────────────────────────────────────────────────

export type AdapterKind = "github" | "notion";

// ─── scope schemas (per kind) ─────────────────────────────────────────────────

export type GithubScope =
  | { mode: "repos"; value: string[] } // ["owner/name", …]
  | { mode: "user"; value: string } // username, all of their repos
  | { mode: "org"; value: string }; // org, all of its repos

// Notion scope. `pages` is an explicit allowlist of page IDs (each becomes one
// Source). `search` indexes everything the integration token can see — sources
// are enumerated via /v1/search at sync time.
export type NotionScope =
  | { mode: "pages"; value: string[] } // page IDs (with or without dashes)
  | { mode: "search" };

export type AdapterScope = GithubScope | NotionScope;

// ─── source metadata (per kind) ───────────────────────────────────────────────

export type GithubSourceMetadata = {
  owner: string;
  name: string;
  defaultBranch?: string;
  sha?: string; // last indexed commit
};

export type NotionSourceMetadata = {
  pageId: string; // normalized 32-char hex (no dashes)
  title: string;
  lastEditedTime?: string;
};

export type SourceMetadata = GithubSourceMetadata | NotionSourceMetadata;

// ─── status enums (shared) ────────────────────────────────────────────────────

export type SyncStatus = "idle" | "running" | "ready" | "failed";
export type IndexStatus = "idle" | "running" | "ready" | "failed";

// ─── driver interface ─────────────────────────────────────────────────────────

// A driver knows how to take an Adapter's scope and (1) enumerate which Sources
// should exist for it, and (2) index a single Source (chunks → embeddings).
// The orchestrator (worker) calls these in sequence; drivers stay stateless.
export interface AdapterDriver<Scope = AdapterScope> {
  kind: AdapterKind;

  // Validates a raw scope value from the API into a typed scope. Throws on
  // malformed input — the API layer surfaces the error.
  parseScope(raw: unknown): Scope;

  // Discovers which Sources should exist for this adapter. Returns the
  // canonical externalId + display name + initial metadata for each.
  // The orchestrator upserts these into the sources table.
  enumerate(adapter: Adapter): Promise<EnumeratedSource[]>;

  // Indexes a single Source: fetch content, chunk, embed, write embeddings.
  // Returns the new chunk count + any metadata to merge (e.g. updated sha).
  indexSource(
    adapter: Adapter,
    source: Source
  ): Promise<{ chunkCount: number; metadata: SourceMetadata }>;
}

export type EnumeratedSource = {
  externalId: string;
  displayName: string;
  metadata: SourceMetadata;
};
