import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * DELETE /api/admin/users/[id]
 *
 * Permanently deletes a user and all related data.
 * Sites, pages, suggestions, citations, and crawl jobs cascade
 * via Prisma relation onDelete: Cascade.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin auth
    const adminEmail = process.env.ADMIN_EMAIL;
    const requestEmail = request.headers.get("x-admin-email");
    if (!adminEmail || requestEmail !== adminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safety: never allow deleting the admin account itself
    if (user.email === adminEmail) {
      return NextResponse.json(
        { error: "Cannot delete the admin account" },
        { status: 400 }
      );
    }

    await db.user.delete({ where: { id } });

    console.log(`[Admin] User deleted: ${user.email} (${id})`);

    return NextResponse.json({
      success: true,
      deleted: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("[Admin Delete User]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
