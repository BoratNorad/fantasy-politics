/** /join/:code — invite landing page. Works logged-out (prompts sign-up first). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth';
import { ErrorText, Loading } from '../../components/ui';

interface InvitePreview {
  league: {
    id: string;
    name: string;
    commissioner: string;
    teamCount: number;
    numTeams: number;
    open: boolean;
  };
  alreadyMember: boolean;
}

export function JoinLeaguePage() {
  const { code = '' } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [teamName, setTeamName] = useState('');
  const preview = useQuery({
    queryKey: ['invite', code, user?.id],
    queryFn: () => api.get<InvitePreview>(`/invites/${encodeURIComponent(code)}`),
    retry: false,
  });
  const join = useMutation({
    mutationFn: () => api.post<{ leagueId: string }>(`/invites/${encodeURIComponent(code)}/join`, { teamName }),
    onSuccess: ({ leagueId }) => {
      qc.invalidateQueries({ queryKey: ['leagues'] });
      navigate(`/leagues/${leagueId}`);
    },
  });

  if (loading || preview.isLoading) return <Loading />;
  if (preview.error) {
    return (
      <div className="mx-auto max-w-sm space-y-4 pt-6 text-center">
        <ErrorText error={preview.error} />
        <Link to="/" className="text-indigo-600 underline">Go home</Link>
      </div>
    );
  }
  const { league, alreadyMember } = preview.data!;
  if (alreadyMember) return <Navigate to={`/leagues/${league.id}`} replace />;
  const next = encodeURIComponent(`/join/${code}`);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    join.mutate();
  };

  return (
    <div className="mx-auto max-w-sm space-y-4 pt-6">
      <div className="card text-center">
        <div className="text-4xl" aria-hidden>📨</div>
        <p className="mt-2 text-sm text-slate-500">{league.commissioner} invited you to join</p>
        <h1 className="mt-1 text-xl font-bold">{league.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {league.teamCount} of {league.numTeams} teams so far
        </p>
      </div>

      {!league.open ? (
        <p className="card text-center text-slate-600">This league is full or has already drafted.</p>
      ) : !user ? (
        <div className="card space-y-3 text-center">
          <p className="text-sm text-slate-600">Create an account (or log in) to claim your spot.</p>
          <Link to={`/signup?next=${next}`} className="btn-primary w-full">Sign up</Link>
          <Link to={`/login?next=${next}`} className="btn-secondary w-full">Log in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="card space-y-3">
          <label className="label" htmlFor="team">Name your team</label>
          <input id="team" className="input" required minLength={2} maxLength={40} value={teamName}
            onChange={(e) => setTeamName(e.target.value)} placeholder="The Lame Ducks" />
          <ErrorText error={join.error} />
          <button className="btn-primary w-full" disabled={join.isPending}>Join league</button>
        </form>
      )}
    </div>
  );
}
