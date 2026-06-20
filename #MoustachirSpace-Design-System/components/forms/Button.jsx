import React from 'react';

/**
 * MoustachirSpace primary button — the signature glossy blue pill.
 * Variants: primary (gradient + sheen), secondary (tint), ghost, danger.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  leadingIcon = null,
  trailingIcon = null,
  style = {},
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);

  const sizes = {
    sm: { height: 40, padX: 18, font: 14 },
    md: { height: 50, padX: 26, font: 15 },
    lg: { height: 56, padX: 32, font: 16 },
  };
  const s = sizes[size] || sizes.md;

  const base = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    height: s.height,
    padding: `0 ${s.padX}px`,
    width: full ? '100%' : 'auto',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    font: `var(--fw-bold) ${s.font}px/1 var(--font-text)`,
    letterSpacing: '0.01em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    transition: 'transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)',
    transform: pressed && !disabled ? 'scale(var(--press-scale))' : 'scale(1)',
    opacity: disabled ? 0.55 : 1,
    WebkitTapHighlightColor: 'transparent',
  };

  const variants = {
    primary: {
      background: 'var(--grad-primary)',
      color: 'var(--color-on-primary)',
      boxShadow: disabled ? 'none' : (pressed ? 'var(--shadow-btn-press)' : 'var(--shadow-btn)'),
    },
    secondary: {
      background: 'var(--blue-50)',
      color: 'var(--blue-600)',
      boxShadow: 'inset 0 0 0 1px var(--blue-100)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-700)',
      boxShadow: 'inset 0 0 0 1px var(--line-200)',
    },
    danger: {
      background: 'var(--red-500)',
      color: '#fff',
      boxShadow: pressed ? 'none' : '0 6px 16px rgba(240,69,62,0.30)',
    },
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{ ...base, ...variants[variant], ...style }}
      {...rest}
    >
      {variant === 'primary' && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'var(--gloss-overlay)',
            pointerEvents: 'none',
          }}
        />
      )}
      {leadingIcon && <span style={{ position: 'relative', display: 'inline-flex' }}>{leadingIcon}</span>}
      <span style={{ position: 'relative' }}>{children}</span>
      {trailingIcon && <span style={{ position: 'relative', display: 'inline-flex' }}>{trailingIcon}</span>}
    </button>
  );
}
