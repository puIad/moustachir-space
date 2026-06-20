import React from 'react';

export interface SelectOption {
  label: React.ReactNode;
  value: string;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'onChange'> {
  label?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<string | SelectOption>;
  placeholder?: string;
  leadingIcon?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Dropdown in the card style. Native <select> for accessibility, custom chrome. */
export function Select({ label, value, onChange, options = [], placeholder = 'Select…', leadingIcon = null, disabled = false, style = {}, ...rest }: SelectProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      style={{
        position: 'relative',
        background: disabled ? 'var(--surface-3)' : 'var(--surface-card)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        boxShadow: focused ? 'inset 0 0 0 1.5px var(--blue-500), var(--ring-focus)' : 'var(--shadow-sm), inset 0 0 0 1px var(--line-200)',
        transition: 'box-shadow var(--dur-base) var(--ease-out)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        ...style,
      }}
      {...rest}
    >
      {leadingIcon && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            flex: '0 0 auto',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--blue-50)',
            color: 'var(--blue-500)',
            fontSize: 18,
          }}
        >
          {leadingIcon}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {label && (
          <label style={{ display: 'block', font: 'var(--fw-medium) var(--fs-label)/1 var(--font-text)', color: 'var(--ink-400)', marginBottom: 4 }}>
            {label}
          </label>
        )}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            appearance: 'none',
            WebkitAppearance: 'none',
            font: 'var(--fw-semibold) var(--fs-body)/1.3 var(--font-text)',
            color: value ? 'var(--ink-900)' : 'var(--ink-400)',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => {
            const val = typeof o === 'string' ? o : o.value;
            const lab = typeof o === 'string' ? o : o.label;
            return (
              <option key={val} value={val}>
                {lab as string}
              </option>
            );
          })}
        </select>
      </div>
      <i className="ph ph-caret-down" style={{ color: 'var(--ink-400)', fontSize: 16, flex: '0 0 auto' }} aria-hidden="true" />
    </div>
  );
}
