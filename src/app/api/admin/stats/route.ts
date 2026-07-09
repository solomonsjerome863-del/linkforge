import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    // Run all queries in parallel
    const [
      totalUsers,
      activeSubscribers,
      totalSites,
      totalSuggestions,
      recentUsers,
      planDistribution,
      subscriptionStatuses,
      dailySignups,
    ] = await Promise.all([
      // Total users
      db.user.count(),

      // Active subscribers
      db.user.count({
        where: {
          subscriptionStatus: { in: ["active", "on_trial"] },
        },
      }),

      // Total sites
      db.site.count(),

      // Total suggestions
      db.linkSuggestion.count(),

      // Recent 10 users
      db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          subscriptionStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Plan distribution
      db.user.groupBy({
        by: ["plan"],
        _count: { plan: true },
      }),

      // Subscription status distribution
      db.user.groupBy({
        by: ["subscriptionStatus"],
        _count: { subscriptionStatus: true },
        where: { subscriptionStatus: { not: null } },
      }),

      // Daily signups (last 30 days)
      db.$queryRaw<
        Array<{ date: string; count: bigint }>
      >(Prisma.sql`
        SELECT DATE("createdAt")::text as date, COUNT(*)::bigint as count
        FROM "User"
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `),
    ]);

    // Calculate MRR
    const planPrices: Record<string, number> = {
      pro: 49,
      business: 149,
      enterprise: 0,
      starter: 0,
    };

    const activePlanCounts = planDistribution.filter(
      (p) => p.plan !== "starter" && p.plan !== "enterprise"
    );

    const mrr = activePlanCounts.reduce(
      (sum, p) => sum + (planPrices[p.plan] || 0) * p._count.plan,
      0
    );

    // Format plan distribution
    const planBreakdown: Record<string, number> = {
      starter: 0,
      pro: 0,
      business: 0,
      enterprise: 0,
    };
    planDistribution.forEach((p) => {
      planBreakdown[p.plan] = p._count.plan;
    });

    // Format subscription statuses
    const statusBreakdown: Record<string, number> = {};
    subscriptionStatuses.forEach((s) => {
      statusBreakdown[s.subscriptionStatus || "none"] = s._count.subscriptionStatus;
    });

    return NextResponse.json({
      totalUsers,
      activeSubscribers,
      totalSites,
      totalSuggestions,
      mrr,
      planBreakdown,
      statusBreakdown,
      recentUsers: recentUsers.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      dailySignups: dailySignups.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
    });
  } catch (error) {
    console.error("[Admin Stats]", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}