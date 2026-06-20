import * as React from 'react';

export interface SearchFieldProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** Show a clear (×) button when there's a value. */
  onClear?: () => void;
  style?: React.CSSProperties;
}

/** Pill search input with leading magnifier. Needs Phosphor CSS loaded. */
export function SearchField(props: SearchFieldProps): JSX.Element;
