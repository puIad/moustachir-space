import React from 'react';

export type RingTone = 'blue' | 'orange' | 'green' | 'red' | 'ink';

export interface ProgressRingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  value?: number;
  size?: number;
  thickness?: number;
  tone?: RingTone;
  showLabel?: boolean;
  style?: React.CSSProperties;
}

/** Circular progress ring with a centred percentage. */
export function ProgressRing({
  value = 0,
  size = 44,
  thickness = 5,
  tone = 'blue',
  showLabel = true,
  style = {},
  ...rest
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  const tones: Record<RingTone, string> = {
    blue: 'var(--blue-500)',
    orange: 'var(--orange-500)',
    green: 'var(--green-500)',
    red: 'var(--red-500)',
    ink: 'var(--ink-400)',
  };
  const stroke = tones[tone] || tones.blue;

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto', ...style }} {...rest}>
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-200)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset var(--dur-slow) var(--ease-out)' }}
        />
      </svg>
      {showLabel && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: `var(--fw-bold) ${Math.round(size * 0.26)}px/1 var(--font-text)`,
            color: 'var(--ink-900)',
          }}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}
