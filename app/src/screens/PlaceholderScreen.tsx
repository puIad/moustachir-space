import { useTranslation } from 'react-i18next';
import { Card, StatusPill } from '../design-system';
import { useFilters } from '../filters/FilterContext';
import { BRANCHES } from '../config/branches';

interface PlaceholderScreenProps {
  /** i18n nav key for the heading. */
  i18nKey: string;
  variant: 'analytics' | 'branch';
  /** Phosphor icon class, e.g. "ph-chart-pie-slice". */
  icon: string;
  /** Accent color (CSS value). Branch screens pass their branch color. */
  accent?: string;
  /** When true, the screen will be driven by is_sample data → show projection badge. */
  projection?: boolean;
}

/**
 * Titled placeholder for a not-yet-built screen. Confirms the route is wired,
 * the design system is applied, and the global filters are readable here.
 */
export function PlaceholderScreen({ i18nKey, variant, icon, accent = 'var(--blue-500)', projection = false }: PlaceholderScreenProps) {
  const { t } = useTranslation();
  const { filters, activeCount } = useFilters();

  const scope =
    filters.compare.length > 0
      ? filters.compare.map((k) => t(`nav.${BRANCHES.find((b) => b.key === k)?.i18nKey ?? k}`)).join(' · ')
      : filters.branch === 'all'
        ? t('branches.all')
        : t(`nav.${BRANCHES.find((b) => b.key === filters.branch)?.i18nKey ?? filters.branch}`);

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-lg)',
            background: `color-mix(in srgb, ${accent} 14%, white)`,
            color: accent,
            fontSize: 26,
            flex: '0 0 auto',
          }}
        >
          <i className={`ph-fill ${icon}`} aria-hidden="true" />
        </span>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, font: 'var(--text-h1)', color: 'var(--text-primary)' }}>{t(`nav.${i18nKey}`)}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <StatusPill status="scheduled" dot>{t('placeholder.comingSoon')}</StatusPill>
            {projection ? (
              <ProjectionBadge label={t('badge.projection')} />
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 10px', borderRadius: 'var(--radius-xs)', background: 'var(--green-50)', color: 'var(--green-500)', font: 'var(--fw-bold) var(--fs-micro)/1 var(--font-text)' }}>
                <i className="ph-fill ph-seal-check" aria-hidden="true" />
                {t('badge.real')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* body */}
      <Card style={{ borderTop: `3px solid ${accent}` }}>
        <p style={{ margin: 0, font: 'var(--text-body)', color: 'var(--text-secondary)', maxWidth: 640 }}>
          {variant === 'analytics' ? t('placeholder.analyticsBody') : t('placeholder.branchBody')}
        </p>

        {/* live filter readout — proves the global FilterContext reaches the screen */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
          <Readout icon="ph-buildings" label={t('filters.branch')} value={scope} />
          <Readout icon="ph-calendar-blank" label={t('filters.dateRange')} value={filters.dateFrom || filters.dateTo ? `${filters.dateFrom || '…'} → ${filters.dateTo || '…'}` : '—'} />
          <Readout icon="ph-stack" label={t('filters.service')} value={filters.service === 'all' ? t('filters.allServices') : filters.service} />
          <Readout icon="ph-user" label={t('filters.teamMember')} value={filters.teamMember === 'all' ? t('filters.allTeam') : filters.teamMember} />
          <Readout icon="ph-funnel" label={t('placeholder.filtersActive')} value={activeCount > 0 ? String(activeCount) : t('placeholder.none')} />
        </div>
      </Card>
    </div>
  );
}

function Readout({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', minWidth: 0 }}>
      <i className={`ph ${icon}`} style={{ fontSize: 18, color: 'var(--ink-400)' }} aria-hidden="true" />
      <div style={{ minWidth: 0 }}>
        <div style={{ font: 'var(--fw-medium) var(--fs-micro)/1 var(--font-text)', color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: 'var(--ls-caps)' }}>{label}</div>
        <div className="ms-mono" style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--ink-900)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{value}</div>
      </div>
    </div>
  );
}

function ProjectionBadge({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 10px', borderRadius: 'var(--radius-xs)', background: 'var(--orange-50)', color: 'var(--orange-600)', font: 'var(--fw-bold) var(--fs-micro)/1 var(--font-mono)' }}>
      <i className="ph-fill ph-flask" aria-hidden="true" />
      {label}
    </span>
  );
}
