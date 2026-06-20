import React from 'react';

/**
 * Avatar — circular photo, or initials on a tinted disc as fallback.
 */
export function Avatar({
  src = null,
  name = '',
  size = 44,
  ring = false,
  style = {},
  ...rest
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const common = {
    width: size,
    height: size,
    borderRadius: '999px',
    flex: '0 0 auto',
    boxShadow: ring ? '0 0 0 2px var(--white), 0 0 0 4px var(--blue-500)' : 'none',
    ...style,
  };

  if (src) {
    return <img src={src} alt={name} style={{ ...common, objectFit: 'cover', display: 'block' }} {...rest} />;
  }
  return (
    <div
      style={{
        ...common,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--blue-50)',
        color: 'var(--blue-600)',
        font: `var(--fw-bold) ${Math.round(size * 0.38)}px/1 var(--font-display)`,
      }}
      {...rest}
    >
      {initials || '?'}
    </div>
  );
}
