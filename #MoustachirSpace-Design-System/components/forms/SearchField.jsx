import React from 'react';

/** Pill search field with a leading magnifier ("Name or mission ID…"). */
export function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  onClear,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 46,
        padding: '0 14px',
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-pill)',
        boxShadow: focused
          ? 'inset 0 0 0 1.5px var(--blue-500), var(--ring-focus)'
          : 'var(--shadow-sm), inset 0 0 0 1px var(--line-200)',
        transition: 'box-shadow var(--dur-base) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      <i className="ph ph-magnifying-glass" style={{ fontSize: 18, color: 'var(--ink-400)' }} aria-hidden="true" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          font: 'var(--fw-medium) var(--fs-body)/1 var(--font-text)',
          color: 'var(--ink-900)',
        }}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear"
          style={{ border: 'none', background: 'transparent', color: 'var(--ink-400)', fontSize: 16, cursor: 'pointer', display: 'inline-flex' }}
        >
          <i className="ph ph-x-circle" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
