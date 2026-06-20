import * as React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  /** Surface fill. @default 'white' */
  tone?: 'white' | 'tint' | 'sunken' | 'outline';
  /** Optional header title. */
  title?: React.ReactNode;
  /** Optional header action node (right-aligned). */
  action?: React.ReactNode;
  /** Inner padding in px. @default 16 */
  padding?: number;
  style?: React.CSSProperties;
}

/** Generic rounded surface container with optional title/action header. */
export function Card(props: CardProps): JSX.Element;
