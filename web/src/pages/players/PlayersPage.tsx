/** Browse the shared player pool. */
import { useQuery } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, qs } from '../../api/client';
import type { PlayerSummary } from '../../api/types';
import { emptyFilters, PlayerFilters } from '../../components/PlayerFilters';
import { Avatar, Country, EmptyState, ErrorText, Loading, PositionBadge, StatusBadge } from '../../components/ui';

export function PlayersPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const deferred = useDeferredValue(filters);
  const q = useQuery({
    queryKey: ['players', deferred],
    queryFn: () => api.get<{ players: PlayerSummary[] }>(`/players${qs({ ...deferred })}`),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-4">
      <h1 className="page-title">Player pool</h1>
      <PlayerFilters value={filters} onChange={setFilters} />
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorText error={q.error} />
      ) : q.data!.players.length === 0 ? (
        <EmptyState>No players match those filters.</EmptyState>
      ) : (
        <>
          <p className="text-xs text-slate-500">{q.data!.players.length} players · sorted by default draft rank</p>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {q.data!.players.map((p) => (
              <li key={p.id}>
                <Link to={`/players/${p.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                  <span className="w-7 text-right text-xs tabular-nums text-slate-400">{p.defaultRank}</span>
                  <Avatar name={p.name} url={p.photoUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{p.name}</span>
                      <PositionBadge position={p.position} />
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      <Country code={p.country} short /> · {p.officeTitle}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
