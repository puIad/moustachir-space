import React from 'react';

export interface StatCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: 'up' | 'down' | 'flat';
  watermark?: React.ReactNode;
  /** Optional left accent bar (e.g. a branch color). */
  accent?: string | null;
  style?: React.CSSProperties;
}

/** Dashboard metric card — label, big number, delta line, faint watermark icon. */
export function StatCard({
  label,
  value,
  unit = null,
  delta = null,
  deltaTone = 'up',
  watermark = null,
  accent = null,
  style = {},
  ...rest
}: StatCardProps) {
  const deltaColor = deltaTone === 'up' ? 'var(--green-500)' : deltaTone === 'down' ? 'var(--red-500)' : 'var(--ink-400)';
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--surface-3)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        minWidth: 0,
        borderLeft: accent ? `3px solid ${accent}` : undefined,
        ...style,
      }}
      {...rest}
    >
      {watermark && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 92,
            lineHeight: 0,
            color: 'rgba(21,35,63,0.05)',
            pointerEvents: 'none',
          }}
        >
          {watermark}
        </span>
      )}
      <div style={{ position: 'relative' }}>
        <div style={{ font: 'var(--fw-medium) var(--fs-sm)/1 var(--font-text)', color: 'var(--ink-500)' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
          <span className="ms-mono" style={{ fontWeight: 700, fontSize: 'var(--fs-stat)', lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>{value}</span>
          {unit && <span style={{ font: 'var(--fw-semibold) var(--fs-h3)/1 var(--font-display)', color: 'var(--ink-700)' }}>{unit}</span>}
        </div>
        {delta && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, font: 'var(--fw-semibold) var(--fs-label)/1 var(--font-text)', color: deltaColor }}>
            {deltaTone !== 'flat' && (
              <i className={deltaTone === 'up' ? 'ph-bold ph-trend-up' : 'ph-bold ph-trend-down'} style={{ fontSize: 13 }} aria-hidden="true" />
            )}
            {delta}
          </div>
        )}
      </div>
    </div>
  );
}
