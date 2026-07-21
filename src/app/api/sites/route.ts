import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
    }

    const user = await validateUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, url, platform } = body;

    if (!userId || !name || !url) {
      return NextResponse.json({ error: "userId, name, and url are required" }, { status: 400 });
    }

    // Validate URL format
    if (url.length > 2048) {
      return NextResponse.json({ error: "URL is too long" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "URL must start with https://" }, { status: 400 });
    }

    const user = await validateUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const site = await db.site.create({
      data: {
        userId,
        name,
        url,
        platform: ["wordpress", "shopify", "webflow", "ghost", "custom"].includes(platform) ? platform : "wordpress",
        status: "pending",
      },
    });

    return NextResponse.json({ site }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create site error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
