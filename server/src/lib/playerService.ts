/** Business logic for player-pool changes that ripple into leagues. */
import type { PlayerInput } from '@fp/shared';
import { prisma } from './prisma';

export interface LeftOfficeOptions {
  /** Also log a LEFT_OFFICE scoring event (the Survival penalty) dated `date`. */
  logPenalty: boolean;
  date: string;
  createdById?: string;
  /** Optionally create their replacement in the same call. */
  replacement?: Pick<PlayerInput, 'name' | 'officeTitle' | 'wikiTitle'> &
    Partial<Pick<PlayerInput, 'status' | 'photoUrl'>>;
}

/**
 * Mark a player as having left office:
 *  1. Set status LEFT_OFFICE.
 *  2. Remove them from every league roster and draft queue (lineups already
 *     locked for the current week keep them, so that week's scoring is fair).
 *  3. Optionally log the Left Office penalty event.
 *  4. Optionally create the replacement player, who joins the free-agent pool
 *     (and, from Phase 5, goes on waivers).
 *  5. Post to each affected league's activity feed.
 */
export async function markLeftOffice(playerId: string, opts: LeftOfficeOptions) {
  return prisma.$transaction(async (tx) => {
    const player = await tx.player.update({
      where: { id: playerId },
      data: { status: 'LEFT_OFFICE', leftOfficeAt: new Date() },
    });

    const spots = await tx.rosterSpot.findMany({
      where: { playerId },
      include: { team: { select: { name: true } } },
    });
    await tx.rosterSpot.deleteMany({ where: { playerId } });
    await tx.draftQueueItem.deleteMany({ where: { playerId } });

    if (opts.logPenalty) {
      await tx.playerEvent.create({
        data: { playerId, type: 'LEFT_OFFICE', date: opts.date, createdById: opts.createdById },
      });
    }

    let replacement = null;
    if (opts.replacement) {
      replacement = await tx.player.create({
        data: {
          name: opts.replacement.name,
          officeTitle: opts.replacement.officeTitle,
          wikiTitle: opts.replacement.wikiTitle,
          status: opts.replacement.status ?? 'ACTIVE',
          photoUrl: opts.replacement.photoUrl ?? null,
          country: player.country,
          position: player.position,
          defaultRank: player.defaultRank,
          replacesId: player.id,
        },
      });
    }

    // Activity feed: leagues where they were rostered get a specific message.
    for (const spot of spots) {
      await tx.activity.create({
        data: {
          leagueId: spot.leagueId,
          type: 'PLAYER_LEFT_OFFICE',
          message:
            `${player.name} left office and was removed from ${spot.team.name}.` +
            (replacement ? ` ${replacement.name} is now available.` : ''),
          data: { playerId, replacementId: replacement?.id ?? null },
        },
      });
    }
    return { player, replacement, removedFromTeams: spots.length };
  });
}
