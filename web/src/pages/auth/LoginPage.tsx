import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth';
import { ErrorText } from '../../components/ui';
import { AuthCard, safeNext } from './AuthCard';

export function LoginPage() {
  const { user, refresh } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useMutation({
    mutationFn: () => api.post('/auth/login', { email, password }),
    onSuccess: async () => {
      await refresh();
      navigate(next, { replace: true });
    },
  });

  if (user) return <Navigate to={next} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate();
  };

  return (
    <AuthCard title="Log in">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <ErrorText error={login.error} />
        <button className="btn-primary w-full" disabled={login.isPending}>
          {login.isPending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        New here?{' '}
        <Link to={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-indigo-600">
          Create an account
        </Link>
      </p>
      <p className="text-center text-xs text-slate-500">
        Forgot your password? Ask your league commissioner for a reset link.
      </p>
    </AuthCard>
  );
}
