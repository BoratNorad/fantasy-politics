/**
 * League home. Phase 1: league info, draft countdown, teams, invite card, activity feed.
 * Standings and weekly matchups slot in here in Phase 3.
 */
import { LEAGUE_STATUS_LABELS, SLOT_INFO, SLOT_TYPES } from '@fp/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useActivity, useLeague } from '../../api/hooks';
import type { LeagueDetail } from '../../api/types';
import { Countdown } from '../../components/Countdown';
import { CopyButton, ErrorText, Loading } from '../../components/ui';

export function LeagueHomePage() {
  const { id = '' } = useParams();
  const q = useLeague(id);
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorText error={q.error} />;
  const data = q.data!;
  const { league, isCommissioner } = data;
  const s = league.settings;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{league.name}</h1>
          <p className="text-sm text-slate-500">
            {LEAGUE_STATUS_LABELS[league.status]} · Season {league.season} · {data.teams.length}/
            {s.numTeams} teams
          </p>
        </div>
        {isCommissioner && (
          <Link to={`/leagues/${id}/settings`} className="btn-secondary">
            ⚙️ League settings
          </Link>
        )}
      </div>

      {league.status === 'PRE_DRAFT' && (
        <div className="card">
          {league.draftAt ? (
            <Countdown to={league.draftAt} label="Draft starts in" />
          ) : (
            <p className="text-center text-sm text-slate-500">
              {isCommissioner
                ? 'Schedule the draft in League settings once everyone has joined.'
                : 'The commissioner hasn’t scheduled the draft yet.'}
            </p>
          )}
        </div>
      )}

      {isCommissioner && league.inviteUrl && data.teams.length < s.numTeams && (
        <InviteCard url={league.inviteUrl} code={league.inviteCode!} />
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <TeamsCard data={data} />
        <div className="space-y-5">
          <SettingsSummary data={data} />
          <ActivityFeed leagueId={id} />
        </div>
      </div>
    </div>
  );
}

function InviteCard({ url, code }: { url: string; code: string }) {
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Join my Fantasy Politics league', url }).catch(() => {});
    }
  };
  return (
    <div className="card border-indigo-200 bg-indigo-50">
      <h2 className="font-semibold">Invite your friends</h2>
      <p className="mt-1 text-sm text-slate-600">Send them this link, or have them enter the code.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 text-sm">{url}</code>
        <CopyButton text={url} label="Copy link" />
        {'share' in navigator && (
          <button className="btn-secondary btn-sm" onClick={share}>Share…</button>
        )}
      </div>
      <p className="mt-2 text-sm">
        Code: <span className="font-mono font-bold tracking-wider">{code}</span>
      </p>
    </div>
  );
}

function TeamsCard({ data }: { data: LeagueDetail }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const myTeam = data.teams.find((t) => t.id === data.myTeamId);
  const [name, setName] = useState(myTeam?.name ?? '');
  const rename = useMutation({
    mutationFn: () => api.patch(`/leagues/${data.league.id}/teams/${myTeam!.id}`, { name }),
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['league', data.league.id] });
    },
  });
  const leave = useMutation({
    mutationFn: () => api.del(`/leagues/${data.league.id}/teams/${myTeam!.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leagues'] });
      window.location.href = '/';
    },
  });

  return (
    <div className="card">
      <h2 className="mb-3 font-semibold">Teams</h2>
      <ul className="divide-y divide-slate-100">
        {data.teams.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2 py-2.5">
            <div className="min-w-0">
              {t.id === myTeam?.id && editing ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    rename.mutate();
                  }}
                >
                  <input className="input py-1.5" value={name} autoFocus maxLength={40}
                    onChange={(e) => setName(e.target.value)} />
                  <button className="btn-primary btn-sm" disabled={rename.isPending}>Save</button>
                </form>
              ) : (
                <div className="truncate font-medium">
                  {t.name} {t.id === myTeam?.id && <span className="text-xs text-indigo-600">(you)</span>}
                </div>
              )}
              <div className="text-xs text-slate-500">
                {t.owner.displayName} {t.isCommissioner && '· ⭐ Commissioner'}
              </div>
            </div>
            {t.id === myTeam?.id && !editing && (
              <button className="text-sm text-indigo-600" onClick={() => setEditing(true)}>Rename</button>
            )}
          </li>
        ))}
        {Array.from({ length: Math.max(0, data.league.settings.numTeams - data.teams.length) }).map((_, i) => (
          <li key={`open-${i}`} className="py-2.5 text-sm italic text-slate-400">Open slot</li>
        ))}
      </ul>
      <ErrorText error={rename.error ?? leave.error} />
      {myTeam && !data.isCommissioner && data.league.status === 'PRE_DRAFT' && (
        <button
          className="mt-3 text-xs text-red-600"
          onClick={() => confirm('Leave this league?') && leave.mutate()}
        >
          Leave league
        </button>
      )}
    </div>
  );
}

function SettingsSummary({ data }: { data: LeagueDetail }) {
  const s = data.league.settings;
  const lineup = SLOT_TYPES.filter((k) => s.lineupSlots[k] > 0)
    .map((k) => `${s.lineupSlots[k]} ${SLOT_INFO[k].short}`)
    .join(' · ');
  return (
    <div className="card text-sm">
      <h2 className="mb-2 font-semibold">League rules</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <dt className="text-slate-500">Lineup</dt>
        <dd>{lineup} + {s.benchSize} bench</dd>
        <dt className="text-slate-500">Roster size</dt>
        <dd>{data.league.rosterSize}</dd>
        <dt className="text-slate-500">Season</dt>
        <dd>{s.regularSeasonWeeks} weeks, top {s.playoffTeams} make playoffs</dd>
        <dt className="text-slate-500">Draft</dt>
        <dd>
          Snake, {s.draftOrderMode === 'RANDOM' ? 'random order' : 'commissioner-set order'},{' '}
          {s.draftPickSeconds}s per pick
        </dd>
        <dt className="text-slate-500">Time zone</dt>
        <dd>{s.timezone} (weeks run Mon–Sun)</dd>
      </dl>
    </div>
  );
}

function ActivityFeed({ leagueId }: { leagueId: string }) {
  const q = useActivity(leagueId);
  return (
    <div className="card">
      <h2 className="mb-2 font-semibold">Activity</h2>
      {q.isLoading ? (
        <Loading />
      ) : (
        <ul className="space-y-2 text-sm">
          {q.data?.activity.map((a) => (
            <li key={a.id} className="flex justify-between gap-3">
              <span>{a.message}</span>
              <span className="shrink-0 text-xs text-slate-400">
                {DateTime.fromISO(a.createdAt).toRelative()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
