import * as React from 'react';

/**
 * Dashboard metric tile.
 */
export interface StatCardProps {
  label: string;
  /** Big metric value (e.g. "14", "4.2"). */
  value: React.ReactNode;
  /** Trailing unit / symbol (e.g. a ★). */
  unit?: React.ReactNode;
  /** Delta caption (e.g. "+3 vs last week"). */
  delta?: React.ReactNode;
  /** @default 'up' */
  deltaTone?: 'up' | 'down' | 'flat';
  /** Faint watermark glyph behind the number (e.g. a Phosphor <i/>). */
  watermark?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Dashboard metric tile.
 */
export function StatCard(props: StatCardProps): JSX.Element;
