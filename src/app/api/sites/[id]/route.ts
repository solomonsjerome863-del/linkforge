import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get("userId");
    if (userId) {
      const user = await validateUser(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }
    }

    const site = await db.site.findUnique({
      where: { id },
      include: {
        _count: {
          select: { pages: true, suggestions: true, crawlJobs: true },
        },
      },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    if (userId && site.userId !== userId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({ site });
  } catch (error: unknown) {
    console.error("Get site error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get("userId");
    if (userId) {
      const user = await validateUser(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }
    }

    const site = await db.site.findUnique({ where: { id } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    if (userId && site.userId !== userId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Cascade deletes are handled by Prisma schema (onDelete: Cascade)
    await db.site.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete site error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}