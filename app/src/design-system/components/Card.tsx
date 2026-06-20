import React from 'react';

export type CardTone = 'white' | 'tint' | 'sunken' | 'outline';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'title'> {
  tone?: CardTone;
  title?: React.ReactNode;
  action?: React.ReactNode;
  padding?: number | string;
  style?: React.CSSProperties;
}

/** Generic surface container. `tone` picks the fill; optional title/action header. */
export function Card({ children, tone = 'white', title = null, action = null, padding = 16, style = {}, ...rest }: CardProps) {
  const tones: Record<CardTone, React.CSSProperties> = {
    white: { background: 'var(--surface-card)', boxShadow: 'var(--shadow-card)' },
    tint: { background: 'var(--surface-tint)', boxShadow: 'none' },
    sunken: { background: 'var(--surface-3)', boxShadow: 'none' },
    outline: { background: 'var(--surface-card)', boxShadow: 'inset 0 0 0 1px var(--line-200)' },
  };
  return (
    <div style={{ borderRadius: 'var(--radius-lg)', padding, ...tones[tone], ...style }} {...rest}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {title && <h3 style={{ margin: 0, font: 'var(--fw-bold) var(--fs-h3)/1.2 var(--font-display)', letterSpacing: '-0.01em', color: 'var(--ink-900)' }}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
