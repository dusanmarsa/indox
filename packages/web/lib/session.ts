import { cookies, headers } from "next/headers";
import { resolveActiveWorkspace, type WorkspaceSummary } from "@indox/core";
import { auth, type Session } from "./auth";

// Cookie that pins the user's active workspace across requests. Read in
// `requireWorkspace`, written by /api/workspaces/active. Httponly so client
// JS can't tamper; SameSite=Lax so it survives normal navigation.
export const ACTIVE_WORKSPACE_COOKIE = "indox_workspace";

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

// Resolves the currently-active workspace for the authenticated user.
// Reads `indox_workspace` cookie; falls back to the user's first owned
// workspace, auto-creating Default when they have none. A stale cookie
// (workspace deleted / not owned) is silently ignored — the fallback path
// kicks in and the next /api/workspaces/active call resets the cookie.
export async function requireWorkspace(): Promise<{
  user: Session["user"];
  workspace: WorkspaceSummary;
}> {
  const user = await requireUser();
  const jar = await cookies();
  const activeId = jar.get(ACTIVE_WORKSPACE_COOKIE)?.value ?? null;
  const workspace = await resolveActiveWorkspace(user.id, activeId);
  return { user, workspace };
}

// API routes catch this and return 401; proxy.ts redirects browsers to /login.
export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}
