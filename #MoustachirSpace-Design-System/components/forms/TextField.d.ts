import * as React from 'react';

/**
 * Floating-label card field — the standard MoustachirSpace input.
 */
export interface TextFieldProps {
  /** Small grey label shown above the value. */
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** @default 'text' */
  type?: string;
  /** Trailing affordance node (e.g. password eye, chevron). */
  trailingIcon?: React.ReactNode;
  /** Makes the trailing icon an interactive button. */
  onTrailingClick?: () => void;
  /** Error message — switches the field to the red error treatment. */
  error?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

/**
 * Floating-label card field — the standard MoustachirSpace input.
 */
export function TextField(props: TextFieldProps): JSX.Element;
