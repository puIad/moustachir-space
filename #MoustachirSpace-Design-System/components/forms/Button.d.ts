import * as React from 'react';

/**
 * The signature MoustachirSpace action — a glossy electric-blue pill.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default 'primary' */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Stretch to fill container width. @default false */
  full?: boolean;
  /** Icon node rendered before the label. */
  leadingIcon?: React.ReactNode;
  /** Icon node rendered after the label. */
  trailingIcon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * The signature MoustachirSpace action — a glossy electric-blue pill.
 */
export function Button(props: ButtonProps): JSX.Element;
