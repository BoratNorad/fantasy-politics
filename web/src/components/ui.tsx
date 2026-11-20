/** Small shared UI pieces. */
import {
  POSITION_INFO,
  STATUS_INFO,
  countryFlag,
  countryName,
  type PlayerStatus,
  type Position,
} from '@fp/shared';
import type { ReactNode } from 'react';

const STATUS_CLASSES: Record<string, string> = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  slate: 'bg-slate-200 text-slate-700',
  orange: 'bg-orange-100 text-orange-800',
  red: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: { status: PlayerStatus }) {
  const info = STATUS_INFO[status];
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[info.color]}`}
    >
      {info.label}
    </span>
  );
}

const POSITION_CLASSES: Record<Position, string> = {
  HEAD_OF_STATE: 'bg-indigo-100 text-indigo-800',
  FINANCE: 'bg-emerald-100 text-emerald-800',
  FOREIGN: 'bg-sky-100 text-sky-800',
  GOVERNOR: 'bg-amber-100 text-amber-800',
  MAYOR: 'bg-pink-100 text-pink-800',
  LEGISLATIVE: 'bg-violet-100 text-violet-800',
  OPPOSITION: 'bg-rose-100 text-rose-800',
};

export function PositionBadge({ position }: { position: Position }) {
  return (
    <span
      title={POSITION_INFO[position].label}
      className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${POSITION_CLASSES[position]}`}
    >
      {POSITION_INFO[position].short}
    </span>
  );
}

export function Country({ code, short }: { code: string; short?: boolean }) {
  return (
    <span className="whitespace-nowrap">
      <span aria-hidden>{countryFlag(code)}</span> {short ? code : countryName(code)}
    </span>
  );
}

export function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return url ? (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-full bg-slate-200 object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

export function ErrorText({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {error instanceof Error ? error.message : String(error)}
    </p>
  );
}

export function Loading() {
  return <div className="py-10 text-center text-slate-500">Loading…</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">{children}</div>;
}

/** Copy-to-clipboard button with a brief "Copied!" confirmation. */
export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      className="btn-secondary btn-sm"
      onClick={async (e) => {
        const btn = e.currentTarget;
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = 'Copied!';
        } catch {
          window.prompt('Copy this:', text);
        }
        setTimeout(() => (btn.textContent = label), 1500);
      }}
    >
      {label}
    </button>
  );
}
