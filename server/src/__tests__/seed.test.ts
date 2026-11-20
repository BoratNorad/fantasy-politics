import { COUNTRIES, POSITIONS } from '@fp/shared';
import { describe, expect, it } from 'vitest';
import { SEED_PLAYERS } from '../../prisma/seed/players';

describe('player seed data', () => {
  it('only uses known countries and positions', () => {
    for (const [country, position, name] of SEED_PLAYERS) {
      expect(COUNTRIES[country], `${name}: country ${country}`).toBeDefined();
      expect(POSITIONS, `${name}: position`).toContain(position);
    }
  });

  it('covers all 32 countries', () => {
    expect(new Set(SEED_PLAYERS.map((r) => r[0])).size).toBe(Object.keys(COUNTRIES).length);
  });

  it('has no duplicate people', () => {
    const names = SEED_PLAYERS.map((r) => r[2]);
    expect(names.length).toBe(new Set(names).size);
  });

  it('has enough depth for a 12-team league at every position', () => {
    for (const pos of POSITIONS) {
      const n = SEED_PLAYERS.filter((r) => r[1] === pos).length;
      expect(n, pos).toBeGreaterThanOrEqual(12);
    }
  });
});
