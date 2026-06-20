import React from 'react';

/**
 * App top bar. Two layouts:
 *  · variant="title"    — leading (back) · centered title · trailing
 *  · variant="greeting" — avatar · "Merhba," + name · trailing
 */
export function AppHeader({
  variant = 'title',
  title = '',
  greeting = 'Merhba,',
  name = '',
  leading = null,
  trailing = null,
  avatar = null,
  style = {},
  ...rest
}) {
  if (variant === 'greeting') {
    return (
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 'var(--space-4)',
          ...style,
        }}
        {...rest}
      >
        {avatar}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: 'var(--fw-medium) var(--fs-sm)/1 var(--font-text)', color: 'var(--ink-400)' }}>{greeting}</div>
          <div style={{ font: 'var(--fw-bold) var(--fs-h2)/1.15 var(--font-display)', letterSpacing: '-0.02em', color: 'var(--ink-900)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        </div>
        {trailing}
      </header>
    );
  }
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 44px',
        alignItems: 'center',
        padding: 'var(--space-3) var(--space-4)',
        ...style,
      }}
      {...rest}
    >
      <div style={{ justifySelf: 'start' }}>{leading}</div>
      <h1 style={{ margin: 0, justifySelf: 'center', font: 'var(--fw-bold) var(--fs-h1)/1.2 var(--font-display)', letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>{title}</h1>
      <div style={{ justifySelf: 'end' }}>{trailing}</div>
    </header>
  );
}
