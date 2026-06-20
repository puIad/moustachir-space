import React from 'react';
import { useTranslation } from 'react-i18next';
import { BRANCHES, type BranchKey } from '../config/branches';
import { useFilters } from '../filters/FilterContext';

interface FilterBarProps {}

/** Service-line options (placeholder set; values map to spec ServiceLine in later steps). */
const SERVICE_OPTIONS = ['consulting_hourly', 'rentabilite_commission', 'com_web_dev', 'com_branding', 'com_digital', 'academy', 'idarati_admin'];

/** Real salesperson roster (14) — see spec/entities.ts §10. */
const TEAM = ['Abdelbasset', 'Belkacem Semmar', 'Dalel Moussaoui', 'Farid', 'Hadjer Raissi', 'Hadjira', 'Lina', 'Maroua Touri', 'Rival', 'Safir', 'Walid', 'Yacine', 'Younes Bahnas'];

/**
 * Global filter bar: branch selector (All / single / compare) + date range,
 * service, team member and client search. Non-functional placeholders are OK
 * at this step — the wiring into queries lands with the data layer.
 */
export function FilterBar({}: FilterBarProps) {
  const { t } = useTranslation();
  const { filters, setBranch, toggleCompare, patch, reset, activeCount } = useFilters();
  const [compareMode, setCompareMode] = React.useState(false);

  const onBranchClick = (key: BranchKey) => {
    if (compareMode) toggleCompare(key);
    else setBranch(key);
  };

  const branchSelected = (key: BranchKey) => (compareMode ? filters.compare.includes(key) : filters.branch === key);

  return (
    <div
      style={{
        position: 'sticky',
        top: 'var(--topbar-h)',
        minHeight: 'var(--filterbar-h)',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--divider)',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-6)',
        zIndex: 80,
      }}
    >
      {/* branch chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <BranchChip label={t('branches.all')} selected={!compareMode && filters.branch === 'all'} onClick={() => { setCompareMode(false); setBranch('all'); }} />
        {BRANCHES.map((b) => (
          <BranchChip key={b.key} label={t(`nav.${b.i18nKey}`)} color={b.colorVar} selected={branchSelected(b.key)} onClick={() => onBranchClick(b.key)} />
        ))}
        <button
          type="button"
          onClick={() => setCompareMode((m) => !m)}
          aria-pressed={compareMode}
          title={t('branches.compare')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            height: 30,
            padding: '0 12px',
            borderRadius: 'var(--radius-pill)',
            border: compareMode ? 'none' : '1px dashed var(--line-300)',
            background: compareMode ? 'var(--ink-900)' : 'transparent',
            color: compareMode ? '#fff' : 'var(--ink-500)',
            font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-text)',
            cursor: 'pointer',
          }}
        >
          <i className="ph ph-git-diff" aria-hidden="true" />
          {t('branches.compare')}
        </button>
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--line-200)' }} />

      {/* date range */}
      <DateInput value={filters.dateFrom} onChange={(v) => patch({ dateFrom: v })} aria={t('filters.from')} />
      <span style={{ color: 'var(--ink-400)', font: 'var(--text-label)' }}>–</span>
      <DateInput value={filters.dateTo} onChange={(v) => patch({ dateTo: v })} aria={t('filters.to')} />

      {/* service */}
      <NativeSelect value={filters.service} onChange={(v) => patch({ service: v })} ariaLabel={t('filters.service')}>
        <option value="all">{t('filters.allServices')}</option>
        {SERVICE_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </NativeSelect>

      {/* team member */}
      <NativeSelect value={filters.teamMember} onChange={(v) => patch({ teamMember: v })} ariaLabel={t('filters.teamMember')}>
        <option value="all">{t('filters.allTeam')}</option>
        {TEAM.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </NativeSelect>

      {/* client search */}
      <div style={{ position: 'relative', minWidth: 180, flex: '0 1 220px' }}>
        <i className="ph ph-magnifying-glass" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 15 }} aria-hidden="true" />
        <input
          type="text"
          value={filters.clientSearch}
          onChange={(e) => patch({ clientSearch: e.target.value })}
          placeholder={t('filters.searchClient')}
          aria-label={t('filters.client')}
          style={{
            width: '100%',
            height: 32,
            padding: '0 10px 0 30px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--line-200)',
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
            font: 'var(--fw-medium) var(--fs-sm)/1 var(--font-text)',
            outline: 'none',
          }}
        />
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => { reset(); setCompareMode(false); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 12px', borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--surface-3)', color: 'var(--ink-700)', font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-text)', cursor: 'pointer' }}
        >
          <i className="ph ph-arrow-counter-clockwise" aria-hidden="true" />
          {t('filters.reset')}
        </button>
      )}
    </div>
  );
}

function BranchChip({ label, color, selected, onClick }: { label: string; color?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 30,
        padding: '0 12px',
        borderRadius: 'var(--radius-pill)',
        border: 'none',
        background: selected ? (color ?? 'var(--blue-500)') : 'var(--surface-3)',
        color: selected ? '#fff' : 'var(--ink-700)',
        font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-text)',
        cursor: 'pointer',
        transition: 'background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)',
      }}
    >
      {color && <span style={{ width: 8, height: 8, borderRadius: '50%', background: selected ? 'rgba(255,255,255,0.9)' : color }} />}
      {label}
    </button>
  );
}

function DateInput({ value, onChange, aria }: { value: string; onChange: (v: string) => void; aria: string }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={aria}
      style={{
        height: 32,
        padding: '0 8px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--line-200)',
        background: 'var(--surface-2)',
        color: 'var(--text-primary)',
        font: 'var(--fw-medium) var(--fs-sm)/1 var(--font-text)',
        outline: 'none',
      }}
    />
  );
}

function NativeSelect({ value, onChange, ariaLabel, children }: { value: string; onChange: (v: string) => void; ariaLabel: string; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      style={{
        height: 32,
        padding: '0 28px 0 10px',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--line-200)',
        background: 'var(--surface-2)',
        color: 'var(--text-primary)',
        font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-text)',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </select>
  );
}
