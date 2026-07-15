import { pbkdf2Sync, randomBytes } from 'crypto';

const DEFAULT_ITERATIONS = 600000;
const LEGACY_ITERATIONS = 1000;

/**
 * Hashes a plaintext password using PBKDF2 with a random salt and 600,000 iterations.
 * Returns string formatted as "salt:iterations:hash" in hex.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, DEFAULT_ITERATIONS, 64, 'sha512').toString('hex');
  return `${salt}:${DEFAULT_ITERATIONS}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored hashed password.
 * Supports:
 * - New format: "salt:iterations:hash" (e.g. 600,000 iterations)
 * - Old format: "salt:hash" (defaults to 1,000 iterations)
 * - Plaintext format (no ":" delimiter for old/seeded accounts)
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue || typeof storedValue !== 'string') return false;
  
  if (!storedValue.includes(':')) {
    // Legacy support for plain passwords
    return password === storedValue;
  }

  const parts = storedValue.split(':');
  let salt: string;
  let iterations = LEGACY_ITERATIONS;
  let storedHash: string;

  if (parts.length === 3) {
    salt = parts[0];
    iterations = parseInt(parts[1], 10) || LEGACY_ITERATIONS;
    storedHash = parts[2];
  } else if (parts.length === 2) {
    salt = parts[0];
    iterations = LEGACY_ITERATIONS;
    storedHash = parts[1];
  } else {
    return false;
  }

  try {
    const verifyHash = pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return storedHash === verifyHash;
  } catch (err) {
    return false;
  }
}

