/** /api/leagues and /api/invites — league CRUD, settings, membership, invites. */
import {
  DEFAULT_LEAGUE_SETTINGS,
  defaultScoringConfig,
  leagueSettingsSchema,
  resolveScoringConfig,
  starterCount,
  type LineupSlots,
} from '@fp/shared';
import type { League } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { createResetLink, publicBaseUrl } from '../auth/resets';
import { currentUser, requireUser } from '../auth/session';
import { generateInviteCode, normalizeInviteCode } from '../lib/codes';
import { badRequest, forbidden, HttpError, notFound, param, parseBody } from '../lib/http';
import {
  assertPreDraft,
  loadLeagueAsCommissioner,
  loadLeagueForUser,
  logActivity,
} from '../lib/leagueAccess';
import { prisma } from '../lib/prisma';

export const leaguesRouter = Router();
export const invitesRouter = Router();

const teamName = z.string().trim().min(2, 'Team name is too short').max(40);

/** The editable settings of a league, in the shape of leagueSettingsSchema. */
export function serializeSettings(league: League) {
  return {
    name: league.name,
    numTeams: league.numTeams,
    lineupSlots: league.lineupSlots as LineupSlots,
    benchSize: league.benchSize,
    regularSeasonWeeks: league.regularSeasonWeeks,
    playoffTeams: league.playoffTeams,
    timezone: league.timezone,
    draftPickSeconds: league.draftPickSeconds,
    draftOrderMode: league.draftOrderMode,
    scoring: resolveScoringConfig(league.scoringConfig),
  };
}

async function uniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateInviteCode();
    if (!(await prisma.league.findUnique({ where: { inviteCode: code } }))) return code;
  }
  throw new Error('Could not generate a unique invite code');
}

// ─── My leagues ─────────────────────────────────────────────────────────────

leaguesRouter.get('/', requireUser, async (req, res) => {
  const user = currentUser(req);
  const teams = await prisma.team.findMany({
    where: { ownerId: user.id },
    include: { league: { include: { _count: { select: { teams: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    leagues: teams.map((t) => ({
      id: t.league.id,
      name: t.league.name,
      status: t.league.status,
      numTeams: t.league.numTeams,
      teamCount: t.league._count.teams,
      draftAt: t.league.draftAt,
      isCommissioner: t.league.commissionerId === user.id,
      myTeam: { id: t.id, name: t.name },
    })),
  });
});

leaguesRouter.post('/', requireUser, async (req, res) => {
  const user = currentUser(req);
  const body = parseBody(
    z.object({
      name: z.string().trim().min(2).max(60),
      teamName,
      timezone: z.string().optional(),
      numTeams: z.number().int().optional(),
    }),
    req.body,
  );
  const settings = leagueSettingsSchema.safeParse({
    ...DEFAULT_LEAGUE_SETTINGS,
    name: body.name,
    timezone: body.timezone ?? DEFAULT_LEAGUE_SETTINGS.timezone,
    numTeams: body.numTeams ?? DEFAULT_LEAGUE_SETTINGS.numTeams,
    scoring: defaultScoringConfig(),
  });
  if (!settings.success) throw badRequest('Invalid league settings');

  const league = await prisma.league.create({
    data: {
      name: body.name,
      commissionerId: user.id,
      inviteCode: await uniqueInviteCode(),
      numTeams: settings.data.numTeams,
      timezone: settings.data.timezone,
      lineupSlots: settings.data.lineupSlots,
      benchSize: settings.data.benchSize,
      regularSeasonWeeks: settings.data.regularSeasonWeeks,
      playoffTeams: settings.data.playoffTeams,
      draftPickSeconds: settings.data.draftPickSeconds,
      draftOrderMode: settings.data.draftOrderMode,
      scoringConfig: settings.data.scoring as object,
      teams: { create: { ownerId: user.id, name: body.teamName } },
    },
  });
  await logActivity(league.id, 'LEAGUE_CREATED', `${user.displayName} created the league.`);
  res.status(201).json({ id: league.id });
});

// ─── A single league ────────────────────────────────────────────────────────

leaguesRouter.get('/:id', requireUser, async (req, res) => {
  const user = currentUser(req);
  const { league, myTeam, isCommissioner } = await loadLeagueForUser(param(req, 'id'), user);
  const teams = await prisma.team.findMany({
    where: { leagueId: league.id },
    include: { owner: { select: { id: true, displayName: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const settings = serializeSettings(league);
  res.json({
    league: {
      id: league.id,
      name: league.name,
      status: league.status,
      season: league.season,
      draftAt: league.draftAt,
      draftState: league.draftState,
      currentWeek: league.currentWeek,
      commissionerId: league.commissionerId,
      // Only the commissioner sees the code/link (anyone in the league could
      // share it, but this keeps it tidy).
      inviteCode: isCommissioner || user.isAdmin ? league.inviteCode : null,
      inviteUrl:
        isCommissioner || user.isAdmin ? `${publicBaseUrl(req)}/join/${league.inviteCode}` : null,
      rosterSize: starterCount(settings.lineupSlots) + settings.benchSize,
      settings,
    },
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      owner: t.owner,
      draftPosition: t.draftPosition,
      isCommissioner: t.ownerId === league.commissionerId,
    })),
    myTeamId: myTeam?.id ?? null,
    isCommissioner,
  });
});

leaguesRouter.put('/:id/settings', requireUser, async (req, res) => {
  const user = currentUser(req);
  const { league } = await loadLeagueAsCommissioner(param(req, 'id'), user);
  assertPreDraft(league, 'edit league settings');
  const s = parseBody(leagueSettingsSchema, req.body);
  const teamCount = await prisma.team.count({ where: { leagueId: league.id } });
  if (s.numTeams < teamCount) {
    throw badRequest(`The league already has ${teamCount} teams; remove some first.`);
  }
  await prisma.league.update({
    where: { id: league.id },
    data: {
      name: s.name,
      numTeams: s.numTeams,
      lineupSlots: s.lineupSlots,
      benchSize: s.benchSize,
      regularSeasonWeeks: s.regularSeasonWeeks,
      playoffTeams: s.playoffTeams,
      timezone: s.timezone,
      draftPickSeconds: s.draftPickSeconds,
      draftOrderMode: s.draftOrderMode,
      scoringConfig: s.scoring as object,
    },
  });
  res.json({ ok: true });
});

/** Schedule (or clear) the draft date/time. Stored in UTC; shown in each user's local time. */
leaguesRouter.put('/:id/draft-time', requireUser, async (req, res) => {
  const user = currentUser(req);
  const { league } = await loadLeagueAsCommissioner(param(req, 'id'), user);
  assertPreDraft(league, 'reschedule the draft');
  const body = parseBody(z.object({ draftAt: z.string().datetime().nullable() }), req.body);
  const draftAt = body.draftAt ? new Date(body.draftAt) : null;
  if (draftAt && draftAt.getTime() < Date.now() - 60_000) {
    throw badRequest('Pick a time in the future.');
  }
  await prisma.league.update({ where: { id: league.id }, data: { draftAt } });
  if (draftAt) {
    await logActivity(league.id, 'DRAFT_SCHEDULED', 'The commissioner scheduled the draft.', {
      draftAt: draftAt.toISOString(),
    });
  }
  res.json({ ok: true });
});

leaguesRouter.post('/:id/invite/regenerate', requireUser, async (req, res) => {
  const { league } = await loadLeagueAsCommissioner(param(req, 'id'), currentUser(req));
  const inviteCode = await uniqueInviteCode();
  await prisma.league.update({ where: { id: league.id }, data: { inviteCode } });
  res.json({ inviteCode });
});

leaguesRouter.delete('/:id', requireUser, async (req, res) => {
  const { league } = await loadLeagueAsCommissioner(param(req, 'id'), currentUser(req));
  assertPreDraft(league, 'delete the league');
  await prisma.league.delete({ where: { id: league.id } });
  res.json({ ok: true });
});

leaguesRouter.get('/:id/activity', requireUser, async (req, res) => {
  const { league } = await loadLeagueForUser(param(req, 'id'), currentUser(req));
  const activity = await prisma.activity.findMany({
    where: { leagueId: league.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ activity });
});

// ─── Teams ──────────────────────────────────────────────────────────────────

/** Rename a team (owner or commissioner). */
leaguesRouter.patch('/:id/teams/:teamId', requireUser, async (req, res) => {
  const user = currentUser(req);
  const { league, isCommissioner } = await loadLeagueForUser(param(req, 'id'), user);
  const team = await prisma.team.findFirst({ where: { id: param(req, 'teamId'), leagueId: league.id } });
  if (!team) throw notFound('Team not found');
  if (team.ownerId !== user.id && !isCommissioner && !user.isAdmin) {
    throw forbidden('You can only rename your own team.');
  }
  const body = parseBody(z.object({ name: teamName }), req.body);
  await prisma.team.update({ where: { id: team.id }, data: { name: body.name } });
  if (body.name !== team.name) {
    await logActivity(league.id, 'TEAM_RENAMED', `${team.name} is now ${body.name}.`);
  }
  res.json({ ok: true });
});

/** Remove a team: the commissioner can kick someone, or a user can leave. Pre-draft only. */
leaguesRouter.delete('/:id/teams/:teamId', requireUser, async (req, res) => {
  const user = currentUser(req);
  const { league, isCommissioner } = await loadLeagueForUser(param(req, 'id'), user);
  assertPreDraft(league, 'remove teams');
  const team = await prisma.team.findFirst({
    where: { id: param(req, 'teamId'), leagueId: league.id },
    include: { owner: true },
  });
  if (!team) throw notFound('Team not found');
  const isSelf = team.ownerId === user.id;
  if (!isSelf && !isCommissioner && !user.isAdmin) throw forbidden();
  if (team.ownerId === league.commissionerId) {
    throw badRequest('The commissioner cannot leave their own league (delete it instead).');
  }
  await prisma.team.delete({ where: { id: team.id } });
  await logActivity(
    league.id,
    'TEAM_LEFT',
    isSelf ? `${team.owner.displayName} left the league.` : `${team.name} was removed from the league.`,
  );
  res.json({ ok: true });
});

/** Commissioner generates a password reset link for a league member. */
leaguesRouter.post('/:id/teams/:teamId/reset-link', requireUser, async (req, res) => {
  const { league } = await loadLeagueAsCommissioner(param(req, 'id'), currentUser(req));
  const team = await prisma.team.findFirst({ where: { id: param(req, 'teamId'), leagueId: league.id } });
  if (!team) throw notFound('Team not found');
  res.json({ url: await createResetLink(req, team.ownerId) });
});

// ─── Invites ────────────────────────────────────────────────────────────────

async function findLeagueByCode(code: string) {
  const league = await prisma.league.findUnique({
    where: { inviteCode: normalizeInviteCode(code) },
    include: {
      commissioner: { select: { displayName: true } },
      _count: { select: { teams: true } },
    },
  });
  if (!league) throw notFound('That invite code is not valid.');
  return league;
}

/** Public preview so the join page can show "You've been invited to …". */
invitesRouter.get('/:code', async (req, res) => {
  const league = await findLeagueByCode(param(req, 'code'));
  const alreadyMember = req.user
    ? !!(await prisma.team.findUnique({
        where: { leagueId_ownerId: { leagueId: league.id, ownerId: req.user.id } },
      }))
    : false;
  res.json({
    league: {
      id: league.id,
      name: league.name,
      commissioner: league.commissioner.displayName,
      teamCount: league._count.teams,
      numTeams: league.numTeams,
      status: league.status,
      open: league.status === 'PRE_DRAFT' && league._count.teams < league.numTeams,
    },
    alreadyMember,
  });
});

invitesRouter.post('/:code/join', requireUser, async (req, res) => {
  const user = currentUser(req);
  const body = parseBody(z.object({ teamName }), req.body);
  const league = await findLeagueByCode(param(req, 'code'));
  const existing = await prisma.team.findUnique({
    where: { leagueId_ownerId: { leagueId: league.id, ownerId: user.id } },
  });
  if (existing) {
    res.json({ leagueId: league.id });
    return;
  }
  if (league.status !== 'PRE_DRAFT') throw new HttpError(409, 'This league has already drafted.');

  // Serializable transaction so two friends joining at once can't overfill the league.
  await prisma.$transaction(
    async (tx) => {
      const count = await tx.team.count({ where: { leagueId: league.id } });
      if (count >= league.numTeams) throw new HttpError(409, 'This league is full.');
      await tx.team.create({ data: { leagueId: league.id, ownerId: user.id, name: body.teamName } });
    },
    { isolationLevel: 'Serializable' },
  );
  await logActivity(league.id, 'JOIN', `${user.displayName} joined as ${body.teamName}.`);
  res.status(201).json({ leagueId: league.id });
});
