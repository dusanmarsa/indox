// Workspace settings: the owner-editable knobs that turn a workspace into
// a public, embeddable chat surface. Lives next to the workspaces module
// so the schema stays a thin Prisma layer.

import prisma from "./db";
import { encryptToken, decryptToken } from "./crypto";

// ─── model allowlist ────────────────────────────────────────────────────────
// Small set on purpose. BYO key gates everything except the default — the
// public-platform-key path can't burn credits on premium models.

export const DEFAULT_MODEL = "gpt-4o-mini";
export const ALLOWED_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1",
  "gpt-4.1-mini",
] as const;
export type AllowedModel = (typeof ALLOWED_MODELS)[number];

export function isAllowedModel(m: string): m is AllowedModel {
  return (ALLOWED_MODELS as readonly string[]).includes(m);
}

// Whether this model can be used without a BYO OpenAI key. Anything other
// than the default would cost the platform real money on public chats.
export function modelRequiresByoKey(m: AllowedModel): boolean {
  return m !== DEFAULT_MODEL;
}

// ─── slug validation ────────────────────────────────────────────────────────
// Slugs sit at the top-level URL (/w/<slug>); we reject anything that could
// collide with a real route, reserved word, or filesystem-style path.

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/;
const RESERVED_SLUGS = new Set([
  "api",
  "auth",
  "chat",
  "dashboard",
  "embed",
  "favicon",
  "health",
  "login",
  "logout",
  "mcp",
  "public",
  "settings",
  "static",
  "w",
  "_next",
  "admin",
  "signup",
  "signin",
]);

export type SlugValidation =
  | { ok: true }
  | { ok: false; reason: string };

export function validateSlug(slug: string): SlugValidation {
  if (slug.length < 3 || slug.length > 48) {
    return { ok: false, reason: "Slug must be 3–48 characters." };
  }
  if (!SLUG_RE.test(slug)) {
    return {
      ok: false,
      reason: "Slug can use lowercase letters, digits, and hyphens; must start and end with a letter or digit.",
    };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, reason: "That slug is reserved." };
  }
  return { ok: true };
}

// ─── settings DTOs ──────────────────────────────────────────────────────────

export type WorkspaceSettings = {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  // True when an encrypted key is stored. We never return the plaintext.
  hasOpenaiKey: boolean;
  model: AllowedModel;
  dailyCallLimit: number;
};

export async function getWorkspaceSettings(
  workspaceId: string,
): Promise<WorkspaceSettings | null> {
  const row = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      isPublic: true,
      openaiApiKeyEncrypted: true,
      model: true,
      dailyCallLimit: true,
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isPublic: row.isPublic,
    hasOpenaiKey: !!row.openaiApiKeyEncrypted,
    model: isAllowedModel(row.model) ? row.model : DEFAULT_MODEL,
    dailyCallLimit: row.dailyCallLimit,
  };
}

// PATCH input. Any field undefined means "leave alone". `openaiApiKey: null`
// explicitly clears the stored key; a non-empty string sets it.
export type UpdateWorkspaceSettings = {
  name?: string;
  slug?: string;
  isPublic?: boolean;
  openaiApiKey?: string | null;
  model?: string;
  dailyCallLimit?: number;
};

export type UpdateResult =
  | { ok: true; settings: WorkspaceSettings }
  | { ok: false; field: keyof UpdateWorkspaceSettings; reason: string };

// Hard ceilings the owner can't override — protect the platform from a
// misconfigured workspace getting flooded. The defaults sit well below
// these, and the UI exposes only the band the owner can move within.
const MIN_DAILY_LIMIT = 10;
const MAX_DAILY_LIMIT_PLATFORM_KEY = 200;
const MAX_DAILY_LIMIT_BYO_KEY = 10_000;

export async function updateWorkspaceSettings(
  workspaceId: string,
  ownerId: string,
  patch: UpdateWorkspaceSettings,
): Promise<UpdateResult> {
  // Resolve the current state once — we'll need it for cross-field
  // validation (e.g. a non-default model is only allowed with a BYO key).
  const current = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId },
    select: {
      id: true,
      slug: true,
      openaiApiKeyEncrypted: true,
      model: true,
    },
  });
  if (!current) return { ok: false, field: "name", reason: "Workspace not found." };

  const data: Record<string, unknown> = {};

  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (trimmed.length < 1 || trimmed.length > 64) {
      return { ok: false, field: "name", reason: "Name must be 1–64 characters." };
    }
    data.name = trimmed;
  }

  if (patch.slug !== undefined && patch.slug !== current.slug) {
    const v = validateSlug(patch.slug);
    if (!v.ok) return { ok: false, field: "slug", reason: v.reason };
    const taken = await prisma.workspace.findUnique({
      where: { slug: patch.slug },
      select: { id: true },
    });
    if (taken && taken.id !== workspaceId) {
      return { ok: false, field: "slug", reason: "That slug is already taken." };
    }
    data.slug = patch.slug;
  }

  if (patch.isPublic !== undefined) data.isPublic = patch.isPublic;

  // Key handling: null clears, non-empty string encrypts and stores, empty
  // string is treated as "no change" (the form sends "" when masked).
  let willHaveKey = !!current.openaiApiKeyEncrypted;
  if (patch.openaiApiKey === null) {
    data.openaiApiKeyEncrypted = null;
    willHaveKey = false;
  } else if (typeof patch.openaiApiKey === "string" && patch.openaiApiKey.length > 0) {
    if (!patch.openaiApiKey.startsWith("sk-")) {
      return {
        ok: false,
        field: "openaiApiKey",
        reason: "OpenAI keys start with sk-. Paste the full key.",
      };
    }
    data.openaiApiKeyEncrypted = encryptToken(patch.openaiApiKey);
    willHaveKey = true;
  }

  if (patch.model !== undefined) {
    if (!isAllowedModel(patch.model)) {
      return { ok: false, field: "model", reason: "Unsupported model." };
    }
    if (modelRequiresByoKey(patch.model) && !willHaveKey) {
      return {
        ok: false,
        field: "model",
        reason: "This model needs a BYO OpenAI key.",
      };
    }
    data.model = patch.model;
  } else if (willHaveKey !== !!current.openaiApiKeyEncrypted && !willHaveKey) {
    // Owner cleared their BYO key; if the workspace was on a premium model,
    // snap it back to the default so we don't silently use the platform
    // key on it.
    if (isAllowedModel(current.model) && modelRequiresByoKey(current.model)) {
      data.model = DEFAULT_MODEL;
    }
  }

  if (patch.dailyCallLimit !== undefined) {
    const max = willHaveKey ? MAX_DAILY_LIMIT_BYO_KEY : MAX_DAILY_LIMIT_PLATFORM_KEY;
    if (patch.dailyCallLimit < MIN_DAILY_LIMIT || patch.dailyCallLimit > max) {
      return {
        ok: false,
        field: "dailyCallLimit",
        reason: `Daily limit must be between ${MIN_DAILY_LIMIT} and ${max}.`,
      };
    }
    data.dailyCallLimit = patch.dailyCallLimit;
  }

  if (Object.keys(data).length === 0) {
    // Nothing changed — return the current state without a write.
    const settings = await getWorkspaceSettings(workspaceId);
    return { ok: true, settings: settings! };
  }

  await prisma.workspace.update({ where: { id: workspaceId }, data });
  const settings = await getWorkspaceSettings(workspaceId);
  return { ok: true, settings: settings! };
}

// Look up a workspace by slug for the public chat route. Returns enough to
// service a chat request — id, model, decrypted key, isPublic, ceiling.
// Callers must check `isPublic` before bypassing auth.
export type PublicWorkspaceContext = {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  model: AllowedModel;
  // Plaintext OpenAI key when BYO is set, null otherwise. The chat route
  // uses this directly; don't log it.
  openaiApiKey: string | null;
  dailyCallLimit: number;
};

export async function getWorkspaceBySlug(slug: string): Promise<PublicWorkspaceContext | null> {
  const row = await prisma.workspace.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      isPublic: true,
      openaiApiKeyEncrypted: true,
      model: true,
      dailyCallLimit: true,
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isPublic: row.isPublic,
    model: isAllowedModel(row.model) ? row.model : DEFAULT_MODEL,
    openaiApiKey: row.openaiApiKeyEncrypted ? decryptToken(row.openaiApiKeyEncrypted) : null,
    dailyCallLimit: row.dailyCallLimit,
  };
}
