import * as React from 'react';

/**
 * Mission / activity / lead list row.
 */
export interface ListRowProps {
  /** Leading icon node, shown in a tinted tile. */
  icon?: React.ReactNode;
  /** @default 'blue' */
  iconTone?: 'blue' | 'orange' | 'green' | 'ink';
  title: React.ReactNode;
  /** Usually a <StatusPill/>. */
  subtitle?: React.ReactNode;
  /** Small grey meta text (e.g. "#MC-0418"). */
  meta?: React.ReactNode;
  /** Trailing slot — a <ProgressRing/>, chevron, etc. */
  trailing?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Mission / activity / lead list row.
 */
export function ListRow(props: ListRowProps): JSX.Element;
