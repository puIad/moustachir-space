import * as React from 'react';

export interface StatusPillProps {
  /** @default 'progress' */
  status?: 'progress' | 'scheduled' | 'delayed' | 'done';
  /** Override the default label text. */
  children?: React.ReactNode;
  /** Leading status dot. @default true */
  dot?: boolean;
  style?: React.CSSProperties;
}

/** Compact status pill for mission/lead/feedback states. */
export function StatusPill(props: StatusPillProps): JSX.Element;
