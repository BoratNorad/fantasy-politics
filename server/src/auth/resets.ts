import type { Request } from 'express';
import { env } from '../env';
import { generateToken } from '../lib/codes';
import { prisma } from '../lib/prisma';

const RESET_HOURS = 48;

/** Base URL for links we hand to users (invite links, reset links). */
export function publicBaseUrl(req: Request): string {
  return env.publicUrl ?? `${req.protocol}://${req.get('host')}`;
}

/**
 * Create a one-time password reset link. There's no email provider in v1, so an
 * admin or commissioner copies this link and sends it to the user directly.
 */
export async function createResetLink(req: Request, userId: string): Promise<string> {
  const token = generateToken();
  await prisma.passwordReset.create({
    data: { token, userId, expiresAt: new Date(Date.now() + RESET_HOURS * 3600 * 1000) },
  });
  return `${publicBaseUrl(req)}/reset/${token}`;
}
