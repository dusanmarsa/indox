// Workspace lookup + CRUD. For Tier 1 each workspace has exactly one owner;
// multi-member workspaces (Tier 2) just need a separate WorkspaceMember join
// table — every helper here keys on (workspaceId, ownerId) so the gating
// logic doesn't change.

import prisma from "./db";
import { validateSlug } from "./workspace-settings";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  isPublic: boolean;
};

export async function listUserWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
  return prisma.workspace.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, ownerId: true, isPublic: true },
  });
}

// Returns the workspace the caller currently has selected. Phase 2 layers
// a cookie on top via `requireWorkspace(activeId?)`; if the cookie's
// workspace isn't owned by the user (deleted, switched account, …) we
// silently fall back to the first owned workspace.
export async function resolveActiveWorkspace(
  userId: string,
  activeId?: string | null,
): Promise<WorkspaceSummary> {
  if (activeId) {
    const owned = await prisma.workspace.findFirst({
      where: { id: activeId, ownerId: userId },
      select: { id: true, name: true, slug: true, ownerId: true, isPublic: true },
    });
    if (owned) return owned;
  }
  const first = await prisma.workspace.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, ownerId: true, isPublic: true },
  });
  if (first) return first;
  return ensureDefaultWorkspace(userId);
}

// Creates a "Default" workspace for the given user. Idempotent — returns
// the existing Default if one is already present so this is safe to call
// from any auth-gated entry point.
export async function ensureDefaultWorkspace(userId: string): Promise<WorkspaceSummary> {
  const existing = await prisma.workspace.findFirst({
    where: { ownerId: userId, name: "Default" },
    select: { id: true, name: true, slug: true, ownerId: true, isPublic: true },
  });
  if (existing) return existing;

  const slug = await uniqueSlug(`default-${userId}`);
  return prisma.workspace.create({
    data: { ownerId: userId, name: "Default", slug },
    select: { id: true, name: true, slug: true, ownerId: true, isPublic: true },
  });
}

// Owner-check: returns the workspace if the user owns it, null otherwise.
export async function getOwnedWorkspace(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceSummary | null> {
  return prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: userId },
    select: { id: true, name: true, slug: true, ownerId: true, isPublic: true },
  });
}

// ─── CRUD ─────────────────────────────────────────────────────────────────

export type CreateWorkspaceResult =
  | { ok: true; workspace: WorkspaceSummary }
  | { ok: false; reason: string };

export async function createWorkspace(opts: {
  userId: string;
  name: string;
  slug?: string;
}): Promise<CreateWorkspaceResult> {
  const name = opts.name.trim();
  if (name.length < 1 || name.length > 64) {
    return { ok: false, reason: "Name must be 1–64 characters." };
  }
  const baseSlug = opts.slug?.trim() || slugify(name);
  if (opts.slug) {
    const v = validateSlug(opts.slug);
    if (!v.ok) return { ok: false, reason: v.reason };
  }
  const finalSlug = await uniqueSlug(baseSlug);

  const workspace = await prisma.workspace.create({
    data: { ownerId: opts.userId, name, slug: finalSlug },
    select: { id: true, name: true, slug: true, ownerId: true, isPublic: true },
  });
  return { ok: true, workspace };
}

export type DeleteWorkspaceResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "last_workspace" };

// Deletes the workspace and (via cascade) all its adapters, sources,
// embeddings, conversations, and usage rows. Refuses to delete the user's
// last workspace — they'd be left with nowhere to add new adapters.
export async function deleteWorkspace(
  workspaceId: string,
  userId: string,
): Promise<DeleteWorkspaceResult> {
  const owned = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: userId },
    select: { id: true },
  });
  if (!owned) return { ok: false, reason: "not_found" };

  const total = await prisma.workspace.count({ where: { ownerId: userId } });
  if (total <= 1) return { ok: false, reason: "last_workspace" };

  await prisma.workspace.delete({ where: { id: workspaceId } });
  return { ok: true };
}

// ─── adapter copy ─────────────────────────────────────────────────────────

export type CopyAdapterResult =
  | { ok: true; adapterId: string }
  | { ok: false; reason: "source_not_found" | "target_not_owned" };

// Clone an adapter (credentials + scope) into another workspace owned by
// the same user. Sources are NOT copied — the new adapter starts in "idle"
// status and the caller (or the auto-enqueue path) kicks off a fresh sync
// that re-enumerates from the source-of-truth.
//
// Rationale: copying sources would create stale-by-construction duplicates,
// and re-enumerating is cheap relative to the embedding work that follows.
export async function copyAdapterToWorkspace(opts: {
  adapterId: string;
  targetWorkspaceId: string;
  userId: string;
}): Promise<CopyAdapterResult> {
  // Verify both ends are owned by the caller in a single transaction.
  return prisma.$transaction(async (tx) => {
    const source = await tx.adapter.findFirst({
      where: { id: opts.adapterId, workspace: { ownerId: opts.userId } },
      select: { kind: true, authIdentity: true, token: true, scope: true },
    });
    if (!source) return { ok: false, reason: "source_not_found" as const };

    const target = await tx.workspace.findFirst({
      where: { id: opts.targetWorkspaceId, ownerId: opts.userId },
      select: { id: true },
    });
    if (!target) return { ok: false, reason: "target_not_owned" as const };

    const copy = await tx.adapter.create({
      data: {
        workspaceId: target.id,
        kind: source.kind,
        authIdentity: source.authIdentity,
        // Token is already AES-encrypted; copy the ciphertext as-is so we
        // don't decrypt/re-encrypt unnecessarily.
        token: source.token,
        scope: source.scope as object,
        syncStatus: "idle",
      },
      select: { id: true },
    });
    return { ok: true, adapterId: copy.id };
  });
}

// ─── slug utils ───────────────────────────────────────────────────────────

// Best-effort transliteration of a display name into a URL slug. Strips
// diacritics, lowercases, replaces non-alphanumerics with hyphens, trims
// leading/trailing hyphens. Result is *not* guaranteed unique — callers
// pass it through `uniqueSlug` to disambiguate.
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "workspace";
}

// Append `-2`, `-3`, … to disambiguate against existing slugs. Bounded so
// a pathological owner can't loop forever.
async function uniqueSlug(base: string): Promise<string> {
  const candidate = base.slice(0, 48);
  for (let i = 0; i < 1000; i++) {
    const trial = i === 0 ? candidate : `${candidate.slice(0, 45)}-${i + 1}`;
    const taken = await prisma.workspace.findUnique({
      where: { slug: trial },
      select: { id: true },
    });
    if (!taken) return trial;
  }
  // Astronomically unlikely; fall back to a random suffix.
  return `${candidate.slice(0, 40)}-${Math.random().toString(36).slice(2, 8)}`;
}
