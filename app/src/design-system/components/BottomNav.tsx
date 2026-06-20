import React from 'react';

export interface BottomNavItem {
  key: string;
  icon: React.ReactNode;
  iconActive?: React.ReactNode;
  label?: string;
}

export interface BottomNavProps extends Omit<React.HTMLAttributes<HTMLElement>, 'style' | 'onSelect'> {
  items?: BottomNavItem[];
  active?: string;
  onSelect?: (key: string) => void;
  onFab?: () => void;
  fabIcon?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Bottom tab bar with a centre raised electric-blue FAB. */
export function BottomNav({ items = [], active, onSelect, onFab, fabIcon = null, style = {}, ...rest }: BottomNavProps) {
  const left = items.slice(0, Math.ceil(items.length / 2));
  const right = items.slice(Math.ceil(items.length / 2));

  const Tab = ({ it }: { it: BottomNavItem }) => {
    const on = it.key === active;
    return (
      <button
        type="button"
        onClick={() => onSelect && onSelect(it.key)}
        aria-label={it.label || it.key}
        aria-current={on ? 'page' : undefined}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: on ? 'var(--blue-500)' : 'var(--ink-300)',
          fontSize: 24,
          padding: '6px 0',
          transition: 'color var(--dur-base) var(--ease-out)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {on && it.iconActive ? it.iconActive : it.icon}
        {it.label && <span style={{ font: 'var(--fw-semibold) 10px/1 var(--font-text)' }}>{it.label}</span>}
      </button>
    );
  };

  return (
    <nav
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        height: 'var(--nav-h)',
        padding: '0 12px',
        background: 'var(--surface-card)',
        boxShadow: '0 -6px 24px rgba(21,35,63,0.07)',
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: 'flex', flex: 1 }}>{left.map((it) => <Tab key={it.key} it={it} />)}</div>
      <div style={{ width: 76, flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onFab}
          aria-label="Create"
          style={{
            width: 56,
            height: 56,
            marginTop: -26,
            borderRadius: '999px',
            border: '4px solid var(--surface-card)',
            background: 'var(--blue-500)',
            color: '#fff',
            fontSize: 26,
            boxShadow: 'var(--glow-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {fabIcon || <i className="ph ph-plus" aria-hidden="true" />}
        </button>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>{right.map((it) => <Tab key={it.key} it={it} />)}</div>
    </nav>
  );
}
