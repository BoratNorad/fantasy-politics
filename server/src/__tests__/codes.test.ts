import { describe, expect, it } from 'vitest';
import { generateInviteCode, normalizeInviteCode } from '../lib/codes';

describe('invite codes', () => {
  it('look like XXXX-XXXX without ambiguous characters', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateInviteCode()).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
    }
  });

  it('normalizes what people type on their phones', () => {
    expect(normalizeInviteCode(' k7qm 2xrp ')).toBe('K7QM-2XRP');
    expect(normalizeInviteCode('k7qm-2xrp')).toBe('K7QM-2XRP');
  });
});
