import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth';
import { ErrorText, Loading } from '../../components/ui';
import { AuthCard } from './AuthCard';

export function ResetPasswordPage() {
  const { token = '' } = useParams();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const check = useQuery({
    queryKey: ['reset', token],
    queryFn: () => api.get<{ email: string }>(`/auth/reset/${token}`),
    retry: false,
  });
  const reset = useMutation({
    mutationFn: () => api.post(`/auth/reset/${token}`, { password }),
    onSuccess: async () => {
      await refresh();
      navigate('/', { replace: true });
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    reset.mutate();
  };

  return (
    <AuthCard title="Choose a new password">
      {check.isLoading ? (
        <Loading />
      ) : check.error ? (
        <ErrorText error={check.error} />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-600">
            Resetting password for <strong>{check.data?.email}</strong>
          </p>
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input id="password" className="input" type="password" autoComplete="new-password"
              required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <ErrorText error={reset.error} />
          <button className="btn-primary w-full" disabled={reset.isPending}>Save password</button>
        </form>
      )}
    </AuthCard>
  );
}
