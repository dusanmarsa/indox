// Public API for @indox/core. Everything else under src/ is internal.
//
// Keep this surface small and intentional — every export here is a commitment
// to downstream packages (web, mcp, worker).

// ─── search ───────────────────────────────────────────────────────────────────
export {
  hybridSearch,
  type Chunk,
  type HybridSearchOptions,
} from "./search/hybrid";
export { fuse, RRF_K, type Ranked, type Fused } from "./search/rrf";

// ─── chunking ─────────────────────────────────────────────────────────────────
export {
  chunkFile,
  makeTreeChunk,
  shouldIndex,
  classifyFile,
  type CodeChunk,
} from "./chunker";

// ─── adapters ─────────────────────────────────────────────────────────────────
export type {
  AdapterKind,
  AdapterScope,
  GithubScope,
  SourceMetadata,
  GithubSourceMetadata,
  SyncStatus,
  IndexStatus,
  AdapterDriver,
  EnumeratedSource,
} from "./adapters/types";
export { getDriver, listAdapterKinds } from "./adapters/registry";
export { listGithubRepos, resolveGithubRepo } from "./adapters/github";

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
  listAdaptersByOwner,
  listSources,
  addSourceToAdapter,
  removeSourceFromAdapter,
  getAdapter,
} from "./source-index";

// ─── sync orchestration ───────────────────────────────────────────────────────
export { syncAdapter, syncSource } from "./sync";

// ─── conversations ────────────────────────────────────────────────────────────
export {
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
  appendMessage,
  type ConversationSummary,
  type PersistedMessage,
} from "./conversations";

// ─── infra ────────────────────────────────────────────────────────────────────
export { default as prisma } from "./db";
export { logger } from "./logger";
export { encryptToken, decryptToken, isEncrypted } from "./crypto";

// ─── MCP tokens ───────────────────────────────────────────────────────────────
export {
  generateMcpToken,
  rotateMcpToken,
  getOrCreateMcpToken,
  resolveMcpToken,
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
