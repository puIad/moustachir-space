import React from 'react';

/**
 * Signature MoustachirSpace field — a white "card" input with the label
 * sitting small + grey above the value. Soft shadow, focuses to a blue ring.
 */
export function TextField({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  trailingIcon = null,
  onTrailingClick,
  error = '',
  disabled = false,
  style = {},
  inputProps = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const hasError = !!error;

  return (
    <div style={{ width: '100%', ...style }} {...rest}>
      <div
        style={{
          position: 'relative',
          background: disabled ? 'var(--surface-3)' : 'var(--surface-card)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          boxShadow: hasError
            ? 'inset 0 0 0 1.5px var(--red-500)'
            : focused
              ? 'inset 0 0 0 1.5px var(--blue-500), var(--ring-focus)'
              : 'var(--shadow-sm), inset 0 0 0 1px var(--line-200)',
          transition: 'box-shadow var(--dur-base) var(--ease-out)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <label
            style={{
              display: 'block',
              font: 'var(--fw-medium) var(--fs-label)/1 var(--font-text)',
              color: hasError ? 'var(--red-500)' : 'var(--ink-400)',
              marginBottom: 4,
            }}
          >
            {label}
          </label>
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              font: 'var(--fw-semibold) var(--fs-body)/1.3 var(--font-text)',
              color: 'var(--ink-900)',
              padding: 0,
            }}
            {...inputProps}
          />
        </div>
        {trailingIcon && (
          <button
            type="button"
            onClick={onTrailingClick}
            tabIndex={onTrailingClick ? 0 : -1}
            aria-hidden={!onTrailingClick}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--ink-400)',
              cursor: onTrailingClick ? 'pointer' : 'default',
              fontSize: 20,
              display: 'inline-flex',
              padding: 4,
            }}
          >
            {trailingIcon}
          </button>
        )}
      </div>
      {hasError && (
        <div style={{ font: 'var(--fw-medium) var(--fs-label)/1.4 var(--font-text)', color: 'var(--red-500)', marginTop: 6, paddingLeft: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}
