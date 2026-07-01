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

    const userWithSites = await db.user.findUnique({
      where: { id: userId },
      include: {
        sites: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!userWithSites) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { passwordHash: _, ...safeUser } = userWithSites;
    return NextResponse.json({ user: safeUser });
  } catch (error: unknown) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}