// Public API for @indox/core. Everything else under src/ is internal.
//
// The root barrel is intentionally limited to modules that are safe to load in
// any process (web, mcp, worker): pure helpers, prisma, search, queue producer,
// listing helpers, conversations, tokens, workspaces.
//
// Anything that pulls in the chunker/vendor/tree-sitter graph (adapter drivers,
// sync orchestrator) is reachable ONLY via subpath exports:
//   @indox/core/adapters          — registry (getDriver, listAdapterKinds)
//   @indox/core/adapters/github   — listGithubRepos, resolveGithubRepo
//   @indox/core/adapters/notion   — listNotionPages, resolveNotionPage
//   @indox/core/sync              — syncAdapter, syncSource (worker-only)
//
// This is what keeps `[indox:vendor] loaded N linguist vendor patterns` out of
// the web server logs — importing anything from the root barrel must not
// transitively evaluate vendor.ts.

// ─── search ───────────────────────────────────────────────────────────────────
export { hybridSearch, type SearchHit, type HybridSearchOptions } from "./search/hybrid";
export { fuse, RRF_K, type Ranked, type Fused } from "./search/rrf";

// ─── chunking ─────────────────────────────────────────────────────────────────
// Only types are re-exported here. The value exports (chunkContent, shouldIndex,
// defaultShape, walkMarkdown) pull in vendor.ts which eagerly reads the
// linguist-vendor.yml file at module load time — that's fine in the worker/
// adapter context but produces noisy logs in the web process. Adapters import
// directly from `../chunker` (core-internal) and the worker imports from
// `@indox/core/src/chunker` if it needs them.
export type {
  Chunk,
  ContentItem,
  ContentShape,
  CodeStructure,
  ProseStructure,
  ProseSection,
  ProseCodeBlock,
  StructuralBoundary,
  SymbolHit,
} from "./chunker";
// NOTE: ./tree-sitter is intentionally NOT re-exported here. It depends on
// web-tree-sitter + 30+ grammar WASMs; pulling those into the web bundle
// breaks the Next/Turbopack build. The indexing path (adapter + worker)
// imports it directly via `@indox/core/src/tree-sitter` if needed, or — as
// the github adapter does — just locally.

// ─── adapter types only ───────────────────────────────────────────────────────
// Type re-exports are erased at build time and do not evaluate the source
// module. Driver value imports (getDriver, listGithubRepos, listNotionPages,
// resolveGithubRepo, resolveNotionPage) live behind the @indox/core/adapters*
// subpaths to keep them out of the web process load graph.
export type {
  AdapterKind,
  AdapterScope,
  GithubScope,
  NotionScope,
  SourceMetadata,
  GithubSourceMetadata,
  NotionSourceMetadata,
  SyncStatus,
  IndexStatus,
  AdapterDriver,
  EnumeratedSource,
} from "./adapters/types";

// ─── source/adapter state ─────────────────────────────────────────────────────
export {
  markAdapterRunning,
  markAdapterReady,
  markAdapterFailed,
  markSourceRunning,
  markSourceReady,
  markSourceFailed,
  upsertSources,
  replaceSourceEmbeddings,
  listAdapters,
  listAdaptersByWorkspace,
  listSources,
  addSourceToAdapter,
  removeSourceFromAdapter,
  getAdapter,
  recoverStuckIndexing,
} from "./source-index";

// ─── workspaces ───────────────────────────────────────────────────────────────
export {
  listUserWorkspaces,
  resolveActiveWorkspace,
  ensureDefaultWorkspace,
  getOwnedWorkspace,
  createWorkspace,
  deleteWorkspace,
  copyAdapterToWorkspace,
  slugify,
  type WorkspaceSummary,
  type CreateWorkspaceResult,
  type DeleteWorkspaceResult,
  type CopyAdapterResult,
} from "./workspaces";

export {
  ALLOWED_MODELS,
  DEFAULT_MODEL,
  isAllowedModel,
  modelRequiresByoKey,
  validateSlug,
  getWorkspaceSettings,
  updateWorkspaceSettings,
  getWorkspaceBySlug,
  type AllowedModel,
  type WorkspaceSettings,
  type UpdateWorkspaceSettings,
  type UpdateResult,
  type PublicWorkspaceContext,
} from "./workspace-settings";

export {
  checkAndIncrementWorkspaceUsage,
  getWorkspaceUsageToday,
  type RateLimitDecision,
} from "./workspace-rate-limit";

// ─── sync orchestration ───────────────────────────────────────────────────────
// syncAdapter / syncSource live at `@indox/core/sync` — worker-only.

// ─── conversations ────────────────────────────────────────────────────────────
export {
  createConversation,
  getOrCreateAnonConversation,
  getAnonConversation,
  listConversations,
  getConversation,
  deleteConversation,
  appendMessage,
  type ConversationSummary,
  type PersistedMessage,
  type ConversationScope,
  type AnonConversationScope,
} from "./conversations";

// ─── infra ────────────────────────────────────────────────────────────────────
export { default as prisma } from "./db";
export { logger } from "./logger";
export { encryptToken, decryptToken, isEncrypted } from "./crypto";

// ─── MCP tokens ───────────────────────────────────────────────────────────────
export {
  generateMcpToken,
  createToken,
  getOrCreatePersonalToken,
  rotatePersonalToken,
  listUserTokens,
  deleteToken,
  resolveMcpToken,
  type ResolvedToken,
} from "./mcp-token";

// ─── job queue ────────────────────────────────────────────────────────────────
export {
  getBoss,
  enqueueAdapterSync,
  enqueueSourceSync,
  QUEUE_SYNC_ADAPTER,
  QUEUE_SYNC_SOURCE,
  type SyncAdapterJob,
  type SyncSourceJob,
} from "./queue";

export const CORE_VERSION = "0.2.0";
