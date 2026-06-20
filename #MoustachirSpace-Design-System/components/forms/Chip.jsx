import React from 'react';

/**
 * Selectable chip used in feedback flows ("High Quality", "On Time", "Delays").
 * Selected = solid electric blue; idle = light grey card. Toggle with onToggle.
 */
export function Chip({
  children,
  selected = false,
  onToggle,
  tone = 'blue',
  leadingIcon = null,
  disabled = false,
  style = {},
  ...rest
}) {
  const tones = {
    blue: { bg: 'var(--blue-500)', fg: '#fff' },
    orange: { bg: 'var(--orange-500)', fg: '#fff' },
    green: { bg: 'var(--green-500)', fg: '#fff' },
    ink: { bg: 'var(--ink-900)', fg: '#fff' },
  };
  const t = tones[tone] || tones.blue;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => onToggle && onToggle(!selected)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 36,
        padding: '0 16px',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-text)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        transition: 'background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)',
        background: selected ? t.bg : 'var(--surface-3)',
        color: selected ? t.fg : 'var(--ink-500)',
        boxShadow: selected ? 'var(--shadow-sm)' : 'inset 0 0 0 1px var(--line-200)',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      {...rest}
    >
      {leadingIcon && <span style={{ display: 'inline-flex', fontSize: 15 }}>{leadingIcon}</span>}
      {children}
    </button>
  );
}
