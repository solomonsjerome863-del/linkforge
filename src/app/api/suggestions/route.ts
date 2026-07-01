import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get("siteId");
    const status = request.nextUrl.searchParams.get("status");

    if (!siteId) {
      return NextResponse.json({ error: "siteId query parameter is required" }, { status: 400 });
    }

    const userId = request.nextUrl.searchParams.get("userId");
    if (userId) {
      const user = await validateUser(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }

      // Verify the site belongs to the user
      const site = await db.site.findUnique({ where: { id: siteId } });
      if (!site || site.userId !== userId) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }
    }

    const where: Record<string, unknown> = { siteId };
    if (status) {
      where.status = status;
    }

    const suggestions = await db.linkSuggestion.findMany({
      where,
      orderBy: { score: "desc" },
      include: {
        sourcePage: {
          select: { id: true, title: true, url: true },
        },
        targetPage: {
          select: { id: true, title: true, url: true },
        },
      },
    });

    return NextResponse.json({ suggestions });
  } catch (error: unknown) {
    console.error("List suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}