/** Commissioner-only: edit settings, schedule the draft, manage members. */
import {
  CATEGORY_LABELS,
  EVENT_CATEGORIES,
  EVENT_TYPES,
  EVENT_TYPE_KEYS,
  LEAGUE_LIMITS,
  SLOT_INFO,
  SLOT_TYPES,
  starterCount,
  type LeagueSettingsInput,
} from '@fp/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { timeZoneOptions, useLeague } from '../../api/hooks';
import type { LeagueDetail } from '../../api/types';
import { formatLocal } from '../../components/Countdown';
import { CopyButton, ErrorText, Loading } from '../../components/ui';

export function LeagueSettingsPage() {
  const { id = '' } = useParams();
  const q = useLeague(id);
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorText error={q.error} />;
  const data = q.data!;
  if (!data.isCommissioner) {
    return <p className="card">Only the commissioner can edit league settings.</p>;
  }
  const locked = data.league.status !== 'PRE_DRAFT' || data.league.draftState !== 'NOT_STARTED';

  return (
    <div className="space-y-5">
      <div>
        <Link to={`/leagues/${id}`} className="text-sm text-indigo-600">← {data.league.name}</Link>
        <h1 className="page-title mt-1">League settings</h1>
        {locked && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            The draft has started, so settings are locked.
          </p>
        )}
      </div>
      {!locked && <DraftTimeCard data={data} />}
      <SettingsForm data={data} locked={locked} />
      <MembersCard data={data} locked={locked} />
      {!locked && <DangerZone data={data} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function NumberField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="label">{props.label}</label>
      <input
        type="number"
        inputMode="decimal"
        className="input"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        disabled={props.disabled}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
      {props.hint && <p className="mt-1 text-xs text-slate-500">{props.hint}</p>}
    </div>
  );
}

function DraftTimeCard({ data }: { data: LeagueDetail }) {
  const qc = useQueryClient();
  // datetime-local inputs work in the viewer's local time; we send UTC to the server.
  const initial = data.league.draftAt
    ? DateTime.fromISO(data.league.draftAt).toFormat("yyyy-MM-dd'T'HH:mm")
    : '';
  const [value, setValue] = useState(initial);
  const save = useMutation({
    mutationFn: (draftAt: string | null) =>
      api.put(`/leagues/${data.league.id}/draft-time`, { draftAt }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['league', data.league.id] }),
  });
  return (
    <Section title="Draft date & time">
      <p className="text-sm text-slate-600">
        Enter the time in <strong>your</strong> time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
        Everyone else sees it converted to theirs.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="datetime-local" className="input sm:max-w-xs" value={value}
          onChange={(e) => setValue(e.target.value)} />
        <button
          className="btn-primary"
          disabled={!value || save.isPending}
          onClick={() => save.mutate(DateTime.fromISO(value).toUTC().toISO())}
        >
          Save draft time
        </button>
        {data.league.draftAt && (
          <button className="btn-secondary" onClick={() => { setValue(''); save.mutate(null); }}>
            Clear
          </button>
        )}
      </div>
      {data.league.draftAt && (
        <p className="text-sm text-slate-500">Currently: {formatLocal(data.league.draftAt)}</p>
      )}
      <ErrorText error={save.error} />
    </Section>
  );
}

function SettingsForm({ data, locked }: { data: LeagueDetail; locked: boolean }) {
  const qc = useQueryClient();
  const [s, setS] = useState<LeagueSettingsInput>(data.league.settings);
  const [saved, setSaved] = useState(false);
  useEffect(() => setS(data.league.settings), [data.league.settings]);
  const save = useMutation({
    mutationFn: () => api.put(`/leagues/${data.league.id}/settings`, s),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries({ queryKey: ['league', data.league.id] });
    },
  });
  const zones = timeZoneOptions();
  if (!zones.includes(s.timezone)) zones.unshift(s.timezone);
  const starters = starterCount(s.lineupSlots);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={locked} className="space-y-5">
        <Section title="General">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">League name</label>
              <input className="input" value={s.name} maxLength={60}
                onChange={(e) => setS({ ...s, name: e.target.value })} />
            </div>
            <NumberField label="Number of teams" value={s.numTeams}
              min={LEAGUE_LIMITS.minTeams} max={LEAGUE_LIMITS.maxTeams}
              onChange={(v) => setS({ ...s, numTeams: v })}
              hint={`${data.teams.length} joined so far`} />
            <div>
              <label className="label">League time zone</label>
              <select className="input" value={s.timezone}
                onChange={(e) => setS({ ...s, timezone: e.target.value })}>
                {zones.map((z) => <option key={z}>{z}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">Scoring weeks run Monday 00:00 – Sunday 23:59 here.</p>
            </div>
            <NumberField label="Regular season weeks" value={s.regularSeasonWeeks}
              min={LEAGUE_LIMITS.minSeasonWeeks} max={LEAGUE_LIMITS.maxSeasonWeeks}
              onChange={(v) => setS({ ...s, regularSeasonWeeks: v })} />
            <NumberField label="Playoff teams" value={s.playoffTeams} min={2} max={s.numTeams}
              onChange={(v) => setS({ ...s, playoffTeams: v })}
              hint="Seeded by record; single elimination, one week per round." />
          </div>
        </Section>

        <Section title={`Starting lineup (${starters} starters + ${s.benchSize} bench = ${starters + s.benchSize} roster spots)`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SLOT_TYPES.map((slot) => (
              <NumberField key={slot} label={SLOT_INFO[slot].label} value={s.lineupSlots[slot]}
                min={0} max={LEAGUE_LIMITS.maxPerSlot}
                onChange={(v) => setS({ ...s, lineupSlots: { ...s.lineupSlots, [slot]: v } })} />
            ))}
            <NumberField label="Bench spots" value={s.benchSize} min={0} max={LEAGUE_LIMITS.maxBench}
              onChange={(v) => setS({ ...s, benchSize: v })} />
          </div>
        </Section>

        <Section title="Draft">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Seconds per pick" value={s.draftPickSeconds}
              min={LEAGUE_LIMITS.minPickSeconds} max={LEAGUE_LIMITS.maxPickSeconds} step={5}
              onChange={(v) => setS({ ...s, draftPickSeconds: v })} hint="30 seconds to 3 minutes" />
            <div>
              <label className="label">Draft order</label>
              <select className="input" value={s.draftOrderMode}
                onChange={(e) => setS({ ...s, draftOrderMode: e.target.value as 'RANDOM' | 'MANUAL' })}>
                <option value="RANDOM">Randomized when the draft starts</option>
                <option value="MANUAL">I'll set it manually</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Scoring">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Media Share (Wikipedia pageviews)</h3>
            <p className="mb-3 text-xs text-slate-500">
              Each player is compared to their own {s.scoring.mediaShare.baselineWeeks}-week average, so leaders
              of small and big countries are equally viable. One unit = 10% above their baseline.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <NumberField label="Points per unit" value={s.scoring.mediaShare.pointsPerUnit} min={0} max={100} step={0.1}
                onChange={(v) => setS({ ...s, scoring: { ...s.scoring, mediaShare: { ...s.scoring.mediaShare, pointsPerUnit: v } } })} />
              <NumberField label="Max units / week" value={s.scoring.mediaShare.maxUnits} min={0} max={1000}
                onChange={(v) => setS({ ...s, scoring: { ...s.scoring, mediaShare: { ...s.scoring.mediaShare, maxUnits: v } } })} />
              <NumberField label="Baseline weeks" value={s.scoring.mediaShare.baselineWeeks} min={2} max={26}
                onChange={(v) => setS({ ...s, scoring: { ...s.scoring, mediaShare: { ...s.scoring.mediaShare, baselineWeeks: v } } })} />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={s.scoring.mediaShare.includeNativeWiki}
                onChange={(e) => setS({ ...s, scoring: { ...s.scoring, mediaShare: { ...s.scoring.mediaShare, includeNativeWiki: e.target.checked } } })} />
              Also count home-language Wikipedia pageviews
            </label>
          </div>
          {EVENT_CATEGORIES.map((cat) => (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">{CATEGORY_LABELS[cat]}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {EVENT_TYPE_KEYS.filter((k) => EVENT_TYPES[k].category === cat).map((k) => (
                  <NumberField key={k} label={EVENT_TYPES[k].label} value={s.scoring.events[k]}
                    min={-200} max={200} step={0.5}
                    onChange={(v) => setS({ ...s, scoring: { ...s.scoring, events: { ...s.scoring.events, [k]: v } } })} />
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-500">
            Scoring rewards activity and outcomes only — never ideology, and never military action,
            crackdowns, or casualties.
          </p>
        </Section>
      </fieldset>

      {!locked && (
        <div className="sticky bottom-20 z-10 flex items-center gap-3 sm:bottom-4">
          <button className="btn-primary shadow-lg" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save settings'}
          </button>
          {saved && <span className="text-sm font-medium text-green-700">Saved ✓</span>}
          <div className="flex-1"><ErrorText error={save.error} /></div>
        </div>
      )}
    </form>
  );
}

function MembersCard({ data, locked }: { data: LeagueDetail; locked: boolean }) {
  const qc = useQueryClient();
  const [resetUrl, setResetUrl] = useState<{ team: string; url: string } | null>(null);
  const remove = useMutation({
    mutationFn: (teamId: string) => api.del(`/leagues/${data.league.id}/teams/${teamId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['league', data.league.id] }),
  });
  const reset = useMutation({
    mutationFn: (teamId: string) =>
      api.post<{ url: string }>(`/leagues/${data.league.id}/teams/${teamId}/reset-link`),
  });
  const regen = useMutation({
    mutationFn: () => api.post(`/leagues/${data.league.id}/invite/regenerate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['league', data.league.id] }),
  });

  return (
    <Section title="Members">
      {data.league.inviteUrl && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Invite code <span className="font-mono font-bold">{data.league.inviteCode}</span></span>
          <CopyButton text={data.league.inviteUrl} label="Copy link" />
          <button type="button" className="btn-secondary btn-sm"
            onClick={() => confirm('Old invite links will stop working. Continue?') && regen.mutate()}>
            New code
          </button>
        </div>
      )}
      <ul className="divide-y divide-slate-100">
        {data.teams.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-slate-500">{t.owner.displayName}</div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary btn-sm"
                onClick={async () => setResetUrl({ team: t.name, url: (await reset.mutateAsync(t.id)).url })}>
                Password reset link
              </button>
              {!t.isCommissioner && !locked && (
                <button type="button" className="btn-secondary btn-sm text-red-600"
                  onClick={() => confirm(`Remove ${t.name} from the league?`) && remove.mutate(t.id)}>
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {resetUrl && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="mb-2">
            Send this one-time link to the owner of <strong>{resetUrl.team}</strong> (valid 48 hours):
          </p>
          <div className="flex gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1">{resetUrl.url}</code>
            <CopyButton text={resetUrl.url} />
          </div>
        </div>
      )}
      <ErrorText error={remove.error ?? reset.error ?? regen.error} />
    </Section>
  );
}

function DangerZone({ data }: { data: LeagueDetail }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: () => api.del(`/leagues/${data.league.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leagues'] });
      navigate('/');
    },
  });
  return (
    <section className="card border-red-200">
      <h2 className="font-semibold text-red-700">Delete league</h2>
      <p className="mt-1 text-sm text-slate-600">Permanently deletes the league and all teams. Only possible before the draft.</p>
      <button
        type="button"
        className="btn-danger mt-3"
        onClick={() => prompt(`Type "${data.league.name}" to confirm`) === data.league.name && del.mutate()}
      >
        Delete league
      </button>
      <ErrorText error={del.error} />
    </section>
  );
}
