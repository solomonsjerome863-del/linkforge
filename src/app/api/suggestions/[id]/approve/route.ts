import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const suggestion = await db.linkSuggestion.findUnique({ where: { id } });
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    const updated = await db.linkSuggestion.update({
      where: { id },
      data: { status: "approved" },
    });

    return NextResponse.json({ suggestion: updated });
  } catch (error: unknown) {
    console.error("Approve suggestion error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}