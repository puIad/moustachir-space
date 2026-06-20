import * as React from 'react';

export interface SegmentedOption {
  label: string;
  value: string;
}

export interface SegmentedControlProps {
  /** 2–4 short options, strings or {label,value}. */
  options: Array<string | SegmentedOption>;
  value: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}

/** Pill segmented control with a sliding glossy-blue thumb. */
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
