// Liveness probe for Railway/load-balancer health checks. No auth, no DB.
// Returns 200 as long as the Next.js server is running.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true });
}
