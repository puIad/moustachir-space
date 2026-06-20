/**
 * Runtime branch + navigation config — derived from spec/taxonomy.md (LOCKED).
 * Branch colors mirror spec/taxonomy.md §3 and src/design-system/tokens/branches.css.
 * Resolve by `key` (= spec BranchKey), never by display string.
 */

export type BranchKey = 'consulting' | 'comptabilite' | 'communication' | 'academy' | 'management';

export interface BranchDef {
  key: BranchKey;
  /** i18n key under nav.* */
  i18nKey: string;
  /** Phosphor icon class suffix, e.g. "ph-briefcase". */
  icon: string;
  /** CSS var holding the branch color (tokens/branches.css). */
  colorVar: string;
  softVar: string;
}

/** The 5 canonical Group-2 branches (unassigned is a triage bucket, not a nav item). */
export const BRANCHES: BranchDef[] = [
  { key: 'consulting', i18nKey: 'consulting', icon: 'ph-briefcase', colorVar: 'var(--branch-consulting)', softVar: 'var(--branch-consulting-soft)' },
  { key: 'comptabilite', i18nKey: 'comptabilite', icon: 'ph-calculator', colorVar: 'var(--branch-comptabilite)', softVar: 'var(--branch-comptabilite-soft)' },
  { key: 'communication', i18nKey: 'communication', icon: 'ph-chat-centered-text', colorVar: 'var(--branch-communication)', softVar: 'var(--branch-communication-soft)' },
  { key: 'academy', i18nKey: 'academy', icon: 'ph-graduation-cap', colorVar: 'var(--branch-academy)', softVar: 'var(--branch-academy-soft)' },
  { key: 'management', i18nKey: 'management', icon: 'ph-buildings', colorVar: 'var(--branch-management)', softVar: 'var(--branch-management-soft)' },
];

export const branchByKey = (key: string): BranchDef | undefined => BRANCHES.find((b) => b.key === key);

export const branchColor = (key: string): string => branchByKey(key)?.colorVar ?? 'var(--blue-500)';

/** Group-1 analytics screens (in nav order). */
export interface AnalyticsScreenDef {
  key: string;
  /** route path under "/" */
  path: string;
  i18nKey: string;
  icon: string;
}

export const ANALYTICS_SCREENS: AnalyticsScreenDef[] = [
  { key: 'dashboard', path: '/', i18nKey: 'dashboard', icon: 'ph-chart-pie-slice' },
  { key: 'financial', path: '/financial', i18nKey: 'financial', icon: 'ph-chart-line-up' },
  { key: 'marketing', path: '/marketing', i18nKey: 'marketing', icon: 'ph-megaphone' },
  { key: 'commercial', path: '/commercial', i18nKey: 'commercial', icon: 'ph-handshake' },
  { key: 'clientFollowup', path: '/clients', i18nKey: 'clientFollowup', icon: 'ph-address-book' },
  { key: 'operational', path: '/operational', i18nKey: 'operational', icon: 'ph-gear-six' },
];

/** Branch route path (Group-2). */
export const branchPath = (key: BranchKey): string => `/branch/${key}`;

/** Data Manager route path (System). */
export const DATA_MANAGER_PATH = '/data-manager';

