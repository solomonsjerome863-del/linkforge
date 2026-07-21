import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * PATCH /api/user/profile
 * Update user profile fields (name, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updateData.name = trimmed;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[Profile] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}