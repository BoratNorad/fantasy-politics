import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LEAGUE_SETTINGS,
  defaultScoringConfig,
  isEligible,
  leagueSettingsSchema,
  resolveScoringConfig,
  starterCount,
  DEFAULT_LINEUP_SLOTS,
} from '..';

const valid = () => ({ ...DEFAULT_LEAGUE_SETTINGS, name: 'Test League', scoring: defaultScoringConfig() });

describe('league settings validation', () => {
  it('accepts the defaults', () => {
    expect(leagueSettingsSchema.safeParse(valid()).success).toBe(true);
  });

  it('enforces 4–12 teams', () => {
    expect(leagueSettingsSchema.safeParse({ ...valid(), numTeams: 3 }).success).toBe(false);
    expect(leagueSettingsSchema.safeParse({ ...valid(), numTeams: 13 }).success).toBe(false);
    expect(leagueSettingsSchema.safeParse({ ...valid(), numTeams: 12 }).success).toBe(true);
  });

  it('enforces a 30s–3min pick timer', () => {
    expect(leagueSettingsSchema.safeParse({ ...valid(), draftPickSeconds: 29 }).success).toBe(false);
    expect(leagueSettingsSchema.safeParse({ ...valid(), draftPickSeconds: 181 }).success).toBe(false);
  });

  it('rejects more playoff teams than teams', () => {
    const r = leagueSettingsSchema.safeParse({ ...valid(), numTeams: 4, playoffTeams: 6 });
    expect(r.success).toBe(false);
  });

  it('rejects unknown time zones', () => {
    expect(leagueSettingsSchema.safeParse({ ...valid(), timezone: 'Mars/Olympus' }).success).toBe(false);
    expect(leagueSettingsSchema.safeParse({ ...valid(), timezone: 'Asia/Tokyo' }).success).toBe(true);
  });

  it('rejects an empty lineup', () => {
    const empty = Object.fromEntries(Object.keys(DEFAULT_LINEUP_SLOTS).map((k) => [k, 0]));
    expect(leagueSettingsSchema.safeParse({ ...valid(), lineupSlots: empty }).success).toBe(false);
  });
});

describe('lineup helpers', () => {
  it('default lineup has 9 starters (2 HOS + 6 singles + FLEX)', () => {
    expect(starterCount(DEFAULT_LINEUP_SLOTS)).toBe(9);
  });

  it('FLEX accepts any position; other slots only their own', () => {
    expect(isEligible('MAYOR', 'FLEX')).toBe(true);
    expect(isEligible('MAYOR', 'MAYOR')).toBe(true);
    expect(isEligible('MAYOR', 'HEAD_OF_STATE')).toBe(false);
  });
});

describe('scoring config', () => {
  it('fills missing keys from defaults (forward compatible)', () => {
    const cfg = resolveScoringConfig({ mediaShare: { pointsPerUnit: 2 }, events: { VETO: 9 } });
    expect(cfg.mediaShare.pointsPerUnit).toBe(2);
    expect(cfg.mediaShare.maxUnits).toBe(30);
    expect(cfg.events.VETO).toBe(9);
    expect(cfg.events.SUMMIT_HOSTED).toBe(8);
  });

  it('never rewards anything with a military/crackdown flavour', () => {
    const keys = Object.keys(defaultScoringConfig().events).join(' ');
    expect(keys).not.toMatch(/MILITARY|STRIKE|WAR|CRACKDOWN|CASUALT/);
  });
});
