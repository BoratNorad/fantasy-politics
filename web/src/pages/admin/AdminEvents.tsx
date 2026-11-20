/**
 * Admin event log: record Diplomacy / Output / Survival / Elections events.
 * You can tag several players at once (e.g. everyone who attended a summit).
 */
import {
  CATEGORY_LABELS,
  EVENT_CATEGORIES,
  EVENT_TYPES,
  LOGGABLE_EVENT_TYPES,
  countryFlag,
  type EventType,
} from '@fp/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDeferredValue, useState, type FormEvent } from 'react';
import { api, qs } from '../../api/client';
import type { PlayerSummary } from '../../api/types';
import { ErrorText, Loading, PositionBadge } from '../../components/ui';

interface EventRow {
  id: string;
  type: string;
  date: string;
  note: string | null;
  sourceUrl: string | null;
  player: { id: string; name: string; country: string };
  createdBy: { displayName: string } | null;
}

export function AdminEvents() {
  const qc = useQueryClient();
  const events = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => api.get<{ events: EventRow[] }>('/admin/events'),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.del(`/admin/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'events'] }),
  });

  return (
    <div className="space-y-5">
      <LogEventForm />
      <div className="card">
        <h2 className="mb-2 font-semibold">Recent events</h2>
        {events.isLoading ? (
          <Loading />
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {events.data?.events.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div>
                    <span aria-hidden>{countryFlag(e.player.country)}</span>{' '}
                    <span className="font-medium">{e.player.name}</span> —{' '}
                    {EVENT_TYPES[e.type as EventType]?.label ?? e.type}
                  </div>
                  <div className="text-xs text-slate-500">
                    {e.date}
                    {e.note && ` · ${e.note}`}
                    {e.createdBy && ` · by ${e.createdBy.displayName}`}
                    {e.sourceUrl && (
                      <> · <a className="underline" href={e.sourceUrl} target="_blank" rel="noreferrer">source</a></>
                    )}
                  </div>
                </div>
                <button className="text-xs text-red-600"
                  onClick={() => confirm('Delete this event?') && del.mutate(e.id)}>
                  Delete
                </button>
              </li>
            ))}
            {events.data?.events.length === 0 && <li className="py-2 text-slate-500">No events logged yet.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

function LogEventForm() {
  const qc = useQueryClient();
  const [type, setType] = useState<string>(LOGGABLE_EVENT_TYPES[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selected, setSelected] = useState<PlayerSummary[]>([]);
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search);
  const results = useQuery({
    queryKey: ['players', 'search', deferred],
    queryFn: () => api.get<{ players: PlayerSummary[] }>(`/players${qs({ q: deferred })}`),
    enabled: deferred.trim().length >= 2,
  });
  const log = useMutation({
    mutationFn: () =>
      api.post<{ created: number }>('/admin/events', {
        playerIds: selected.map((p) => p.id),
        type,
        date,
        note,
        sourceUrl,
      }),
    onSuccess: () => {
      setSelected([]);
      setNote('');
      setSourceUrl('');
      qc.invalidateQueries({ queryKey: ['admin', 'events'] });
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    log.mutate();
  };
  const pts = EVENT_TYPES[type as EventType]?.defaultPoints;

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="font-semibold">Log an event</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Event</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {EVENT_CATEGORIES.map((cat) => (
              <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                {LOGGABLE_EVENT_TYPES.filter((k) => EVENT_TYPES[k].category === cat).map((k) => (
                  <option key={k} value={k}>{EVENT_TYPES[k].label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">Default {pts > 0 ? '+' : ''}{pts} pts (leagues can tune this).</p>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Players</label>
        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selected.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs">
                {countryFlag(p.country)} {p.name}
                <button type="button" onClick={() => setSelected(selected.filter((s) => s.id !== p.id))}
                  aria-label={`Remove ${p.name}`}>×</button>
              </span>
            ))}
          </div>
        )}
        <input className="input" placeholder="Search players to add…" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        {deferred.trim().length >= 2 && results.data && (
          <ul className="mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200">
            {results.data.players
              .filter((p) => !selected.some((s) => s.id === p.id))
              .slice(0, 15)
              .map((p) => (
                <li key={p.id}>
                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => { setSelected([...selected, p]); setSearch(''); }}>
                    {countryFlag(p.country)} {p.name} <PositionBadge position={p.position} />
                    <span className="truncate text-xs text-slate-500">{p.officeTitle}</span>
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Note (optional)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="G7 summit, Ottawa" />
        </div>
        <div>
          <label className="label">Source URL (optional)</label>
          <input className="input" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
        </div>
      </div>
      <ErrorText error={log.error} />
      {log.data && <p className="text-sm text-green-700">Logged for {log.data.created} player(s) ✓</p>}
      <button className="btn-primary" disabled={selected.length === 0 || log.isPending}>
        Log event{selected.length > 1 ? ` for ${selected.length} players` : ''}
      </button>
      <p className="text-xs text-slate-500">
        Only log activity and outcomes. Never log military action, crackdowns, or casualties.
      </p>
    </form>
  );
}
