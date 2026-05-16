// AES-256-GCM for adapter credentials at rest. Key is SHA-256 of
// ADAPTER_TOKEN_KEY so any sufficiently random secret works.
//
// Protects against: stolen DB dumps, leaked backups, read-only SQL access.
// Does NOT protect against: app compromise — the running process can always
// decrypt. The `enc:v1:` prefix lets us tell encrypted values apart from
// legacy plaintext during rollout.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.ADAPTER_TOKEN_KEY;
  if (!raw || raw.length < 16) {
    throw new Error(
      "ADAPTER_TOKEN_KEY is missing or too short (need ≥16 chars). " +
      "Generate one with `openssl rand -hex 32`.",
    );
  }
  cachedKey = createHash("sha256").update(raw).digest();
  return cachedKey;
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptToken(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored; // legacy plaintext row
  const buf = Buffer.from(stored.slice(PREFIX.length), "base64");
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const data = buf.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function isEncrypted(stored: string): boolean {
  return stored.startsWith(PREFIX);
}
