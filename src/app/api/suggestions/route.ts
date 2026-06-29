import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get("siteId");
    const status = request.nextUrl.searchParams.get("status");

    if (!siteId) {
      return NextResponse.json({ error: "siteId query parameter is required" }, { status: 400 });
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
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}