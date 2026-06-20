import * as React from 'react';

export interface ProgressRingProps {
  /** 0–100. */
  value: number;
  /** Diameter in px. @default 44 */
  size?: number;
  /** Arc width in px. @default 5 */
  thickness?: number;
  /** @default 'blue' */
  tone?: 'blue' | 'orange' | 'green' | 'red' | 'ink';
  /** Show the centred % label. @default true */
  showLabel?: boolean;
  style?: React.CSSProperties;
}

/** Circular percentage ring for mission progress. */
export function ProgressRing(props: ProgressRingProps): JSX.Element;
