/** /api/auth — sign up, log in, log out, current user, password reset. */
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { HttpError, param, parseBody } from '../lib/http';
import { prisma } from '../lib/prisma';
import { clearSessionCookie, currentUser, requireUser, setSessionCookie } from './session';

export const authRouter = Router();

const email = z.string().trim().toLowerCase().email('Enter a valid email');
const password = z.string().min(8, 'Password must be at least 8 characters').max(200);

const signupSchema = z.object({
  email,
  password,
  displayName: z.string().trim().min(1, 'Enter your name').max(40),
});

authRouter.post('/signup', async (req, res) => {
  const body = parseBody(signupSchema, req.body);
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw new HttpError(409, 'An account with that email already exists.');
  const user = await prisma.user.create({
    data: {
      email: body.email,
      displayName: body.displayName,
      passwordHash: await bcrypt.hash(body.password, 10),
    },
  });
  setSessionCookie(res, user.id);
  res.status(201).json({ ok: true });
});

authRouter.post('/login', async (req, res) => {
  const body = parseBody(z.object({ email, password: z.string() }), req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    throw new HttpError(401, 'Wrong email or password.');
  }
  setSessionCookie(res, user.id);
  res.json({ ok: true });
});

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  res.json({ user: req.user ?? null });
});

authRouter.patch('/me', requireUser, async (req, res) => {
  const body = parseBody(
    z.object({ displayName: z.string().trim().min(1).max(40) }),
    req.body,
  );
  await prisma.user.update({ where: { id: currentUser(req).id }, data: body });
  res.json({ ok: true });
});

/** Check a reset token before showing the "choose new password" form. */
authRouter.get('/reset/:token', async (req, res) => {
  const reset = await prisma.passwordReset.findUnique({
    where: { token: param(req, 'token') },
    include: { user: { select: { email: true } } },
  });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    throw new HttpError(404, 'This reset link is invalid or has expired.');
  }
  res.json({ email: reset.user.email });
});

authRouter.post('/reset/:token', async (req, res) => {
  const body = parseBody(z.object({ password }), req.body);
  const reset = await prisma.passwordReset.findUnique({ where: { token: param(req, 'token') } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    throw new HttpError(404, 'This reset link is invalid or has expired.');
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash: await bcrypt.hash(body.password, 10) },
    }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);
  setSessionCookie(res, reset.userId);
  res.json({ ok: true });
});
