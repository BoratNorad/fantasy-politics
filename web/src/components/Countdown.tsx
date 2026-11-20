/** Live countdown to a timestamp, plus the time shown in the viewer's own time zone. */
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

export function formatLocal(iso: string): string {
  return DateTime.fromISO(iso).toLocaleString({
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function Countdown({ to, label }: { to: string; label: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) {
    return (
      <div className="text-center">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-xl font-bold text-indigo-700">It's time!</div>
      </div>
    );
  }
  const s = Math.floor(ms / 1000);
  const parts = [
    { v: Math.floor(s / 86400), u: 'd' },
    { v: Math.floor((s % 86400) / 3600), u: 'h' },
    { v: Math.floor((s % 3600) / 60), u: 'm' },
    { v: s % 60, u: 's' },
  ];
  return (
    <div className="text-center">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 flex justify-center gap-2 font-mono text-2xl font-bold tabular-nums">
        {parts.map((p) => (
          <span key={p.u}>
            {String(p.v).padStart(2, '0')}
            <span className="text-sm font-medium text-slate-400">{p.u}</span>
          </span>
        ))}
      </div>
      <div className="mt-1 text-xs text-slate-500">{formatLocal(to)}</div>
    </div>
  );
}
