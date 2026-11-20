/** Player status tags. Must match the Prisma enum `PlayerStatus`. */
export const PLAYER_STATUSES = [
  'ACTIVE',
  'CAMPAIGNING',
  'CARETAKER',
  'LAME_DUCK',
  'FACING_NO_CONFIDENCE',
  'LEFT_OFFICE',
] as const;

export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

export const STATUS_INFO: Record<PlayerStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'green' },
  CAMPAIGNING: { label: 'Campaigning', color: 'blue' },
  CARETAKER: { label: 'Caretaker', color: 'amber' },
  LAME_DUCK: { label: 'Lame Duck', color: 'slate' },
  FACING_NO_CONFIDENCE: { label: 'Facing No-Confidence', color: 'orange' },
  LEFT_OFFICE: { label: 'Left Office', color: 'red' },
};
