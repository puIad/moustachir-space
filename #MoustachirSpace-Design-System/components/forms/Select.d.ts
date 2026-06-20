import * as React from 'react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Options as strings or {label,value}. */
  options?: Array<string | SelectOption>;
  placeholder?: string;
  /** Leading icon node, shown in a blue tinted chip. */
  leadingIcon?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Dropdown in the card field style, with optional leading icon chip. */
export function Select(props: SelectProps): JSX.Element;
