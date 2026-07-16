import bcrypt from "bcryptjs";
import crypto from "crypto";

const BCRYPT_ROUNDS = 12;
const LEGACY_SALT = "linkforge-salt";

/**
 * Hash a password using bcrypt (preferred).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a stored hash.
 * Supports both bcrypt hashes (prefixed with $2) and legacy SHA-256 hashes.
 * If a legacy hash matches, returns a tuple [true, needsRehash: true]
 * so the caller can upgrade the hash in the database.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  // bcrypt hashes always start with $2
  if (storedHash.startsWith("$2")) {
    const valid = await bcrypt.compare(password, storedHash);
    return { valid, needsRehash: false };
  }

  // Legacy SHA-256 fallback
  const legacyHash = legacyHashPassword(password);
  if (legacyHash === storedHash) {
    return { valid: true, needsRehash: true };
  }

  return { valid: false, needsRehash: false };
}

/**
 * Legacy SHA-256 hash (used before bcrypt migration).
 * Kept only for verifying old passwords during transition.
 */
function legacyHashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + LEGACY_SALT)
    .digest("hex");
}