/** /api/admin — site-admin tools: player pool, event log, user password resets. */
import { eventInputSchema, playerInputSchema } from '@fp/shared';
import { Router } from 'express';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { createResetLink } from '../auth/resets';
import { currentUser, isAdminEmail, requireAdmin } from '../auth/session';
import { badRequest, HttpError, notFound, param, parseBody } from '../lib/http';
import { markLeftOffice } from '../lib/playerService';
import { prisma } from '../lib/prisma';
import { fetchWikiSummary } from '../lib/wikipedia';
import { playerFilter } from './players';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

// ─── Players ────────────────────────────────────────────────────────────────

adminRouter.get('/players', async (req, res) => {
  const where = playerFilter(req.query);
  if (req.query.needsVerification === '1') where.needsVerification = true;
  const players = await prisma.player.findMany({
    where,
    orderBy: [{ country: 'asc' }, { position: 'asc' }, { defaultRank: 'asc' }],
    include: {
      _count: { select: { rosterSpots: true, events: true } },
      replacedBy: { select: { id: true, name: true } },
    },
  });
  const unverified = await prisma.player.count({ where: { needsVerification: true } });
  res.json({ players, unverified });
});

adminRouter.post('/players', async (req, res) => {
  const body = parseBody(playerInputSchema, req.body);
  const player = await prisma.player.create({
    data: { ...body, leftOfficeAt: body.status === 'LEFT_OFFICE' ? new Date() : null },
  });
  res.status(201).json({ player });
});

adminRouter.put('/players/:id', async (req, res) => {
  const body = parseBody(playerInputSchema, req.body);
  const existing = await prisma.player.findUnique({ where: { id: param(req, 'id') } });
  if (!existing) throw notFound('Player not found');
  if (body.status === 'LEFT_OFFICE' && existing.status !== 'LEFT_OFFICE') {
    // Route through the dedicated flow so rosters are cleaned up.
    throw badRequest('Use "Mark left office" to remove a player from office.');
  }
  const player = await prisma.player.update({
    where: { id: existing.id },
    data: { ...body, leftOfficeAt: body.status === 'LEFT_OFFICE' ? existing.leftOfficeAt : null },
  });
  res.json({ player });
});

/** Quick status change without editing the whole record. */
adminRouter.patch('/players/:id/status', async (req, res) => {
  const { status } = parseBody(
    z.object({ status: playerInputSchema.shape.status }),
    req.body,
  );
  if (status === 'LEFT_OFFICE') throw badRequest('Use "Mark left office" for that.');
  const player = await prisma.player.update({
    where: { id: param(req, 'id') },
    data: { status, leftOfficeAt: null },
  });
  res.json({ player });
});

adminRouter.post('/players/:id/left-office', async (req, res) => {
  const body = parseBody(
    z.object({
      logPenalty: z.boolean().default(true),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      replacement: z
        .object({
          name: z.string().trim().min(1).max(100),
          officeTitle: z.string().trim().min(1).max(150),
          wikiTitle: z.string().trim().min(1).max(200),
        })
        .optional()
        .nullable(),
    }),
    req.body,
  );
  const player = await prisma.player.findUnique({ where: { id: param(req, 'id') } });
  if (!player) throw notFound('Player not found');
  if (player.status === 'LEFT_OFFICE') throw badRequest('Already marked as left office.');
  if (body.replacement && (await prisma.player.findUnique({ where: { replacesId: player.id } }))) {
    throw badRequest('This player already has a replacement.');
  }
  const result = await markLeftOffice(player.id, {
    logPenalty: body.logPenalty,
    date: body.date ?? DateTime.utc().toISODate()!,
    createdById: currentUser(req).id,
    replacement: body.replacement ?? undefined,
  });
  res.json(result);
});

adminRouter.delete('/players/:id', async (req, res) => {
  const player = await prisma.player.findUnique({
    where: { id: param(req, 'id') },
    include: { _count: { select: { draftPicks: true } } },
  });
  if (!player) throw notFound('Player not found');
  if (player._count.draftPicks > 0) {
    throw new HttpError(
      409,
      'This player has been drafted in a league, so deleting would break draft history. Mark them "Left office" instead.',
    );
  }
  await prisma.$transaction([
    prisma.rosterSpot.deleteMany({ where: { playerId: player.id } }),
    prisma.player.delete({ where: { id: player.id } }),
  ]);
  res.json({ ok: true });
});

/** Pull photo + short bio from the player's Wikipedia article. */
adminRouter.post('/players/:id/wiki-refresh', async (req, res) => {
  const player = await prisma.player.findUnique({ where: { id: param(req, 'id') } });
  if (!player) throw notFound('Player not found');
  const summary = await fetchWikiSummary(player.wikiTitle);
  if (!summary) throw badRequest(`No Wikipedia article titled "${player.wikiTitle}".`);
  const updated = await prisma.player.update({
    where: { id: player.id },
    data: {
      photoUrl: summary.thumbnail ?? player.photoUrl,
      bio: summary.extract ?? player.bio,
    },
  });
  res.json({ player: updated, resolvedTitle: summary.title });
});

/** Batch version for players missing a photo (25 per call to stay polite to Wikipedia). */
adminRouter.post('/players/wiki-refresh-missing', async (_req, res) => {
  const players = await prisma.player.findMany({
    where: { OR: [{ photoUrl: null }, { bio: null }] },
    take: 25,
  });
  const results: { name: string; ok: boolean; error?: string }[] = [];
  for (const p of players) {
    try {
      const s = await fetchWikiSummary(p.wikiTitle);
      if (!s) {
        results.push({ name: p.name, ok: false, error: 'Article not found' });
        continue;
      }
      await prisma.player.update({
        where: { id: p.id },
        data: { photoUrl: s.thumbnail ?? p.photoUrl, bio: s.extract ?? p.bio ?? '' },
      });
      results.push({ name: p.name, ok: true });
    } catch (e) {
      results.push({ name: p.name, ok: false, error: (e as Error).message });
    }
  }
  const remaining = await prisma.player.count({ where: { OR: [{ photoUrl: null }, { bio: null }] } });
  res.json({ results, remaining });
});

// ─── Events ─────────────────────────────────────────────────────────────────

adminRouter.get('/events', async (req, res) => {
  const where: { playerId?: string; date?: { gte?: string; lte?: string } } = {};
  if (typeof req.query.playerId === 'string' && req.query.playerId) where.playerId = req.query.playerId;
  if (typeof req.query.from === 'string' || typeof req.query.to === 'string') {
    where.date = {};
    if (typeof req.query.from === 'string' && req.query.from) where.date.gte = req.query.from;
    if (typeof req.query.to === 'string' && req.query.to) where.date.lte = req.query.to;
  }
  const events = await prisma.playerEvent.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 200,
    include: {
      player: { select: { id: true, name: true, country: true, position: true } },
      createdBy: { select: { displayName: true } },
    },
  });
  res.json({ events });
});

adminRouter.post('/events', async (req, res) => {
  const body = parseBody(eventInputSchema, req.body);
  const user = currentUser(req);
  const count = await prisma.player.count({ where: { id: { in: body.playerIds } } });
  if (count !== body.playerIds.length) throw badRequest('One or more players not found.');
  const created = await prisma.playerEvent.createMany({
    data: body.playerIds.map((playerId) => ({
      playerId,
      type: body.type,
      date: body.date,
      note: body.note,
      sourceUrl: body.sourceUrl,
      createdById: user.id,
    })),
  });
  res.status(201).json({ created: created.count });
});

adminRouter.delete('/events/:id', async (req, res) => {
  await prisma.playerEvent.delete({ where: { id: param(req, 'id') } });
  res.json({ ok: true });
});

// ─── Users ──────────────────────────────────────────────────────────────────

adminRouter.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      _count: { select: { teams: true } },
    },
  });
  res.json({ users: users.map((u) => ({ ...u, isAdmin: isAdminEmail(u.email) })) });
});

adminRouter.post('/users/:id/reset-link', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: param(req, 'id') } });
  if (!user) throw notFound('User not found');
  res.json({ url: await createResetLink(req, user.id) });
});
