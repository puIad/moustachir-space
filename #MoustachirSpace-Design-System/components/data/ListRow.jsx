import React from 'react';

/**
 * Tappable list row — a white card with a tinted leading icon tile, a title +
 * subtitle/meta, and a trailing slot (progress ring, chevron, etc).
 * Used for "My Missions", activity lists and lead lists.
 */
export function ListRow({
  icon = null,
  iconTone = 'blue',
  title,
  subtitle = null,
  meta = null,
  trailing = null,
  onClick,
  style = {},
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const tones = {
    blue: { bg: 'var(--blue-50)', fg: 'var(--blue-500)' },
    orange: { bg: 'var(--orange-50)', fg: 'var(--orange-500)' },
    green: { bg: 'var(--green-50)', fg: 'var(--green-500)' },
    ink: { bg: 'var(--surface-3)', fg: 'var(--ink-500)' },
  };
  const t = tones[iconTone] || tones.blue;
  const clickable = !!onClick;

  return (
    <div
      onClick={onClick}
      onPointerDown={() => clickable && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        cursor: clickable ? 'pointer' : 'default',
        transform: pressed ? 'scale(0.99)' : 'scale(1)',
        transition: 'transform var(--dur-fast) var(--ease-out)',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      {...rest}
    >
      {icon && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            flex: '0 0 auto',
            borderRadius: 'var(--radius-sm)',
            background: t.bg,
            color: t.fg,
            fontSize: 20,
          }}
        >
          {icon}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            font: 'var(--fw-bold) var(--fs-body)/1.25 var(--font-text)',
            color: 'var(--ink-900)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {(subtitle || meta) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            {subtitle}
            {meta && <span style={{ font: 'var(--fw-medium) var(--fs-label)/1 var(--font-text)', color: 'var(--ink-400)' }}>{meta}</span>}
          </div>
        )}
      </div>
      {trailing && <div style={{ flex: '0 0 auto' }}>{trailing}</div>}
    </div>
  );
}
