/** Home: the user's leagues, plus create-league and join-by-code forms. */
import { LEAGUE_STATUS_LABELS } from '@fp/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { timeZoneOptions, useMyLeagues } from '../../api/hooks';
import { formatLocal } from '../../components/Countdown';
import { EmptyState, ErrorText, Loading } from '../../components/ui';

export function DashboardPage() {
  const leagues = useMyLeagues();
  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Your leagues</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setMode(mode === 'join' ? 'none' : 'join')}>
            Join with code
          </button>
          <button className="btn-primary" onClick={() => setMode(mode === 'create' ? 'none' : 'create')}>
            + New league
          </button>
        </div>
      </div>

      {mode === 'create' && <CreateLeagueForm />}
      {mode === 'join' && <JoinByCodeForm />}

      {leagues.isLoading ? (
        <Loading />
      ) : leagues.error ? (
        <ErrorText error={leagues.error} />
      ) : leagues.data!.leagues.length === 0 ? (
        <EmptyState>
          You're not in any leagues yet. Create one and invite friends, or join with a code.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {leagues.data!.leagues.map((l) => (
            <li key={l.id}>
              <Link to={`/leagues/${l.id}`} className="card block transition hover:border-indigo-300">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{l.name}</div>
                    <div className="text-sm text-slate-500">{l.myTeam.name}</div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {LEAGUE_STATUS_LABELS[l.status]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    {l.teamCount}/{l.numTeams} teams
                  </span>
                  {l.isCommissioner && <span>⭐ Commissioner</span>}
                  {l.draftAt && l.status === 'PRE_DRAFT' && <span>Draft: {formatLocal(l.draftAt)}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateLeagueForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const zones = timeZoneOptions();
  const [form, setForm] = useState({ name: '', teamName: '', numTeams: 8, timezone: zones[0] });
  const create = useMutation({
    mutationFn: () => api.post<{ id: string }>('/leagues', form),
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ['leagues'] });
      navigate(`/leagues/${id}`);
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };
  return (
    <form onSubmit={submit} className="card grid gap-4 sm:grid-cols-2">
      <h2 className="font-semibold sm:col-span-2">Create a league</h2>
      <div>
        <label className="label">League name</label>
        <input className="input" required minLength={2} maxLength={60} value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="The Situation Room" />
      </div>
      <div>
        <label className="label">Your team name</label>
        <input className="input" required minLength={2} maxLength={40} value={form.teamName}
          onChange={(e) => setForm({ ...form, teamName: e.target.value })} placeholder="Filibuster Force" />
      </div>
      <div>
        <label className="label">Number of teams</label>
        <select className="input" value={form.numTeams}
          onChange={(e) => setForm({ ...form, numTeams: Number(e.target.value) })}>
          {Array.from({ length: 9 }, (_, i) => i + 4).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">League time zone</label>
        <select className="input" value={form.timezone}
          onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
          {zones.map((z) => <option key={z}>{z}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <ErrorText error={create.error} />
        <p className="mb-3 text-xs text-slate-500">You can change all settings later, until the draft starts.</p>
        <button className="btn-primary" disabled={create.isPending}>Create league</button>
      </div>
    </form>
  );
}

function JoinByCodeForm() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  return (
    <form
      className="card flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) navigate(`/join/${encodeURIComponent(code.trim())}`);
      }}
    >
      <div className="flex-1">
        <label className="label">Invite code</label>
        <input className="input uppercase" value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD-1234" autoCapitalize="characters" />
      </div>
      <button className="btn-primary">Continue</button>
    </form>
  );
}
