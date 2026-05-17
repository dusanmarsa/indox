import { NextResponse, type NextRequest } from "next/server";

// Edge-side auth gate. Checks only for the *presence* of better-auth's
// session cookie — full DB validation happens in the downstream handler
// via getUser(). The point here is to skip running expensive code for
// obviously-unauthed requests, not to authenticate.

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

function isProtected(pathname: string): boolean {
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return true;
  return (
    pathname.startsWith("/api/adapters") ||
    pathname.startsWith("/api/sources") ||
    pathname.startsWith("/api/conversations") ||
    pathname.startsWith("/api/workspaces") ||
    // /api/chat is intentionally NOT gated here — it serves both authed
    // and public (workspaceSlug) traffic. The route itself handles the
    // unauthed-without-slug case.
    pathname === "/api/mcp-token"
  );
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
