/**
 * League settings: validation schema shared by the settings form and the API.
 */
import { z } from 'zod';
import { DEFAULT_BENCH_SIZE, DEFAULT_LINEUP_SLOTS, SLOT_TYPES, type LineupSlots } from './positions';
import { EVENT_TYPE_KEYS } from './scoring/events';

export const LEAGUE_LIMITS = {
  minTeams: 4,
  maxTeams: 12,
  minPickSeconds: 30,
  maxPickSeconds: 180,
  minSeasonWeeks: 3,
  maxSeasonWeeks: 26,
  maxBench: 10,
  maxPerSlot: 4,
} as const;

export const LEAGUE_STATUSES = [
  'PRE_DRAFT',
  'DRAFTING',
  'IN_SEASON',
  'PLAYOFFS',
  'COMPLETE',
] as const;
export type LeagueStatus = (typeof LEAGUE_STATUSES)[number];

export const LEAGUE_STATUS_LABELS: Record<LeagueStatus, string> = {
  PRE_DRAFT: 'Pre-draft',
  DRAFTING: 'Drafting',
  IN_SEASON: 'Regular season',
  PLAYOFFS: 'Playoffs',
  COMPLETE: 'Season complete',
};

const lineupSlotsSchema = z.object(
  Object.fromEntries(
    SLOT_TYPES.map((s) => [s, z.number().int().min(0).max(LEAGUE_LIMITS.maxPerSlot)]),
  ) as Record<(typeof SLOT_TYPES)[number], z.ZodNumber>,
);

/** Is `tz` a valid IANA time zone in this JS runtime? */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const leagueSettingsSchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    numTeams: z.number().int().min(LEAGUE_LIMITS.minTeams).max(LEAGUE_LIMITS.maxTeams),
    lineupSlots: lineupSlotsSchema,
    benchSize: z.number().int().min(0).max(LEAGUE_LIMITS.maxBench),
    regularSeasonWeeks: z
      .number()
      .int()
      .min(LEAGUE_LIMITS.minSeasonWeeks)
      .max(LEAGUE_LIMITS.maxSeasonWeeks),
    playoffTeams: z.number().int().min(2).max(LEAGUE_LIMITS.maxTeams),
    timezone: z.string().refine(isValidTimeZone, 'Unknown time zone'),
    draftPickSeconds: z
      .number()
      .int()
      .min(LEAGUE_LIMITS.minPickSeconds)
      .max(LEAGUE_LIMITS.maxPickSeconds),
    draftOrderMode: z.enum(['RANDOM', 'MANUAL']),
    scoring: z.object({
      mediaShare: z.object({
        pointsPerUnit: z.number().min(0).max(100),
        maxUnits: z.number().min(0).max(1000),
        baselineWeeks: z.number().int().min(2).max(26),
        includeNativeWiki: z.boolean(),
      }),
      events: z.object(
        Object.fromEntries(EVENT_TYPE_KEYS.map((k) => [k, z.number().min(-200).max(200)])) as Record<
          (typeof EVENT_TYPE_KEYS)[number],
          z.ZodNumber
        >,
      ),
    }),
  })
  .refine((s) => s.playoffTeams <= s.numTeams, {
    message: 'Playoff teams cannot exceed number of teams',
    path: ['playoffTeams'],
  })
  .refine((s) => Object.values(s.lineupSlots).reduce((a, b) => a + b, 0) >= 1, {
    message: 'Lineup needs at least one starter',
    path: ['lineupSlots'],
  });

export type LeagueSettingsInput = z.infer<typeof leagueSettingsSchema>;

export const DEFAULT_LEAGUE_SETTINGS = {
  numTeams: 8,
  lineupSlots: DEFAULT_LINEUP_SLOTS as LineupSlots,
  benchSize: DEFAULT_BENCH_SIZE,
  regularSeasonWeeks: 10,
  playoffTeams: 4,
  timezone: 'America/New_York',
  draftPickSeconds: 90,
  draftOrderMode: 'RANDOM' as const,
};
