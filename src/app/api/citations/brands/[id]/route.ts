import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = resolveUserId(request, request.nextUrl.searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const brand = await db.citationBrand.findUnique({
      where: { id },
      include: { site: { select: { userId: true } } },
    });

    if (!brand || brand.site.userId !== userId) {
      return NextResponse.json(
        { error: "Brand not found or access denied" },
        { status: 403 }
      );
    }

    // Delete brand and all its citations (cascade handles citations)
    await db.citationBrand.delete({
      where: { id },
    });

    // If the deleted brand was primary, promote the next oldest brand
    if (brand.isPrimary) {
      const nextBrand = await db.citationBrand.findFirst({
        where: { siteId: brand.siteId },
        orderBy: { createdAt: "asc" },
      });

      if (nextBrand) {
        await db.citationBrand.update({
          where: { id: nextBrand.id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    console.error("Delete citation brand error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
