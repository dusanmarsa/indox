import { headers } from "next/headers";
import { auth, type Session } from "./auth";

// `ownerKey` columns on Adapter/Conversation hold the User.id directly,
// so getOwnerKey and getUserId are the same call — keeping both names
// to make ownership-scoped code read like English.

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function getUser(): Promise<Session["user"] | null> {
  return (await getSession())?.user ?? null;
}

export async function requireUser(): Promise<Session["user"]> {
  const user = await getUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function getOwnerKey(): Promise<string | null> {
  return (await getUser())?.id ?? null;
}

export async function requireOwnerKey(): Promise<string> {
  return (await requireUser()).id;
}

// API routes catch this and return 401; proxy.ts redirects browsers to /login.
export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}
