import * as React from 'react';

export interface AppHeaderProps {
  /** @default 'title' */
  variant?: 'title' | 'greeting';
  /** Centered title (title variant). */
  title?: string;
  /** Small eyebrow above the name (greeting variant). @default 'Merhba,' */
  greeting?: string;
  /** Bold name (greeting variant). */
  name?: string;
  /** Leading node (e.g. a back IconButton). */
  leading?: React.ReactNode;
  /** Trailing node (e.g. a bell IconButton). */
  trailing?: React.ReactNode;
  /** Avatar node (greeting variant). */
  avatar?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Mobile top bar — centered title or greeting layout. */
export function AppHeader(props: AppHeaderProps): JSX.Element;
