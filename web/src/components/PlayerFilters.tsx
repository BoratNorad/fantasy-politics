/** Search + position + country filter bar, reused by the player pool and the admin panel. */
import { COUNTRIES, POSITIONS, POSITION_INFO } from '@fp/shared';
import type { ReactNode } from 'react';

export interface PlayerFilterState {
  q: string;
  position: string;
  country: string;
}

export const emptyFilters: PlayerFilterState = { q: '', position: '', country: '' };

export function PlayerFilters({
  value,
  onChange,
  children,
}: {
  value: PlayerFilterState;
  onChange: (v: PlayerFilterState) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <input className="input sm:max-w-xs" placeholder="Search name or office…" value={value.q}
        onChange={(e) => onChange({ ...value, q: e.target.value })} />
      <select className="input sm:w-auto" value={value.position}
        onChange={(e) => onChange({ ...value, position: e.target.value })}>
        <option value="">All positions</option>
        {POSITIONS.map((p) => <option key={p} value={p}>{POSITION_INFO[p].label}</option>)}
      </select>
      <select className="input sm:w-auto" value={value.country}
        onChange={(e) => onChange({ ...value, country: e.target.value })}>
        <option value="">All countries</option>
        {Object.entries(COUNTRIES)
          .sort((a, b) => a[1].name.localeCompare(b[1].name))
          .map(([code, c]) => <option key={code} value={code}>{c.flag} {c.name}</option>)}
      </select>
      {children}
    </div>
  );
}
