// Per-user bearer tokens for the MCP server. Stored plaintext rather than
// hashed because the server has to look users up by token on every request
// — hashing would mean an HMAC scan over all users per call. If that
// tradeoff stops feeling right (e.g. shared DB read access), switch to a
// prefix-indexed hash.

import { randomBytes } from "node:crypto";
import prisma from "./db";

const PREFIX = "mcp_";
const BYTE_LEN = 36;

export function generateMcpToken(): string {
  return PREFIX + randomBytes(BYTE_LEN).toString("base64url");
}

export async function rotateMcpToken(userId: string): Promise<string> {
  const token = generateMcpToken();
  await prisma.user.update({ where: { id: userId }, data: { mcpToken: token } });
  return token;
}

export async function getOrCreateMcpToken(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { mcpToken: true },
  });
  if (u?.mcpToken) return u.mcpToken;
  return rotateMcpToken(userId);
}

// Returns the owning user id, or null if the token is unknown / rotated.
export async function resolveMcpToken(token: string): Promise<string | null> {
  if (!token.startsWith(PREFIX)) return null;
  const u = await prisma.user.findUnique({
    where: { mcpToken: token },
    select: { id: true },
  });
  return u?.id ?? null;
}
