import React from 'react';

/**
 * Circular / rounded icon-only button. Pass an icon node as children
 * (e.g. a Phosphor <i className="ph ph-bell" />).
 * Variants: plain, tint (blue-50), solid (electric blue), ghost.
 */
export function IconButton({
  children,
  variant = 'plain',
  size = 'md',
  rounded = 'full',
  badge = false,
  disabled = false,
  ariaLabel,
  style = {},
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const dims = { sm: 36, md: 44, lg: 52 }[size] || 44;
  const fontSize = { sm: 18, md: 20, lg: 24 }[size] || 20;

  const variants = {
    plain: { background: 'transparent', color: 'var(--ink-700)' },
    tint: { background: 'var(--blue-50)', color: 'var(--blue-600)' },
    solid: { background: 'var(--blue-500)', color: '#fff', boxShadow: 'var(--glow-primary)' },
    ghost: { background: 'transparent', color: 'var(--ink-700)', boxShadow: 'inset 0 0 0 1px var(--line-200)' },
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dims,
        height: dims,
        flex: '0 0 auto',
        border: 'none',
        borderRadius: rounded === 'full' ? '999px' : 'var(--radius-md)',
        fontSize,
        lineHeight: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transform: pressed && !disabled ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-base) var(--ease-out)',
        WebkitTapHighlightColor: 'transparent',
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: size === 'sm' ? 6 : 8,
            right: size === 'sm' ? 6 : 8,
            width: 8,
            height: 8,
            borderRadius: '999px',
            background: 'var(--blue-500)',
            boxShadow: '0 0 0 2px var(--white)',
          }}
        />
      )}
    </button>
  );
}
