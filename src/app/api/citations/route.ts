import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

const VALID_STATUSES = [
  "new",
  "reviewed",
  "outreach_sent",
  "converted",
  "dismissed",
];

const VALID_SOURCE_TYPES = [
  "blog",
  "news",
  "forum",
  "reddit",
  "social",
  "other",
];

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const siteId = request.nextUrl.searchParams.get("siteId");
    const status = request.nextUrl.searchParams.get("status");
    const sourceType = request.nextUrl.searchParams.get("sourceType");
    const hasBacklink = request.nextUrl.searchParams.get("hasBacklink");
    const unlinkedOnly = request.nextUrl.searchParams.get("unlinkedOnly");
    const page = parseInt(
      request.nextUrl.searchParams.get("page") || "1",
      10
    );
    const limit = parseInt(
      request.nextUrl.searchParams.get("limit") || "20",
      10
    );

    if (!userId || !siteId) {
      return NextResponse.json(
        { error: "userId and siteId query parameters are required" },
        { status: 400 }
      );
    }

    // Validate pagination params
    if (page < 1) {
      return NextResponse.json(
        { error: "page must be >= 1" },
        { status: 400 }
      );
    }
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    const user = await validateUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Validate site ownership
    const site = await db.site.findUnique({
      where: { id: siteId },
    });

    if (!site || site.userId !== userId) {
      return NextResponse.json(
        { error: "Site not found or access denied" },
        { status: 403 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      siteId,
    };

    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }

    if (sourceType && VALID_SOURCE_TYPES.includes(sourceType)) {
      where.sourceType = sourceType;
    }

    if (hasBacklink === "true") {
      where.hasBacklink = true;
    } else if (hasBacklink === "false") {
      where.hasBacklink = false;
    }

    if (unlinkedOnly === "true") {
      where.hasBacklink = false;
    }

    // Fetch citations with pagination
    const [citations, total] = await Promise.all([
      db.citation.findMany({
        where,
        orderBy: { opportunityScore: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              isPrimary: true,
            },
          },
        },
      }),
      db.citation.count({ where }),
    ]);

    return NextResponse.json({
      citations,
      total,
      page,
      limit,
    });
  } catch (error: unknown) {
    console.error("List citations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
