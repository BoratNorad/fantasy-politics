/** React Query hooks for common data. */
import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { ActivityItem, LeagueDetail, LeagueSummary } from './types';

export const useMyLeagues = () =>
  useQuery({
    queryKey: ['leagues'],
    queryFn: () => api.get<{ leagues: LeagueSummary[] }>('/leagues'),
  });

export const useLeague = (id: string) =>
  useQuery({
    queryKey: ['league', id],
    queryFn: () => api.get<LeagueDetail>(`/leagues/${id}`),
  });

export const useActivity = (id: string) =>
  useQuery({
    queryKey: ['league', id, 'activity'],
    queryFn: () => api.get<{ activity: ActivityItem[] }>(`/leagues/${id}/activity`),
    refetchInterval: 30_000,
  });

/** All IANA time zones the browser knows, with the user's own first. */
export function timeZoneOptions(): string[] {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let all: string[] = [];
  try {
    all = (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf('timeZone');
  } catch {
    all = ['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London'];
  }
  return [local, ...all.filter((z) => z !== local)];
}
