// Bearer tokens for the MCP server. A token is owned by a user; the user can
// have many tokens (label them per-client: "Cursor at home", "Claude work",
// etc). Each token implicitly grants access to all workspaces the user owns;
// setting `workspaceIds` narrows it to a subset.
//
// Stored plaintext for O(1) lookup on every MCP request — hashing would mean
// an HMAC scan over all rows per call. If that tradeoff stops feeling right
// (shared DB read access, e.g.), switch to prefix-indexed hashing.

import { randomBytes } from "node:crypto";
import prisma from "./db";

const PREFIX = "mcp_";
const BYTE_LEN = 36;
const PERSONAL_LABEL = "Personal";

export type ResolvedToken = {
  userId: string;
  // Effective set of workspace ids this token can act on, intersected
  // against the user's current ownership. May be empty if the token's
  // explicit scope no longer matches any workspace the user owns.
  workspaceIds: string[];
};

export function generateMcpToken(): string {
  return PREFIX + randomBytes(BYTE_LEN).toString("base64url");
}

export async function createToken(opts: {
  userId: string;
  label?: string | null;
  workspaceIds?: string[];
}): Promise<{ id: string; token: string }> {
  const token = generateMcpToken();
  const row = await prisma.workspaceToken.create({
    data: {
      userId: opts.userId,
      token,
      label: opts.label ?? null,
      workspaceIds: opts.workspaceIds ?? [],
    },
    select: { id: true, token: true },
  });
  return row;
}

// Returns the user's "Personal" token (label="Personal", scope=all
// workspaces), creating it on demand. This is the token shown on the
// dashboard MCP page — there's exactly one per user.
export async function getOrCreatePersonalToken(userId: string): Promise<string> {
  const existing = await prisma.workspaceToken.findFirst({
    where: { userId, label: PERSONAL_LABEL },
    select: { token: true },
  });
  if (existing) return existing.token;
  const { token } = await createToken({ userId, label: PERSONAL_LABEL });
  return token;
}

export async function rotatePersonalToken(userId: string): Promise<string> {
  const token = generateMcpToken();
  // upsert via deleteMany+create — Prisma can't upsert on (userId,label)
  // without a unique constraint, and we'd rather not add one just for this.
  await prisma.workspaceToken.deleteMany({
    where: { userId, label: PERSONAL_LABEL },
  });
  await prisma.workspaceToken.create({
    data: { userId, token, label: PERSONAL_LABEL },
  });
  return token;
}

export async function listUserTokens(userId: string) {
  return prisma.workspaceToken.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      token: true,
      label: true,
      workspaceIds: true,
      createdAt: true,
    },
  });
}

export async function deleteToken(tokenId: string, userId: string): Promise<boolean> {
  const r = await prisma.workspaceToken.deleteMany({
    where: { id: tokenId, userId },
  });
  return r.count > 0;
}

// Resolve a bearer header to the issuing user plus the workspaces the token
// can currently act on. Returns null when the token is unknown.
export async function resolveMcpToken(token: string): Promise<ResolvedToken | null> {
  if (!token.startsWith(PREFIX)) return null;
  const row = await prisma.workspaceToken.findUnique({
    where: { token },
    select: { userId: true, workspaceIds: true },
  });
  if (!row) return null;

  // Always intersect with current ownership — if a workspace was deleted or
  // ownership changed, the token must not reach it.
  const ownedIds = (
    await prisma.workspace.findMany({
      where: { ownerId: row.userId },
      select: { id: true },
    })
  ).map((w) => w.id);

  const scoped =
    row.workspaceIds.length === 0
      ? ownedIds
      : row.workspaceIds.filter((id) => ownedIds.includes(id));

  return { userId: row.userId, workspaceIds: scoped };
}
