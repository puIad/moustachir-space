import React from 'react';

/**
 * Segmented control — pill track with a sliding electric-blue thumb
 * ("Verbally | Online Chat"). 2–4 short options.
 */
export function SegmentedControl({
  options = [],
  value,
  onChange,
  style = {},
  ...rest
}) {
  const items = options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
  const idx = Math.max(0, items.findIndex((i) => i.value === value));
  const n = items.length || 1;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        padding: 4,
        background: 'var(--surface-3)',
        borderRadius: 'var(--radius-pill)',
        ...style,
      }}
      {...rest}
    >
      {/* sliding thumb */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 4,
          width: `calc((100% - 8px) / ${n})`,
          transform: `translateX(${idx * 100}%)`,
          background: 'var(--grad-primary)',
          borderRadius: 'var(--radius-pill)',
          boxShadow: 'var(--shadow-btn)',
          transition: 'transform var(--dur-base) var(--ease-spring)',
        }}
      />
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange && onChange(it.value)}
            style={{
              position: 'relative',
              flex: 1,
              height: 38,
              border: 'none',
              background: 'transparent',
              borderRadius: 'var(--radius-pill)',
              font: 'var(--fw-bold) var(--fs-sm)/1 var(--font-text)',
              color: active ? '#fff' : 'var(--ink-500)',
              cursor: 'pointer',
              transition: 'color var(--dur-base) var(--ease-out)',
              WebkitTapHighlightColor: 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
