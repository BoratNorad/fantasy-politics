/**
 * Session handling: a signed JWT in an httpOnly cookie.
 * The frontend is served from the same origin, so no CORS or token storage is needed.
 */
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env';
import { HttpError } from '../lib/http';
import { prisma } from '../lib/prisma';

export const SESSION_COOKIE = 'fp_session';
const SESSION_DAYS = 30;

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export function isAdminEmail(email: string): boolean {
  return env.adminEmails.includes(email.toLowerCase());
}

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: `${SESSION_DAYS}d` });
}

/** Verify a session token and return the user id, or null. Also used by Socket.io. */
export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, userId: string) {
  res.cookie(SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export async function loadSessionUser(token: string | undefined): Promise<SessionUser | null> {
  const userId = verifySession(token);
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, displayName: true },
  });
  return user ? { ...user, isAdmin: isAdminEmail(user.email) } : null;
}

/** Attaches req.user when a valid session cookie is present (never rejects). */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const user = await loadSessionUser(req.cookies?.[SESSION_COOKIE]);
  if (user) req.user = user;
  next();
}

export function requireUser(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new HttpError(401, 'Please log in.');
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new HttpError(401, 'Please log in.');
  if (!req.user.isAdmin) throw new HttpError(403, 'Admins only.');
  next();
}

/** Helper for handlers behind requireUser: returns the (definitely present) user. */
export function currentUser(req: Request): SessionUser {
  if (!req.user) throw new HttpError(401, 'Please log in.');
  return req.user;
}
