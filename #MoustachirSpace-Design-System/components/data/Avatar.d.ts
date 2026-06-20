import * as React from 'react';

export interface AvatarProps {
  /** Image URL; falls back to initials when absent. */
  src?: string | null;
  /** Full name — used for initials + alt text. */
  name?: string;
  /** Diameter in px. @default 44 */
  size?: number;
  /** Electric-blue focus ring. @default false */
  ring?: boolean;
  style?: React.CSSProperties;
}

/** Circular avatar with initials fallback. */
export function Avatar(props: AvatarProps): JSX.Element;
