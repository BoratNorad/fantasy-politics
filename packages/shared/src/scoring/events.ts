/**
 * Admin-logged event types, grouped into scoring categories.
 *
 * DESIGN RULES (do not break these when adding event types):
 *  - Score activity and measurable outcomes only — never ideology or whether a
 *    policy is "good" or "bad". Leaders across the spectrum must be equally draftable.
 *  - Never award points for military action, crackdowns, or casualties.
 *
 * Event keys are stored as strings in the database, so renaming one requires a
 * data migration.
 */

export const EVENT_CATEGORIES = ['DIPLOMACY', 'OUTPUT', 'SURVIVAL', 'ELECTIONS'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export interface EventTypeInfo {
  category: EventCategory;
  label: string;
  /** Default points awarded per occurrence. Leagues can override. */
  defaultPoints: number;
  /** If true, this is computed automatically and cannot be logged by hand. */
  automatic?: boolean;
}

export const EVENT_TYPES = {
  // Diplomacy
  FOREIGN_TRIP: { category: 'DIPLOMACY', label: 'Foreign trip', defaultPoints: 3 },
  BILATERAL_MEETING: { category: 'DIPLOMACY', label: 'Bilateral meeting', defaultPoints: 2 },
  SUMMIT_ATTENDED: { category: 'DIPLOMACY', label: 'Summit attended', defaultPoints: 4 },
  SUMMIT_HOSTED: { category: 'DIPLOMACY', label: 'Summit hosted', defaultPoints: 8 },
  AGREEMENT_SIGNED: { category: 'DIPLOMACY', label: 'Agreement signed', defaultPoints: 5 },
  // Output
  BILL_SIGNED: { category: 'OUTPUT', label: 'Bill / budget signed', defaultPoints: 4 },
  EXECUTIVE_ORDER: { category: 'OUTPUT', label: 'Executive order', defaultPoints: 2 },
  VETO: { category: 'OUTPUT', label: 'Veto', defaultPoints: 2 },
  // Survival
  IN_OFFICE_WEEK: {
    category: 'SURVIVAL',
    label: 'In office this week',
    defaultPoints: 2,
    automatic: true,
  },
  WON_CONFIDENCE_VOTE: { category: 'SURVIVAL', label: 'Won confidence vote', defaultPoints: 10 },
  LEFT_OFFICE: { category: 'SURVIVAL', label: 'Left office', defaultPoints: -15 },
  // Elections
  WON_ELECTION: { category: 'ELECTIONS', label: 'Won election', defaultPoints: 25 },
  LOST_ELECTION: { category: 'ELECTIONS', label: 'Lost election', defaultPoints: -15 },
} as const satisfies Record<string, EventTypeInfo>;

export type EventType = keyof typeof EVENT_TYPES;
export const EVENT_TYPE_KEYS = Object.keys(EVENT_TYPES) as EventType[];

/** Event types an admin can log by hand (excludes automatic ones). */
export const LOGGABLE_EVENT_TYPES = EVENT_TYPE_KEYS.filter(
  (k) => !(EVENT_TYPES[k] as EventTypeInfo).automatic,
);

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  DIPLOMACY: 'Diplomacy',
  OUTPUT: 'Output',
  SURVIVAL: 'Survival',
  ELECTIONS: 'Elections',
};
