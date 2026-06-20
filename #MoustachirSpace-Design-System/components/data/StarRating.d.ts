import * as React from 'react';

export interface StarRatingProps {
  /** Current rating. */
  value?: number;
  /** @default 5 */
  max?: number;
  /** Provide to make it interactive. */
  onChange?: (value: number) => void;
  /** Star size in px. @default 26 */
  size?: number;
  /** @default 'blue' */
  tone?: 'blue' | 'amber';
  style?: React.CSSProperties;
}

/** Electric-blue star rating, read-only or interactive. Needs Phosphor CSS. */
export function StarRating(props: StarRatingProps): JSX.Element;
