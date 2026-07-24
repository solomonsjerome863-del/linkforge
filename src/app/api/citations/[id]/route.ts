import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

const VALID_STATUSES = [
  "new",
  "reviewed",
  "outreach_sent",
  "converted",
  "dismissed",
];

const VALID_SENTIMENTS = ["positive", "neutral", "negative"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, status, hasBacklink, sentiment } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!status && hasBacklink === undefined && !sentiment) {
      return NextResponse.json(
        { error: "At least one field to update is required (status, hasBacklink, sentiment)" },
        { status: 400 }
      );
    }

    const user = await validateUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Validate ownership through citation -> brand -> site -> user
    const citation = await db.citation.findUnique({
      where: { id },
      include: {
        brand: {
          include: { site: { select: { userId: true } } },
        },
      },
    });

    if (!citation || citation.brand.site.userId !== userId) {
      return NextResponse.json(
        { error: "Citation not found or access denied" },
        { status: 403 }
      );
    }

    // Build update data with validation
    const data: Record<string, unknown> = {};

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      data.status = status;
      // Auto-set reviewedAt when status changes
      if (status !== "new") {
        data.reviewedAt = new Date();
      }
    }

    if (hasBacklink !== undefined) {
      if (typeof hasBacklink !== "boolean") {
        return NextResponse.json(
          { error: "hasBacklink must be a boolean" },
          { status: 400 }
        );
      }
      data.hasBacklink = hasBacklink;
    }

    if (sentiment !== undefined) {
      if (!VALID_SENTIMENTS.includes(sentiment)) {
        return NextResponse.json(
          { error: `Invalid sentiment. Must be one of: ${VALID_SENTIMENTS.join(", ")}` },
          { status: 400 }
        );
      }
      data.sentiment = sentiment;
    }

    const updated = await db.citation.update({
      where: { id },
      data,
    });

    return NextResponse.json({ citation: updated });
  } catch (error: unknown) {
    console.error("Update citation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const user = await validateUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Validate ownership through citation -> brand -> site -> user
    const citation = await db.citation.findUnique({
      where: { id },
      include: {
        brand: {
          include: { site: { select: { userId: true } } },
        },
      },
    });

    if (!citation || citation.brand.site.userId !== userId) {
      return NextResponse.json(
        { error: "Citation not found or access denied" },
        { status: 403 }
      );
    }

    await db.citation.delete({
      where: { id },
    });

    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    console.error("Delete citation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
