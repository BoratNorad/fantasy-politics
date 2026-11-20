/** /api/players — the shared player pool (read-only for regular users). */
import { POSITIONS, PLAYER_STATUSES, type Position, type PlayerStatus } from '@fp/shared';
import type { Prisma } from '@prisma/client';
import { Router } from 'express';
import { requireUser } from '../auth/session';
import { notFound, param } from '../lib/http';
import { prisma } from '../lib/prisma';

export const playersRouter = Router();

/** Build a Prisma filter from ?q=&position=&country=&status= query params. */
export function playerFilter(query: Record<string, unknown>): Prisma.PlayerWhereInput {
  const where: Prisma.PlayerWhereInput = {};
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { officeTitle: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (typeof query.position === 'string' && POSITIONS.includes(query.position as Position)) {
    where.position = query.position as Position;
  }
  if (typeof query.country === 'string' && query.country) where.country = query.country;
  if (typeof query.status === 'string' && PLAYER_STATUSES.includes(query.status as PlayerStatus)) {
    where.status = query.status as PlayerStatus;
  }
  return where;
}

playersRouter.get('/', requireUser, async (req, res) => {
  const where = playerFilter(req.query);
  // Hide departed players from the normal pool unless explicitly requested.
  if (!where.status && req.query.includeLeft !== '1') where.status = { not: 'LEFT_OFFICE' };
  const players = await prisma.player.findMany({
    where,
    orderBy: [{ defaultRank: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      country: true,
      position: true,
      officeTitle: true,
      status: true,
      photoUrl: true,
      defaultRank: true,
    },
  });
  res.json({ players });
});

playersRouter.get('/:id', requireUser, async (req, res) => {
  const player = await prisma.player.findUnique({
    where: { id: param(req, 'id') },
    include: {
      replaces: { select: { id: true, name: true } },
      replacedBy: { select: { id: true, name: true } },
      events: { orderBy: { date: 'desc' }, take: 50 },
    },
  });
  if (!player) throw notFound('Player not found');
  // Admin-only fields stay hidden from regular users.
  const { adminNotes, ...rest } = player;
  res.json({ player: req.user?.isAdmin ? player : { ...rest, adminNotes: undefined } });
});
