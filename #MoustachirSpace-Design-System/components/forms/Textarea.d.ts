import * as React from 'react';

export interface TextareaProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  /** @default 4 */
  rows?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Multi-line note field in the TextField card style. */
export function Textarea(props: TextareaProps): JSX.Element;
