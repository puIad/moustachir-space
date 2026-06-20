/**
 * components/DataStatus.tsx — dev-only "Data status" indicator.
 * ----------------------------------------------------------------------------
 * Floating badge (bottom-left) showing how many rows the local Dexie DB holds
 * and the loaded seed version, with a "Reset data" button that re-imports from
 * seed.json. Renders only under `import.meta.env.DEV` so it never ships in the
 * production build.
 */

import { useState } from 'react';
import type { SeedStatus } from '@/store/seed';

interface Props {
  status: SeedStatus | null;
  onReset: () => Promise<void>;
}

export function DataStatus({ status, onReset }: Props) {
  const [busy, setBusy] = useState(false);
  if (!import.meta.env.DEV) return null;

  const handleReset = async () => {
    setBusy(true);
    try {
      await onReset();
    } finally {
      setBusy(false);
    }
  };

  const rows = status?.totalRows ?? 0;
  const version = status?.seedVersion ?? '—';
  const ok = !!status?.seeded;

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 10,
        background: 'rgba(15,23,42,0.92)',
        color: '#e2e8f0',
        font: '500 12px/1.2 var(--font-mono, monospace)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(4px)',
      }}
      title={
        status
          ? Object.entries(status.byTable)
              .map(([t, n]) => `${t}: ${n}`)
              .join('\n')
          : 'loading…'
      }
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: ok ? '#22c55e' : '#f59e0b',
        }}
      />
      <span>
        DB · {rows.toLocaleString()} rows · seed {version}
      </span>
      <button
        type="button"
        onClick={handleReset}
        disabled={busy}
        style={{
          border: '1px solid rgba(148,163,184,0.4)',
          background: 'transparent',
          color: '#e2e8f0',
          borderRadius: 6,
          padding: '2px 8px',
          cursor: busy ? 'wait' : 'pointer',
          font: 'inherit',
        }}
      >
        {busy ? 'Resetting…' : 'Reset data'}
      </button>
    </div>
  );
}
