import React from 'react';
import type { BranchKey } from '../config/branches';

/**
 * Global filter state shared by every screen (analytics + branch workspaces).
 * Step 1 wires the UI; downstream steps consume these values to scope queries.
 */
export interface FilterState {
  /** Primary branch scope. 'all' = every branch (reconciles to real KPI anchors). */
  branch: 'all' | BranchKey;
  /** Optional compare set (when comparing several branches side by side). */
  compare: BranchKey[];
  dateFrom: string;
  dateTo: string;
  /** Service line key, or 'all'. */
  service: string;
  /** Team member id, or 'all'. */
  teamMember: string;
  clientSearch: string;
}

export const DEFAULT_FILTERS: FilterState = {
  branch: 'all',
  compare: [],
  dateFrom: '',
  dateTo: '',
  service: 'all',
  teamMember: 'all',
  clientSearch: '',
};

interface FilterContextValue {
  filters: FilterState;
  setBranch: (branch: 'all' | BranchKey) => void;
  toggleCompare: (branch: BranchKey) => void;
  patch: (partial: Partial<FilterState>) => void;
  reset: () => void;
  /** Count of non-default filters (excludes the always-present branch selector). */
  activeCount: number;
}

const FilterContext = React.createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);

  const setBranch = React.useCallback((branch: 'all' | BranchKey) => {
    setFilters((f) => ({ ...f, branch, compare: [] }));
  }, []);

  const toggleCompare = React.useCallback((branch: BranchKey) => {
    setFilters((f) => {
      const has = f.compare.includes(branch);
      return { ...f, compare: has ? f.compare.filter((b) => b !== branch) : [...f.compare, branch] };
    });
  }, []);

  const patch = React.useCallback((partial: Partial<FilterState>) => {
    setFilters((f) => ({ ...f, ...partial }));
  }, []);

  const reset = React.useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeCount =
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.service !== 'all' ? 1 : 0) +
    (filters.teamMember !== 'all' ? 1 : 0) +
    (filters.clientSearch.trim() ? 1 : 0) +
    (filters.compare.length ? 1 : 0);

  const value: FilterContextValue = { filters, setBranch, toggleCompare, patch, reset, activeCount };
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = React.useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within <FilterProvider>');
  return ctx;
}
