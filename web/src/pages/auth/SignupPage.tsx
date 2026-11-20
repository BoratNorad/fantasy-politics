import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth';
import { ErrorText } from '../../components/ui';
import { AuthCard, safeNext } from './AuthCard';

export function SignupPage() {
  const { user, refresh } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const signup = useMutation({
    mutationFn: () => api.post('/auth/signup', form),
    onSuccess: async () => {
      await refresh();
      navigate(next, { replace: true });
    },
  });

  if (user) return <Navigate to={next} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    signup.mutate();
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <AuthCard title="Create account">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" className="input" autoComplete="nickname" required maxLength={40}
            value={form.displayName} onChange={set('displayName')} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" required
            value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="new-password" required
            minLength={8} value={form.password} onChange={set('password')} />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>
        <ErrorText error={signup.error} />
        <button className="btn-primary w-full" disabled={signup.isPending}>
          {signup.isPending ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-indigo-600">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
