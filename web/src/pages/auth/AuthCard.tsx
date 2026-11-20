import type { ReactNode } from 'react';

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-sm pt-6">
      <div className="mb-6 text-center">
        <div className="text-5xl" aria-hidden>🏛️</div>
        <h1 className="page-title mt-2">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Draft world leaders. Win on real-world activity.</p>
      </div>
      <div className="card space-y-4">{children}</div>
    </div>
  );
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}
