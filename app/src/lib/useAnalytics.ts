/**
 * lib/useAnalytics.ts — bridge the global FilterContext to lib/kpis.ts.
 * ----------------------------------------------------------------------------
 * Loads the full Dexie-backed Dataset ONCE (module-cached promise), then scopes
 * it per the active filters on every render (cheap, in-memory). Screens call
 * useAnalytics() and get back both the filtered Dataset and an unscoped-by-branch
 * Dataset (for branch-comparison views that must still see every branch).
 */

import { useEffect, useMemo, useState } from 'react';
import { loadDataset } from '@/store/repositories';
import { toDataset, filterDataset, type Dataset, type KpiFilters } from '@/lib/kpis';
import { useFilters } from '@/filters/FilterContext';
import type { FilterState } from '@/filters/FilterContext';
import type { BranchKey, ServiceLine } from '@spec/entities';

let _cache: Promise<Dataset> | null = null;
function loadFullDataset(): Promise<Dataset> {
  if (!_cache) _cache = loadDataset().then((d) => toDataset(d));
  return _cache;
}
/** Force a reload (after a reset-to-seed). */
export function invalidateDatasetCache(): void {
  _cache = null;
}

/** FilterContext state → the KpiFilters shape lib/kpis.ts expects. */
export function toKpiFilters(f: FilterState): KpiFilters {
  return {
    branchKey: f.branch as BranchKey | 'all',
    serviceLine: f.service === 'all' ? 'all' : (f.service as ServiceLine),
    salespersonId: f.teamMember === 'all' ? 'all' : f.teamMember,
    clientId: 'all',
    from: f.dateFrom || undefined,
    to: f.dateTo || undefined,
  };
}

/** Same as toKpiFilters but never scopes branch — for branch comparison panels. */
function toKpiFiltersNoBranch(f: FilterState): KpiFilters {
  return { ...toKpiFilters(f), branchKey: 'all' };
}

export interface AnalyticsData {
  ready: boolean;
  /** Fully scoped to the active filters (branch + date + service + team). */
  ds: Dataset;
  /** Scoped by everything EXCEPT branch — feed branch-comparison charts. */
  dsAllBranches: Dataset;
  /** The raw filter state (for compare set, scope label, etc.). */
  filters: FilterState;
  kpiFilters: KpiFilters;
}

const EMPTY = toDataset({});

export function useAnalytics(): AnalyticsData {
  const { filters } = useFilters();
  const [full, setFull] = useState<Dataset | null>(null);

  useEffect(() => {
    let alive = true;
    loadFullDataset().then((d) => { if (alive) setFull(d); });
    return () => { alive = false; };
  }, []);

  const kpiFilters = useMemo(() => toKpiFilters(filters), [filters]);

  const ds = useMemo(
    () => (full ? filterDataset(full, kpiFilters) : EMPTY),
    [full, kpiFilters],
  );
  const dsAllBranches = useMemo(
    () => (full ? filterDataset(full, toKpiFiltersNoBranch(filters)) : EMPTY),
    [full, filters],
  );

  return { ready: full != null, ds, dsAllBranches, filters, kpiFilters };
}

/** True if any row in the dataset is a projected/sample row (drives the badge). */
export function hasSampleData(ds: Dataset): boolean {
  return (
    ds.sales.some((s) => s.isSample) ||
    ds.expenses.length > 0 ||
    ds.marketingCampaigns.some((c) => c.isSample) ||
    ds.feedback.some((f) => f.isSample)
  );
}
