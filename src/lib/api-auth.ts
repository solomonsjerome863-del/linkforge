import { db } from "@/lib/db";

/**
 * Validates that a userId references an existing user.
 * Returns the user object on success, or null if not found.
 */
export async function validateUser(userId: string | undefined | null) {
  if (!userId) return null;
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    return user;
  } catch {
    return null;
  }
}