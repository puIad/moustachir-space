import * as React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon node (e.g. a Phosphor `<i className="ph ph-bell" />`). */
  children: React.ReactNode;
  /** @default 'plain' */
  variant?: 'plain' | 'tint' | 'solid' | 'ghost';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Corner style. @default 'full' */
  rounded?: 'full' | 'square';
  /** Show a small blue notification dot. @default false */
  badge?: boolean;
  /** Accessible label — required for icon-only buttons. */
  ariaLabel?: string;
}

/** Icon-only button: nav actions, bell, back arrow, field affordances. */
export function IconButton(props: IconButtonProps): JSX.Element;
