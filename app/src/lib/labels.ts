/**
 * lib/labels.ts — display labels + chart hex colors for branches, services,
 * channels. Hexes mirror design-system/tokens (branches.css, colors.css) so
 * Chart.js canvases (which can't read CSS vars) match the rest of the UI.
 * Resolve everything by key, never by display string (spec/taxonomy.md).
 */

import type { BranchKey, ServiceLine, Channel } from '@spec/entities';

/* ---- Branch -------------------------------------------------------------- */

export const BRANCH_HEX: Record<BranchKey, string> = {
  consulting: '#0ea5e9',
  comptabilite: '#22c55e',
  communication: '#ec4899',
  academy: '#f59e0b',
  management: '#8b5cf6',
  unassigned: '#64748b',
};

export const BRANCH_LABEL: Record<BranchKey, string> = {
  consulting: 'Consulting',
  comptabilite: 'Comptabilité',
  communication: 'Communication',
  academy: 'Academy',
  management: 'Management',
  unassigned: 'Non assigné',
};

export const branchHex = (key: string): string =>
  BRANCH_HEX[key as BranchKey] ?? BRANCH_HEX.unassigned;
export const branchLabel = (key: string): string =>
  BRANCH_LABEL[key as BranchKey] ?? key;

/** The five nav branches, in canonical order (excludes the unassigned bucket). */
export const NAV_BRANCHES: BranchKey[] = [
  'consulting',
  'comptabilite',
  'communication',
  'academy',
  'management',
];

/* ---- Service line -------------------------------------------------------- */

export const SERVICE_LABEL: Record<ServiceLine, string> = {
  consulting_hourly: 'Consulting (horaire)',
  consulting_package: 'Consulting (forfait)',
  compta_admin: 'Compta admin',
  rentabilite_commission: 'Rentabilité',
  com_branding: 'Branding',
  com_digital: 'Digital',
  com_web_dev: 'Web & Dev',
  academy: 'Academy',
  idarati_admin: 'Idarati',
  unknown: 'Autre',
};

/** Service → owning-branch color (so a service series matches its branch hue). */
const SERVICE_BRANCH: Record<ServiceLine, BranchKey> = {
  consulting_hourly: 'consulting',
  consulting_package: 'consulting',
  compta_admin: 'comptabilite',
  rentabilite_commission: 'comptabilite',
  com_branding: 'communication',
  com_digital: 'communication',
  com_web_dev: 'communication',
  academy: 'academy',
  idarati_admin: 'management',
  unknown: 'unassigned',
};

export const serviceLabel = (key: string): string =>
  SERVICE_LABEL[key as ServiceLine] ?? key;
export const serviceHex = (key: string): string =>
  BRANCH_HEX[SERVICE_BRANCH[key as ServiceLine] ?? 'unassigned'];

/* ---- Channel ------------------------------------------------------------- */

export const CHANNEL_LABEL: Record<Channel, string> = {
  'Campagne Marketing': 'Campagne Marketing',
  'Prospection Classique': 'Prospection',
  Website: 'Website',
  'Événementiel': 'Événementiel',
};

export const channelLabel = (key: string): string =>
  CHANNEL_LABEL[key as Channel] ?? key;

/* ---- Generic categorical palette (cost categories, industries, …) -------- */

export const SERIES_PALETTE = [
  '#0074ff', '#0ea5e9', '#22c55e', '#ec4899', '#f59e0b',
  '#8b5cf6', '#f5781f', '#1fb255', '#64748b', '#3a8bff',
];

export const seriesColor = (i: number): string => SERIES_PALETTE[i % SERIES_PALETTE.length];
