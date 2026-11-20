/**
 * Per-league scoring configuration. The commissioner can tune every value.
 *
 * The scoring engine (Phase 3) is pluggable: each category module reads its
 * own section of this config. Adding a category = add a module + a config key.
 */
import { EVENT_TYPE_KEYS, EVENT_TYPES, type EventType } from './events';

export interface MediaShareConfig {
  /** Points per unit. One unit = 10% above the player's own 8-week baseline. */
  pointsPerUnit: number;
  /** Maximum units per week, so one viral spike can't decide a matchup. */
  maxUnits: number;
  /** Number of prior weeks used to compute the baseline. */
  baselineWeeks: number;
  /** Also count pageviews on the player's home-language Wikipedia. */
  includeNativeWiki: boolean;
}

export interface ScoringConfig {
  mediaShare: MediaShareConfig;
  /** Points per occurrence for each event type. */
  events: Record<EventType, number>;
}

export function defaultScoringConfig(): ScoringConfig {
  const events = {} as Record<EventType, number>;
  for (const k of EVENT_TYPE_KEYS) events[k] = EVENT_TYPES[k].defaultPoints;
  return {
    mediaShare: { pointsPerUnit: 1, maxUnits: 30, baselineWeeks: 8, includeNativeWiki: true },
    events,
  };
}

/**
 * Merge a stored (possibly partial / older) config over the defaults, so new
 * event types added in later versions get sensible values automatically.
 */
export function resolveScoringConfig(stored: unknown): ScoringConfig {
  const base = defaultScoringConfig();
  if (!stored || typeof stored !== 'object') return base;
  const s = stored as Partial<ScoringConfig>;
  return {
    mediaShare: { ...base.mediaShare, ...(s.mediaShare ?? {}) },
    events: { ...base.events, ...(s.events ?? {}) },
  };
}
