/** Centralized, validated environment configuration. */

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required environment variable ${name}`);
  return v;
}

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  isProd,
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: required('DATABASE_URL'),
  // A dev-only fallback keeps local setup easy; production must set it.
  jwtSecret: required('JWT_SECRET', isProd ? undefined : 'dev-only-insecure-secret'),
  /** Comma-separated list of emails that get site-admin access. */
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  /** Public base URL used to build invite / reset links (optional; falls back to request host). */
  publicUrl: process.env.PUBLIC_URL?.replace(/\/$/, ''),
};
