/** Player detail: bio, status, logged events. Weekly point history chart arrives in Phase 3. */
import { EVENT_TYPES, POSITION_INFO, type EventType } from '@fp/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { PlayerDetail } from '../../api/types';
import { useAuth } from '../../auth';
import { Avatar, Country, EmptyState, ErrorText, Loading, PositionBadge, StatusBadge } from '../../components/ui';

export function PlayerPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ['player', id],
    queryFn: () => api.get<{ player: PlayerDetail }>(`/players/${id}`),
  });
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorText error={q.error} />;
  const p = q.data!.player;

  return (
    <div className="space-y-5">
      <Link to="/players" className="text-sm text-indigo-600">← Player pool</Link>
      <div className="card flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Avatar name={p.name} url={p.photoUrl} size={96} />
        <div className="flex-1 space-y-1">
          <h1 className="page-title">{p.name}</h1>
          <p className="text-slate-600">{p.officeTitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:justify-start">
            <Country code={p.country} />
            <PositionBadge position={p.position} />
            <span className="text-slate-500">{POSITION_INFO[p.position].label}</span>
            <StatusBadge status={p.status} />
          </div>
          {p.replaces && (
            <p className="text-xs text-slate-500">
              Replaced <Link className="underline" to={`/players/${p.replaces.id}`}>{p.replaces.name}</Link>
            </p>
          )}
          {p.replacedBy && (
            <p className="text-xs text-slate-500">
              Succeeded by <Link className="underline" to={`/players/${p.replacedBy.id}`}>{p.replacedBy.name}</Link>
            </p>
          )}
        </div>
        {user?.isAdmin && (
          <Link to={`/admin/players?edit=${p.id}`} className="btn-secondary btn-sm">Edit</Link>
        )}
      </div>

      {p.needsVerification && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ⚠️ This player's details haven't been verified by an admin yet and may be out of date.
        </p>
      )}

      <div className="card">
        <h2 className="mb-2 font-semibold">Bio</h2>
        <p className="text-sm leading-relaxed text-slate-700">{p.bio || 'No bio yet.'}</p>
        <a className="mt-2 inline-block text-xs text-indigo-600"
          href={`https://en.wikipedia.org/wiki/${encodeURIComponent(p.wikiTitle.replace(/ /g, '_'))}`}
          target="_blank" rel="noreferrer">
          Wikipedia: {p.wikiTitle} ↗
        </a>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold">Weekly points</h2>
        <EmptyState>Point history appears once the season starts (Phase 3).</EmptyState>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold">Logged events</h2>
        {p.events.length === 0 ? (
          <p className="text-sm text-slate-500">No events logged yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {p.events.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 py-2">
                <div>
                  <div className="font-medium">{EVENT_TYPES[e.type as EventType]?.label ?? e.type}</div>
                  {e.note && <div className="text-xs text-slate-500">{e.note}</div>}
                </div>
                <span className="shrink-0 text-xs text-slate-500">{e.date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
