import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

if (!hasUpstash) {
  console.warn(
    "[indox] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — rate limiting disabled"
  );
}

const noopLimiter = { limit: async () => ({ success: true }) } as unknown as Ratelimit;

export const chatRatelimit: Pick<Ratelimit, "limit"> = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(50, "1 m"),
      prefix: "indox:chat",
      analytics: true,
    })
  : noopLimiter;

// Key on the session id when we have one — harder to rotate around than a
// spoofed `x-forwarded-for`. Falls back to IP only for unauthenticated paths
// (none today, but keeps the helper general).
export function rateLimitKey(req: Request, sessionId: string | null): string {
  if (sessionId) return `s:${sessionId}`;
  const xff = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
  return `ip:${xff ?? "anonymous"}`;
}

export function ipFromRequest(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}
