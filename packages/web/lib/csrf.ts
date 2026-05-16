// Same-origin guard for cookie-authed mutating routes. SameSite=lax blocks
// classic form CSRF; this catches script-driven cross-origin POSTs that
// SameSite still allows.

const ALLOWED_EXTRA = (process.env.CSRF_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function isSameOrigin(req: Request): boolean {
  const target = new URL(req.url).origin;
  const origin = req.headers.get("origin") ?? originOf(req.headers.get("referer") ?? "");
  if (!origin) return false;
  return origin === target || ALLOWED_EXTRA.includes(origin);
}

export function csrfReject(): Response {
  return new Response(JSON.stringify({ error: "cross-origin request rejected" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}
