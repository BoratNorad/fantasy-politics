import { randomBytes, randomInt } from 'node:crypto';

// No 0/O/1/I/L to keep codes easy to read aloud or type on a phone.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Short, human-friendly invite code like "K7QM-2XRP". */
export function generateInviteCode(): string {
  let s = '';
  for (let i = 0; i < 8; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

/** Normalize user-typed codes: uppercase, strip spaces, ensure the dash. */
export function normalizeInviteCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
}

/** Long random token for password-reset links. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}
