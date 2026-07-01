import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, action, userId } = body;

    if (userId) {
      const user = await validateUser(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required and must not be empty" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const status = action === "approve" ? "approved" : "rejected";

    const result = await db.linkSuggestion.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    return NextResponse.json({
      updated: result.count,
      status,
    });
  } catch (error: unknown) {
    console.error("Batch update suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}