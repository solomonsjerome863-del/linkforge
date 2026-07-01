import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (userId) {
      const user = await validateUser(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }
    }

    const suggestion = await db.linkSuggestion.findUnique({ where: { id } });
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    const updated = await db.linkSuggestion.update({
      where: { id },
      data: { status: "rejected" },
    });

    return NextResponse.json({ suggestion: updated });
  } catch (error: unknown) {
    console.error("Reject suggestion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}