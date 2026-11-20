/** Admin: add / edit / remove players, change status, handle departures + replacements. */
import {
  COUNTRIES,
  PLAYER_STATUSES,
  POSITIONS,
  POSITION_INFO,
  STATUS_INFO,
  type PlayerInput,
} from '@fp/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDeferredValue, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, qs } from '../../api/client';
import type { AdminPlayer } from '../../api/types';
import { emptyFilters, PlayerFilters } from '../../components/PlayerFilters';
import { Avatar, Country, ErrorText, Loading, PositionBadge, StatusBadge } from '../../components/ui';
import { Modal } from './Modal';

type ListResponse = { players: AdminPlayer[]; unverified: number };

export function AdminPlayers() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(emptyFilters);
  const [status, setStatus] = useState('');
  const [onlyUnverified, setOnlyUnverified] = useState(false);
  const deferred = useDeferredValue({ ...filters, status, needsVerification: onlyUnverified ? '1' : '' });
  const list = useQuery({
    queryKey: ['admin', 'players', deferred],
    queryFn: () => api.get<ListResponse>(`/admin/players${qs(deferred)}`),
    placeholderData: (prev) => prev,
  });
  const [creating, setCreating] = useState(false);
  const [leaving, setLeaving] = useState<AdminPlayer | null>(null);
  const editId = params.get('edit');
  const editing = list.data?.players.find((p) => p.id === editId);
  const closeEdit = () => setParams({});
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'players'] });

  const batchWiki = useMutation({
    mutationFn: () =>
      api.post<{ results: { name: string; ok: boolean; error?: string }[]; remaining: number }>(
        '/admin/players/wiki-refresh-missing',
      ),
    onSuccess: refresh,
  });

  return (
    <div className="space-y-4">
      {list.data && list.data.unverified > 0 && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠️ <strong>{list.data.unverified}</strong> players still need verification. The seed list was
          generated from AI training data plus a web check and may be out of date. Open each one, confirm the
          details, and untick “Needs verification”.
          <button className="ml-2 underline" onClick={() => setOnlyUnverified(true)}>Show them</button>
        </div>
      )}

      <PlayerFilters value={filters} onChange={setFilters}>
        <select className="input sm:w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          {PLAYER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_INFO[s].label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyUnverified} onChange={(e) => setOnlyUnverified(e.target.checked)} />
          Needs verification
        </label>
      </PlayerFilters>

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => setCreating(true)}>+ Add player</button>
        <button className="btn-secondary" disabled={batchWiki.isPending} onClick={() => batchWiki.mutate()}>
          {batchWiki.isPending ? 'Fetching…' : 'Fetch missing photos/bios from Wikipedia'}
        </button>
      </div>
      {batchWiki.data && (
        <p className="text-xs text-slate-600">
          Updated {batchWiki.data.results.filter((r) => r.ok).length}, failed{' '}
          {batchWiki.data.results.filter((r) => !r.ok).map((r) => r.name).join(', ') || 'none'}.{' '}
          {batchWiki.data.remaining} still missing — click again to continue.
        </p>
      )}
      <ErrorText error={batchWiki.error} />

      {list.isLoading ? (
        <Loading />
      ) : list.error ? (
        <ErrorText error={list.error} />
      ) : (
        <>
          <p className="text-xs text-slate-500">{list.data!.players.length} players</p>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {list.data!.players.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <Avatar name={p.name} url={p.photoUrl} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    <PositionBadge position={p.position} />
                    <StatusBadge status={p.status} />
                    {p.needsVerification && <span title="Needs verification">⚠️</span>}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    <Country code={p.country} short /> · {p.officeTitle} · rank {p.defaultRank}
                    {p._count.rosterSpots > 0 && ` · on ${p._count.rosterSpots} roster(s)`}
                    {p.replacedBy && ` · replaced by ${p.replacedBy.name}`}
                  </div>
                  {p.adminNotes && <div className="truncate text-xs text-amber-700">📝 {p.adminNotes}</div>}
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  <button className="btn-secondary btn-sm" onClick={() => setParams({ edit: p.id })}>Edit</button>
                  {p.status !== 'LEFT_OFFICE' && (
                    <button className="btn-secondary btn-sm" onClick={() => setLeaving(p)}>Left office</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {creating && <PlayerFormModal onClose={() => setCreating(false)} onSaved={refresh} />}
      {editing && <PlayerFormModal player={editing} onClose={closeEdit} onSaved={refresh} />}
      {leaving && <LeftOfficeModal player={leaving} onClose={() => setLeaving(null)} onSaved={refresh} />}
    </div>
  );
}

const blank: PlayerInput = {
  name: '',
  country: 'US',
  position: 'HEAD_OF_STATE',
  officeTitle: '',
  status: 'ACTIVE',
  wikiTitle: '',
  nativeWikiLang: null,
  nativeWikiTitle: null,
  photoUrl: null,
  bio: null,
  defaultRank: 500,
  needsVerification: false,
  adminNotes: null,
};

function PlayerFormModal({
  player,
  onClose,
  onSaved,
}: {
  player?: AdminPlayer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<PlayerInput>(
    player
      ? {
          name: player.name,
          country: player.country,
          position: player.position,
          officeTitle: player.officeTitle,
          status: player.status,
          wikiTitle: player.wikiTitle,
          nativeWikiLang: player.nativeWikiLang,
          nativeWikiTitle: player.nativeWikiTitle,
          photoUrl: player.photoUrl,
          bio: player.bio,
          defaultRank: player.defaultRank,
          needsVerification: player.needsVerification,
          adminNotes: player.adminNotes,
        }
      : blank,
  );
  const save = useMutation({
    mutationFn: (body: PlayerInput) =>
      player ? api.put(`/admin/players/${player.id}`, body) : api.post('/admin/players', body),
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });
  const wiki = useMutation({
    mutationFn: () =>
      api.post<{ player: AdminPlayer; resolvedTitle: string }>(`/admin/players/${player!.id}/wiki-refresh`),
    onSuccess: ({ player: p }) => {
      setF((cur) => ({ ...cur, photoUrl: p.photoUrl, bio: p.bio }));
      onSaved();
    },
  });
  const del = useMutation({
    mutationFn: () => api.del(`/admin/players/${player!.id}`),
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });
  const set = <K extends keyof PlayerInput>(k: K, v: PlayerInput[K]) => setF({ ...f, [k]: v });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(f);
  };

  return (
    <Modal title={player ? `Edit ${player.name}` : 'Add player'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Name</label>
          <input className="input" required value={f.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Country</label>
            <select className="input" value={f.country} onChange={(e) => set('country', e.target.value)}>
              {Object.entries(COUNTRIES).map(([c, i]) => <option key={c} value={c}>{i.flag} {i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Position</label>
            <select className="input" value={f.position}
              onChange={(e) => set('position', e.target.value as PlayerInput['position'])}>
              {POSITIONS.map((p) => <option key={p} value={p}>{POSITION_INFO[p].label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Office title</label>
          <input className="input" required value={f.officeTitle} onChange={(e) => set('officeTitle', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Status</label>
            <select className="input" value={f.status}
              onChange={(e) => set('status', e.target.value as PlayerInput['status'])}>
              {/* LEFT_OFFICE goes through the dedicated flow, unless they've already left. */}
              {PLAYER_STATUSES.filter((s) => s !== 'LEFT_OFFICE' || player?.status === 'LEFT_OFFICE').map(
                (s) => <option key={s} value={s}>{STATUS_INFO[s].label}</option>,
              )}
            </select>
            {player && player.status !== 'LEFT_OFFICE' && (
              <p className="mt-1 text-xs text-slate-500">Use “Left office” in the list to remove from office.</p>
            )}
          </div>
          <div>
            <label className="label">Default draft rank</label>
            <input className="input" type="number" min={1} max={9999} value={f.defaultRank}
              onChange={(e) => set('defaultRank', Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">English Wikipedia article title</label>
          <input className="input" required value={f.wikiTitle} onChange={(e) => set('wikiTitle', e.target.value)}
            placeholder="e.g. Andrew Bailey (banker)" />
          <p className="mt-1 text-xs text-slate-500">Exactly as in the URL after /wiki/ (spaces are fine). Used for Media Share scoring.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Native wiki</label>
            <input className="input" placeholder="fr" value={f.nativeWikiLang ?? ''}
              onChange={(e) => set('nativeWikiLang', e.target.value || null)} />
          </div>
          <div className="col-span-2">
            <label className="label">Native article title</label>
            <input className="input" value={f.nativeWikiTitle ?? ''}
              onChange={(e) => set('nativeWikiTitle', e.target.value || null)} />
          </div>
        </div>
        <div>
          <label className="label">Photo URL</label>
          <div className="flex gap-2">
            <input className="input" value={f.photoUrl ?? ''} onChange={(e) => set('photoUrl', e.target.value || null)} />
            {player && (
              <button type="button" className="btn-secondary btn-sm shrink-0" disabled={wiki.isPending}
                onClick={() => wiki.mutate()}>
                From Wikipedia
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea className="input" rows={3} value={f.bio ?? ''} onChange={(e) => set('bio', e.target.value || null)} />
        </div>
        <div>
          <label className="label">Admin notes</label>
          <textarea className="input" rows={2} value={f.adminNotes ?? ''}
            onChange={(e) => set('adminNotes', e.target.value || null)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.needsVerification}
            onChange={(e) => set('needsVerification', e.target.checked)} />
          Needs verification
        </label>
        <ErrorText error={save.error ?? wiki.error ?? del.error} />
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="btn-primary" disabled={save.isPending}>Save</button>
          {player?.needsVerification && (
            <button type="button" className="btn-secondary" disabled={save.isPending}
              onClick={() => save.mutate({ ...f, needsVerification: false })}>
              Save & mark verified ✓
            </button>
          )}
          {player && (
            <button type="button" className="btn-secondary ml-auto text-red-600"
              onClick={() => confirm(`Delete ${player.name} permanently?`) && del.mutate()}>
              Delete
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function LeftOfficeModal({
  player,
  onClose,
  onSaved,
}: {
  player: AdminPlayer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [logPenalty, setLogPenalty] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [addReplacement, setAddReplacement] = useState(true);
  const [rep, setRep] = useState({ name: '', officeTitle: player.officeTitle, wikiTitle: '' });
  const go = useMutation({
    mutationFn: () =>
      api.post<{ removedFromTeams: number }>(`/admin/players/${player.id}/left-office`, {
        logPenalty,
        date,
        replacement: addReplacement ? { ...rep, wikiTitle: rep.wikiTitle || rep.name } : null,
      }),
    onSuccess: () => onSaved(),
  });

  if (go.data) {
    return (
      <Modal title="Done" onClose={onClose}>
        <p className="text-sm">
          {player.name} is marked as left office and was removed from {go.data.removedFromTeams} roster(s).
          {addReplacement && ` ${rep.name} has been added to the player pool as a free agent.`}
        </p>
        <button className="btn-primary mt-4" onClick={onClose}>Close</button>
      </Modal>
    );
  }

  return (
    <Modal title={`${player.name} left office`} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          go.mutate();
        }}
      >
        <p className="text-sm text-slate-600">
          They'll be removed from every league roster and draft queue. Lineups already locked for this
          week keep them, so this week's scoring stays fair.
        </p>
        <div>
          <label className="label">Date they left</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={logPenalty} onChange={(e) => setLogPenalty(e.target.checked)} />
          Log the “Left office” scoring penalty
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={addReplacement} onChange={(e) => setAddReplacement(e.target.checked)} />
          Add their replacement now (same country & position)
        </label>
        {addReplacement && (
          <div className="space-y-3 rounded-xl bg-slate-50 p-3">
            <div>
              <label className="label">Replacement name</label>
              <input className="input" required value={rep.name} onChange={(e) => setRep({ ...rep, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Office title</label>
              <input className="input" required value={rep.officeTitle}
                onChange={(e) => setRep({ ...rep, officeTitle: e.target.value })} />
            </div>
            <div>
              <label className="label">Wikipedia title (defaults to name)</label>
              <input className="input" value={rep.wikiTitle} onChange={(e) => setRep({ ...rep, wikiTitle: e.target.value })} />
            </div>
          </div>
        )}
        <ErrorText error={go.error} />
        <button className="btn-danger" disabled={go.isPending}>Confirm</button>
      </form>
    </Modal>
  );
}
