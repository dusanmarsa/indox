import { NextResponse, type NextRequest } from "next/server";

// Edge-side auth gate. Checks only for the *presence* of better-auth's
// session cookie — full DB validation happens in the downstream handler
// via getUser(). The point here is to skip running expensive code for
// obviously-unauthed requests, not to authenticate.

const SESSION_COOKIE_NAMES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

// Dashboard now owns the root path. Everything except the public surfaces
// below is gated.
const PUBLIC_PATHS = ["/login"];
const PUBLIC_PREFIXES = ["/w/", "/api/auth/"];

function isProtected(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return false;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return true;
  // /api/chat is intentionally NOT gated here — it serves both authed
  // and public (workspaceSlug) traffic. The route itself handles the
  // unauthed-without-slug case.
  if (pathname === "/api/chat") return false;
  if (pathname.startsWith("/api/")) {
    return (
      pathname.startsWith("/api/adapters") ||
      pathname.startsWith("/api/sources") ||
      pathname.startsWith("/api/conversations") ||
      pathname.startsWith("/api/workspaces") ||
      pathname === "/api/mcp-token"
    );
  }
  // Everything else under root is dashboard.
  return true;
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  const hasSession = SESSION_COOKIE_NAMES.some((n) => req.cookies.get(n));
  if (hasSession) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
