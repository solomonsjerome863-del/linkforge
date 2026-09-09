import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const userId = resolveUserId(request, request.nextUrl.searchParams.get("userId"));
    const siteId = request.nextUrl.searchParams.get("siteId");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId query parameter is required" },
        { status: 400 }
      );
    }

    const site = await db.site.findUnique({
      where: { id: siteId },
    });

    if (!site || site.userId !== userId) {
      return NextResponse.json(
        { error: "Site not found or access denied" },
        { status: 403 }
      );
    }

    const brands = await db.citationBrand.findMany({
      where: { siteId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { citations: true },
        },
      },
    });

    return NextResponse.json({ brands });
  } catch (error: unknown) {
    console.error("List citation brands error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, name, isPrimary } = body;
    const userId = resolveUserId(
      request,
      typeof body.userId === "string" ? body.userId : null
    );

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    if (!siteId || !name) {
      return NextResponse.json(
        { error: "siteId and name are required" },
        { status: 400 }
      );
    }

    if (!name.trim() || name.trim().length > 200) {
      return NextResponse.json(
        { error: "Brand name must be 1-200 characters" },
        { status: 400 }
      );
    }

    const site = await db.site.findUnique({
      where: { id: siteId },
    });

    if (!site || site.userId !== userId) {
      return NextResponse.json(
        { error: "Site not found or access denied" },
        { status: 403 }
      );
    }

    // Check if brand with same name already exists for this site
    const existingBrand = await db.citationBrand.findFirst({
      where: { siteId, name: name.trim() },
    });

    if (existingBrand) {
      return NextResponse.json(
        { error: "A brand with this name already exists for this site" },
        { status: 409 }
      );
    }

    // Count existing brands to auto-detect first brand
    const brandCount = await db.citationBrand.count({
      where: { siteId },
    });

    const shouldSetPrimary = isPrimary === true || brandCount === 0;

    const brand = await db.citationBrand.create({
      data: {
        name: name.trim(),
        siteId,
        isPrimary: shouldSetPrimary,
      },
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create citation brand error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
