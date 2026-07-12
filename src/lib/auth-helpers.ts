import { pbkdf2Sync, randomBytes } from 'crypto';

/**
 * Hashes a plaintext password using PBKDF2 with a random salt.
 * Returns string formatted as "salt:hash" in hex.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored hashed password.
 * If the stored password does not contain a salt delimiter (":"),
 * it falls back to direct plaintext comparison (for old/seeded accounts).
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue.includes(':')) {
    // Legacy support for plain passwords
    return password === storedValue;
  }
  const [salt, hash] = storedValue.split(':');
  const verifyHash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}
