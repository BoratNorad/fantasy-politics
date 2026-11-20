/** Validation for admin-edited player records and logged events. */
import { z } from 'zod';
import { COUNTRIES } from './countries';
import { POSITIONS } from './positions';
import { PLAYER_STATUSES } from './status';
import { LOGGABLE_EVENT_TYPES } from './scoring/events';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const playerInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  country: z.string().refine((c) => c in COUNTRIES, 'Unknown country'),
  position: z.enum(POSITIONS),
  officeTitle: z.string().trim().min(1).max(150),
  status: z.enum(PLAYER_STATUSES),
  wikiTitle: z.string().trim().min(1).max(200),
  nativeWikiLang: optionalText(10),
  nativeWikiTitle: optionalText(200),
  photoUrl: optionalText(500),
  bio: optionalText(2000),
  defaultRank: z.number().int().min(1).max(9999),
  needsVerification: z.boolean(),
  adminNotes: optionalText(1000),
});
export type PlayerInput = z.infer<typeof playerInputSchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const eventInputSchema = z.object({
  /** Log the same event for several players at once (e.g. everyone at a summit). */
  playerIds: z.array(z.string()).min(1).max(50),
  type: z.enum(LOGGABLE_EVENT_TYPES as [string, ...string[]]),
  date: isoDate,
  note: optionalText(500),
  sourceUrl: optionalText(500),
});
export type EventInput = z.infer<typeof eventInputSchema>;
