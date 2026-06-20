import React from 'react';

export type StatusKind = 'progress' | 'scheduled' | 'delayed' | 'done';

const STATUS: Record<StatusKind, { fg: string; bg: string; label: string }> = {
  progress: { fg: 'var(--status-progress)', bg: 'var(--status-progress-bg)', label: 'In Progress' },
  scheduled: { fg: 'var(--status-scheduled)', bg: 'var(--status-scheduled-bg)', label: 'Scheduled' },
  delayed: { fg: 'var(--status-delayed)', bg: 'var(--status-delayed-bg)', label: 'Delayed' },
  done: { fg: 'var(--status-done)', bg: 'var(--status-done-bg)', label: 'Completed' },
};

export interface StatusPillProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> {
  status?: StatusKind;
  children?: React.ReactNode;
  dot?: boolean;
  style?: React.CSSProperties;
}

/** Status pill for missions / leads / feedback. */
export function StatusPill({ status = 'progress', children, dot = true, style = {}, ...rest }: StatusPillProps) {
  const s = STATUS[status] || STATUS.progress;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 24,
        padding: '0 10px',
        borderRadius: 'var(--radius-xs)',
        background: s.bg,
        color: s.fg,
        font: 'var(--fw-bold) var(--fs-micro)/1 var(--font-text)',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '999px', background: 'currentColor' }} />}
      {children || s.label}
    </span>
  );
}
