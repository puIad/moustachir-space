import * as React from 'react';

export interface NavItem {
  key: string;
  /** Icon node (idle). */
  icon: React.ReactNode;
  /** Optional active-state icon (e.g. a fill weight). */
  iconActive?: React.ReactNode;
  label?: string;
}

/**
 * Bottom tab bar with a centre raised electric-blue FAB.
 */
export interface BottomNavProps {
  /** Up to 4 items — split evenly to flank the centre FAB. */
  items: NavItem[];
  /** Active item key. */
  active?: string;
  onSelect?: (key: string) => void;
  onFab?: () => void;
  /** Centre FAB icon (defaults to a plus). */
  fabIcon?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Bottom tab bar with a centre raised electric-blue FAB.
 */
export function BottomNav(props: BottomNavProps): JSX.Element;
