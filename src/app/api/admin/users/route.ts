import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/users?search=email&plan=pro&limit=20
 *
 * Lists all users with optional search/filter. Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    // Admin auth
    const adminEmail = process.env.ADMIN_EMAIL;
    const requestEmail = request.headers.get("x-admin-email");
    if (!adminEmail || requestEmail !== adminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = request.nextUrl;
    const search = url.searchParams.get("search") || "";
    const plan = url.searchParams.get("plan") || "";
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }

    if (plan && ["starter", "pro", "business", "enterprise"].includes(plan)) {
      where.plan = plan;
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        usageLinks: true,
        usageQueries: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        subscriptionEndsAt: u.subscriptionEndsAt?.toISOString() || null,
      })),
      total: users.length,
    });
  } catch (error) {
    console.error("[Admin Users]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
