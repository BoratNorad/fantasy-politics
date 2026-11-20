/** Auth context: who is logged in, plus login/signup/logout helpers. */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from './api/client';
import type { Me } from './api/types';

interface AuthValue {
  user: Me | null;
  loading: boolean;
  refresh: () => Promise<unknown>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ user: Me | null }>('/auth/me'),
    staleTime: 5 * 60_000,
  });
  const value: AuthValue = {
    user: me.data?.user ?? null,
    loading: me.isLoading,
    refresh: () => qc.invalidateQueries(),
    logout: async () => {
      await api.post('/auth/logout');
      qc.clear();
      await me.refetch();
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Wrap routes that need a logged-in user; redirects to /login?next=… otherwise. */
export function RequireAuth({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-8 text-center text-slate-500">Loading…</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (admin && !user.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
