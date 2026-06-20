import React from 'react';

/**
 * Star rating — electric-blue filled stars. Interactive when onChange is set,
 * otherwise a read-only display (supports halves via `value`).
 */
export function StarRating({
  value = 0,
  max = 5,
  onChange,
  size = 26,
  tone = 'blue',
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(null);
  const color = tone === 'amber' ? 'var(--amber-500)' : 'var(--blue-500)';
  const shown = hover != null ? hover : value;
  const interactive = !!onChange;

  return (
    <div style={{ display: 'inline-flex', gap: 6, ...style }} role={interactive ? 'slider' : 'img'} aria-label={`${value} of ${max}`} {...rest}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= Math.round(shown);
        return (
          <i
            key={i}
            className={filled ? 'ph-fill ph-star' : 'ph ph-star'}
            onMouseEnter={interactive ? () => setHover(i + 1) : undefined}
            onMouseLeave={interactive ? () => setHover(null) : undefined}
            onClick={interactive ? () => onChange(i + 1) : undefined}
            style={{
              fontSize: size,
              color: filled ? color : 'var(--ink-300)',
              cursor: interactive ? 'pointer' : 'default',
              transition: 'transform var(--dur-fast) var(--ease-spring), color var(--dur-fast) var(--ease-out)',
              transform: interactive && hover === i + 1 ? 'scale(1.15)' : 'scale(1)',
            }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
