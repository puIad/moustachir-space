import React from 'react';

const STATUS = {
  progress: { fg: 'var(--status-progress)', bg: 'var(--status-progress-bg)', label: 'In Progress' },
  scheduled: { fg: 'var(--status-scheduled)', bg: 'var(--status-scheduled-bg)', label: 'Scheduled' },
  delayed: { fg: 'var(--status-delayed)', bg: 'var(--status-delayed-bg)', label: 'Delayed' },
  done: { fg: 'var(--status-done)', bg: 'var(--status-done-bg)', label: 'Completed' },
};

/**
 * Status pill for missions / leads / feedback. Pass a known `status`
 * (progress|scheduled|delayed|done) or override children + tone.
 */
export function StatusPill({
  status = 'progress',
  children,
  dot = true,
  style = {},
  ...rest
}) {
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
