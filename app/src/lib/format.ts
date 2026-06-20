/**
 * lib/format.ts — number / currency formatting helpers.
 * ----------------------------------------------------------------------------
 * Currency is the Algerian Dinar, rendered `#,##0 "DA"` (roadmap convention) —
 * FR grouping (thin spaces), no decimals, the "DA" suffix (never "DZD").
 * Compact variants (K / M) are for chart axes and tight KPI watermarks.
 */

const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Plain integer with FR grouping: 10 729 000. */
export const formatNumber = (n: number | null | undefined): string => nf0.format(n ?? 0);

/** `#,##0 "DA"` — 10 729 000 DA. */
export const formatDA = (n: number | null | undefined): string =>
  `${nf0.format(Math.round(n ?? 0))} DA`;

/** Percentage with one decimal: 56,3 %. */
export const formatPct = (n: number | null | undefined, decimals = 1): string =>
  `${(decimals ? nf1 : nf0).format(n ?? 0)} %`;

/** Compact integer for axes: 1 451 → "1,5 K", 10 729 000 → "10,7 M". */
export function formatCompact(n: number | null | undefined): string {
  const v = n ?? 0;
  const a = Math.abs(v);
  if (a >= 1e6) return `${nf1.format(v / 1e6)} M`;
  if (a >= 1e4) return `${nf0.format(v / 1e3)} K`;
  return nf0.format(v);
}

/** Compact DA for chart axes / tooltips: "10,7 M DA". */
export const formatCompactDA = (n: number | null | undefined): string => `${formatCompact(n)} DA`;
