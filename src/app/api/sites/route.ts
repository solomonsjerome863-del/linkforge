import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
    }

    const sites = await db.site.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { pages: true, suggestions: true },
        },
      },
    });

    return NextResponse.json({ sites });
  } catch (error: unknown) {
    console.error("List sites error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, url, platform } = body;

    if (!userId || !name || !url) {
      return NextResponse.json({ error: "userId, name, and url are required" }, { status: 400 });
    }

    const site = await db.site.create({
      data: {
        userId,
        name,
        url,
        platform: platform || "wordpress",
        status: "pending",
      },
    });

    return NextResponse.json({ site }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create site error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
