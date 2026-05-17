// Per-workspace daily call counter. Backs the public chat rate-limit:
// public workspaces have a hard `dailyCallLimit` set by the owner, counted
// across all IPs. The same row also lets us throttle per-IP within a day
// so one visitor can't burn the whole budget.

import prisma from "./db";

// Hard floor on per-IP daily calls for public chats — even if the owner
// sets dailyCallLimit very high, a single IP can't exceed this in a day.
// Prevents a single tab loop from consuming the entire workspace budget.
const PUBLIC_PER_IP_DAILY_MAX = 60;

export type RateLimitDecision =
  | { ok: true; workspaceUsed: number; ipUsed: number }
  | { ok: false; reason: "workspace_quota" | "ip_quota"; limit: number };

// Check + atomically increment the workspace's daily counter for the
// given IP. Done in a transaction so concurrent calls don't both pass
// the limit check before either increments.
export async function checkAndIncrementWorkspaceUsage(opts: {
  workspaceId: string;
  ip: string;
  workspaceDailyLimit: number;
}): Promise<RateLimitDecision> {
  const today = startOfUtcDay(new Date());

  return prisma.$transaction(async (tx) => {
    // Sum across all IPs for the workspace today — cheap thanks to the
    // (workspace_id, date) index.
    const agg = await tx.workspaceUsage.aggregate({
      where: { workspaceId: opts.workspaceId, date: today },
      _sum: { count: true },
    });
    const workspaceUsed = agg._sum.count ?? 0;
    if (workspaceUsed >= opts.workspaceDailyLimit) {
      return {
        ok: false,
        reason: "workspace_quota" as const,
        limit: opts.workspaceDailyLimit,
      };
    }

    const existing = await tx.workspaceUsage.findUnique({
      where: {
        workspaceId_ip_date: {
          workspaceId: opts.workspaceId,
          ip: opts.ip,
          date: today,
        },
      },
      select: { count: true },
    });
    const ipUsed = existing?.count ?? 0;
    if (ipUsed >= PUBLIC_PER_IP_DAILY_MAX) {
      return {
        ok: false,
        reason: "ip_quota" as const,
        limit: PUBLIC_PER_IP_DAILY_MAX,
      };
    }

    await tx.workspaceUsage.upsert({
      where: {
        workspaceId_ip_date: {
          workspaceId: opts.workspaceId,
          ip: opts.ip,
          date: today,
        },
      },
      update: { count: { increment: 1 } },
      create: { workspaceId: opts.workspaceId, ip: opts.ip, date: today, count: 1 },
    });

    return { ok: true, workspaceUsed: workspaceUsed + 1, ipUsed: ipUsed + 1 };
  });
}

// Total calls counted for a workspace today (sum across IPs). Used by the
// settings page so the owner can see how close they are to their limit.
export async function getWorkspaceUsageToday(workspaceId: string): Promise<number> {
  const today = startOfUtcDay(new Date());
  const agg = await prisma.workspaceUsage.aggregate({
    where: { workspaceId, date: today },
    _sum: { count: true },
  });
  return agg._sum.count ?? 0;
}

// Truncate to the start of the UTC day so the date column (DATE type)
// gets a stable key per calendar day regardless of caller timezone.
function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
