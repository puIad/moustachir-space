import * as React from 'react';

export interface ChipProps {
  children: React.ReactNode;
  /** Selected state — solid fill. @default false */
  selected?: boolean;
  onToggle?: (next: boolean) => void;
  /** Fill colour when selected. @default 'blue' */
  tone?: 'blue' | 'orange' | 'green' | 'ink';
  leadingIcon?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Toggleable chip for multi-select tags (feedback tags, filters). */
export function Chip(props: ChipProps): JSX.Element;
