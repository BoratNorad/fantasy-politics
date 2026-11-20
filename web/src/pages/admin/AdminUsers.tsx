/** Admin: list users and generate one-time password reset links. */
import { useMutation, useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { api } from '../../api/client';
import { CopyButton, ErrorText, Loading } from '../../components/ui';

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  isAdmin: boolean;
  _count: { teams: number };
}

export function AdminUsers() {
  const users = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<{ users: UserRow[] }>('/admin/users'),
  });
  const [link, setLink] = useState<{ email: string; url: string } | null>(null);
  const reset = useMutation({
    mutationFn: (u: UserRow) => api.post<{ url: string }>(`/admin/users/${u.id}/reset-link`),
    onSuccess: (r, u) => setLink({ email: u.email, url: r.url }),
  });
  if (users.isLoading) return <Loading />;
  return (
    <div className="space-y-4">
      {link && (
        <div className="card bg-slate-50 text-sm">
          <p className="mb-2">Reset link for <strong>{link.email}</strong> (valid 48 hours, single use):</p>
          <div className="flex gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1">{link.url}</code>
            <CopyButton text={link.url} />
          </div>
        </div>
      )}
      <ErrorText error={users.error ?? reset.error} />
      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {users.data?.users.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate font-medium">
                {u.displayName} {u.isAdmin && <span className="text-xs text-indigo-600">admin</span>}
              </div>
              <div className="truncate text-xs text-slate-500">
                {u.email} · {u._count.teams} league(s) · joined {DateTime.fromISO(u.createdAt).toRelative()}
              </div>
            </div>
            <button className="btn-secondary btn-sm shrink-0" onClick={() => reset.mutate(u)}>
              Reset link
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
