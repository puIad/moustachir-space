import React from 'react';

export interface TextareaProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'onChange'> {
  label?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Multi-line note field in the same card style as TextField. */
export function Textarea({ label, value, onChange, placeholder = '', rows = 4, disabled = false, style = {}, ...rest }: TextareaProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ width: '100%', ...style }} {...rest}>
      <div
        style={{
          background: disabled ? 'var(--surface-3)' : 'var(--surface-card)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          boxShadow: focused ? 'inset 0 0 0 1.5px var(--blue-500), var(--ring-focus)' : 'var(--shadow-sm), inset 0 0 0 1px var(--line-200)',
          transition: 'box-shadow var(--dur-base) var(--ease-out)',
        }}
      >
        {label && (
          <label style={{ display: 'block', font: 'var(--fw-medium) var(--fs-label)/1 var(--font-text)', color: 'var(--ink-400)', marginBottom: 6 }}>
            {label}
          </label>
        )}
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            background: 'transparent',
            font: 'var(--fw-medium) var(--fs-body)/1.6 var(--font-text)',
            color: 'var(--ink-900)',
            padding: 0,
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}
