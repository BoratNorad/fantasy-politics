/**
 * Player positions and lineup slot definitions.
 *
 * Position keys are stored in the database (Prisma enum `Position`) so they must
 * stay in sync with server/prisma/schema.prisma.
 */

export const POSITIONS = [
  'HEAD_OF_STATE',
  'FINANCE',
  'FOREIGN',
  'GOVERNOR',
  'MAYOR',
  'LEGISLATIVE',
  'OPPOSITION',
] as const;

export type Position = (typeof POSITIONS)[number];

export const POSITION_INFO: Record<Position, { label: string; short: string }> = {
  HEAD_OF_STATE: { label: 'Head of State/Government', short: 'HOS' },
  FINANCE: { label: 'Finance Minister / Central Bank Governor', short: 'FIN' },
  FOREIGN: { label: 'Foreign Minister', short: 'FOR' },
  GOVERNOR: { label: 'Governor / Premier', short: 'GOV' },
  MAYOR: { label: 'Mayor', short: 'MAY' },
  LEGISLATIVE: { label: 'Legislative Leader', short: 'LEG' },
  OPPOSITION: { label: 'Opposition Leader', short: 'OPP' },
};

/** A starting lineup slot is either a specific position or FLEX (any position). */
export type SlotType = Position | 'FLEX';
export const SLOT_TYPES: readonly SlotType[] = [...POSITIONS, 'FLEX'];

export const SLOT_INFO: Record<SlotType, { label: string; short: string }> = {
  ...POSITION_INFO,
  FLEX: { label: 'Flex (any position)', short: 'FLEX' },
};

/** Number of starters required in each slot type. */
export type LineupSlots = Record<SlotType, number>;

export const DEFAULT_LINEUP_SLOTS: LineupSlots = {
  HEAD_OF_STATE: 2,
  FINANCE: 1,
  FOREIGN: 1,
  GOVERNOR: 1,
  MAYOR: 1,
  LEGISLATIVE: 1,
  OPPOSITION: 1,
  FLEX: 1,
};

export const DEFAULT_BENCH_SIZE = 4;

/** Total number of starters for a given lineup configuration. */
export function starterCount(slots: LineupSlots): number {
  return SLOT_TYPES.reduce((sum, s) => sum + (slots[s] ?? 0), 0);
}

/** Can a player of `position` be placed into a slot of type `slot`? */
export function isEligible(position: Position, slot: SlotType): boolean {
  return slot === 'FLEX' || slot === position;
}
