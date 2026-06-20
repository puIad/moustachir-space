/**
 * components/analytics.tsx — shared chrome for the Group-1 analytics screens.
 * ScreenHeader (icon + title + provenance), provenance badges, KPI grid + card,
 * section titles, chart grid, and the strategic-intelligence insight card.
 *
 * Provenance is a first-class citizen here: a flask PROJECTION badge wherever
 * is_sample data drives a number, a seal-check REAL badge otherwise.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { StatCard } from '../design-system';
import { useFilters } from '../filters/FilterContext';
import { branchLabel } from '../lib/labels';

/* ---- Loading + scope helpers --------------------------------------------- */

export function LoadingState() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: 320, gap: 12, color: 'var(--ink-400)' }}>
      <i className="ph ph-circle-notch" style={{ fontSize: 28, animation: 'ms-spin 0.9s linear infinite' }} aria-hidden="true" />
      <span style={{ font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-text)' }}>{t('analytics.loading')}</span>
    </div>
  );
}

/** Human label for the active branch scope (single / compare set / all). */
export function useScope(): string {
  const { t } = useTranslation();
  const { filters } = useFilters();
  if (filters.compare.length > 0) return filters.compare.map(branchLabel).join(' · ');
  if (filters.branch === 'all') return t('branches.all');
  return branchLabel(filters.branch);
}

/* ---- Provenance badges --------------------------------------------------- */

export function ProjectionBadge({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 10px', borderRadius: 'var(--radius-xs)', background: 'var(--orange-50)', color: 'var(--orange-600)', font: 'var(--fw-bold) var(--fs-micro)/1 var(--font-mono)' }}>
      <i className="ph-fill ph-flask" aria-hidden="true" />
      {label ?? t('badge.projection')}
    </span>
  );
}

export function RealBadge({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 10px', borderRadius: 'var(--radius-xs)', background: 'var(--green-50)', color: 'var(--green-500)', font: 'var(--fw-bold) var(--fs-micro)/1 var(--font-text)' }}>
      <i className="ph-fill ph-seal-check" aria-hidden="true" />
      {label ?? t('badge.real')}
    </span>
  );
}

/* ---- Screen header ------------------------------------------------------- */

export interface ScreenHeaderProps {
  icon: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  scope?: React.ReactNode;
  accent?: string;
  projection?: boolean;
  action?: React.ReactNode;
}

export function ScreenHeader({ icon, title, subtitle, scope, accent = 'var(--blue-500)', projection = false, action }: ScreenHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: `color-mix(in srgb, ${accent} 14%, white)`, color: accent, fontSize: 26, flex: '0 0 auto' }}>
        <i className={`ph-fill ${icon}`} aria-hidden="true" />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 style={{ margin: 0, font: 'var(--text-h1)', color: 'var(--text-primary)' }}>{title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 7, flexWrap: 'wrap' }}>
          {projection ? <ProjectionBadge /> : <RealBadge />}
          {scope && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-text)', color: 'var(--ink-500)' }}>
              <i className="ph ph-funnel-simple" aria-hidden="true" />
              {scope}
            </span>
          )}
          {subtitle && <span style={{ font: 'var(--fw-medium) var(--fs-sm)/1.3 var(--font-text)', color: 'var(--ink-400)' }}>{subtitle}</span>}
        </div>
      </div>
      {action && <div style={{ flex: '0 0 auto' }}>{action}</div>}
    </div>
  );
}

/* ---- KPI grid + card ----------------------------------------------------- */

export function KpiGrid({ children, min = 190 }: { children: React.ReactNode; min?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
      {children}
    </div>
  );
}

export interface KpiProps {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: 'up' | 'down' | 'flat';
  icon: string;
  accent?: string | null;
  /** Show the small projected marker (this number is is_sample-driven). */
  projected?: boolean;
}

export function Kpi({ label, value, unit, delta, deltaTone = 'up', icon, accent = null, projected = false }: KpiProps) {
  return (
    <div style={{ position: 'relative' }}>
      <StatCard
        label={label}
        value={value}
        unit={unit}
        delta={delta}
        deltaTone={deltaTone}
        accent={accent}
        watermark={<i className={`ph-fill ${icon}`} />}
      />
      {projected && (
        <span
          title="Donnée projetée (échantillon)"
          style={{ position: 'absolute', top: 10, right: 12, display: 'inline-flex', alignItems: 'center', gap: 4, height: 18, padding: '0 6px', borderRadius: 'var(--radius-xs)', background: 'var(--orange-50)', color: 'var(--orange-600)', font: '700 9px/1 var(--font-mono)', letterSpacing: '0.04em' }}
        >
          <i className="ph-fill ph-flask" aria-hidden="true" style={{ fontSize: 10 }} />
          PROJ
        </span>
      )}
    </div>
  );
}

/* ---- Section + chart grid ------------------------------------------------ */

export function SectionTitle({ icon, children, hint }: { icon?: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 14px' }}>
      {icon && <i className={`ph-fill ${icon}`} style={{ fontSize: 17, color: 'var(--ink-400)' }} aria-hidden="true" />}
      <h2 style={{ margin: 0, font: 'var(--fw-bold) var(--fs-h2)/1 var(--font-display)', letterSpacing: '-0.01em', color: 'var(--ink-900)' }}>{children}</h2>
      {hint && <span style={{ font: 'var(--fw-medium) var(--fs-sm)/1 var(--font-text)', color: 'var(--ink-400)' }}>{hint}</span>}
      <div style={{ flex: 1, height: 1, background: 'var(--line-100)', marginLeft: 6 }} />
    </div>
  );
}

export function ChartGrid({ children, min = 380 }: { children: React.ReactNode; min?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
      {children}
    </div>
  );
}

/* ---- Strategic intelligence / insight card ------------------------------- */

export type InsightTone = 'positive' | 'warning' | 'negative' | 'neutral';

const TONE: Record<InsightTone, { bg: string; fg: string; icon: string }> = {
  positive: { bg: 'var(--green-50)', fg: 'var(--green-500)', icon: 'ph-trend-up' },
  warning: { bg: 'var(--orange-50)', fg: 'var(--orange-600)', icon: 'ph-warning' },
  negative: { bg: 'var(--red-50)', fg: 'var(--red-500)', icon: 'ph-warning-octagon' },
  neutral: { bg: 'var(--surface-3)', fg: 'var(--ink-500)', icon: 'ph-lightbulb' },
};

export function InsightCard({ tone, title, children }: { tone: InsightTone; title: React.ReactNode; children: React.ReactNode }) {
  const c = TONE[tone];
  return (
    <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-card)', borderLeft: `3px solid ${c.fg}` }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: c.bg, color: c.fg, fontSize: 18, flex: '0 0 auto' }}>
        <i className={`ph-fill ${c.icon}`} aria-hidden="true" />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: 'var(--fw-bold) var(--fs-sm)/1.2 var(--font-text)', color: 'var(--ink-900)', marginBottom: 3 }}>{title}</div>
        <div style={{ font: 'var(--fw-medium) var(--fs-sm)/1.45 var(--font-text)', color: 'var(--ink-500)' }}>{children}</div>
      </div>
    </div>
  );
}
