/**
 * Server-side input validation helpers.
 * Used by signup and any route that accepts user identifiers.
 */

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Common disposable / throwaway email domains — signups with these are rejected.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "yopmail.com", "guerrillamail.com", "sharklasers.com",
  "10minutemail.com", "tempmail.com", "temp-mail.org", "throwawaymail.com",
  "trashmail.com", "getnada.com", "dispostable.com", "maildrop.cc",
  "fakeinbox.com", "mailnesia.com", "tempr.email", "discard.email",
  "spam4.me", "mohmal.com", "10mail.org", "emailondeck.com",
  "burnermail.io", "tempinbox.com", "crazymailing.com", "mail-temp.com",
  "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz",
  "pokemail.net", "spamgourmet.com", "trbvm.com", "trashmail.de",
  "mytrashmail.com", "mailtemp.net", "1secmail.com", "1secmail.net",
  "mohmal.im", "tempinbox.com", "spambox.us", "mailexpire.com",
]);

export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.length > 254) return false;
  if (!EMAIL_RE.test(normalized)) return false;
  const domain = normalized.split("@")[1];
  if (!domain || DISPOSABLE_DOMAINS.has(domain)) return false;
  return true;
}

export function isDisposableEmail(email: string): boolean {
  const domain = String(email).toLowerCase().trim().split("@")[1];
  return !!domain && DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Returns an error message if the password fails policy, or null if OK.
 * Policy: 8-128 chars, at least one letter and one number.
 */
export function getPasswordError(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (password.length > 128) {
    return "Password must be at most 128 characters long";
  }
  if (!/[A-Za-z]/.test(password)) {
    return "Password must contain at least one letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}
