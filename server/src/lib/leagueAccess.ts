/** Helpers for loading a league and checking the caller's role in it. */
import type { League, Team } from '@prisma/client';
import { forbidden, HttpError, notFound } from './http';
import { prisma } from './prisma';
import type { SessionUser } from '../auth/session';

export interface LeagueContext {
  league: League;
  myTeam: Team | null;
  isCommissioner: boolean;
}

/**
 * Load a league the user belongs to. Site admins can view any league.
 * Throws 404 if the league doesn't exist or the user isn't in it.
 */
export async function loadLeagueForUser(leagueId: string, user: SessionUser): Promise<LeagueContext> {
  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (!league) throw notFound('League not found');
  const myTeam = await prisma.team.findUnique({
    where: { leagueId_ownerId: { leagueId, ownerId: user.id } },
  });
  if (!myTeam && !user.isAdmin) throw notFound('League not found');
  return { league, myTeam, isCommissioner: league.commissionerId === user.id };
}

export async function loadLeagueAsCommissioner(leagueId: string, user: SessionUser) {
  const ctx = await loadLeagueForUser(leagueId, user);
  if (!ctx.isCommissioner && !user.isAdmin) throw forbidden('Only the commissioner can do that.');
  return ctx;
}

export function assertPreDraft(league: League, action = 'change this') {
  if (league.status !== 'PRE_DRAFT' || league.draftState !== 'NOT_STARTED') {
    throw new HttpError(409, `You can only ${action} before the draft starts.`);
  }
}

/** Record an entry in the league activity feed. */
export function logActivity(leagueId: string, type: string, message: string, data?: object) {
  return prisma.activity.create({ data: { leagueId, type, message, data } });
}
