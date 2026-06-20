/**
 * store/ui.ts — Zustand store for global UI / filter state.
 * ----------------------------------------------------------------------------
 * Holds the cross-screen FilterContext (branch / date range / service / team /
 * client), the active language, and the current Group-2 selection (branch +
 * entity). Screens read filters here and feed them to lib/kpis.ts filterDataset.
 *
 * State only — no data lives here (that's Dexie via repositories). Persisted to
 * localStorage so the chosen filters/language survive a reload.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BranchKey, ServiceLine, EntityName } from '@spec/entities';
import type { KpiFilters } from '@/lib/kpis';

export type Language = 'fr' | 'en';
export type BranchSelection = BranchKey | 'all';

export interface GlobalFilters {
  branchKey: BranchSelection;
  serviceLine: ServiceLine | 'all';
  salespersonId: string | 'all';
  clientId: string | 'all';
  /** Inclusive YYYY-MM bounds; null = unbounded. */
  from: string | null;
  to: string | null;
}

const DEFAULT_FILTERS: GlobalFilters = {
  branchKey: 'all',
  serviceLine: 'all',
  salespersonId: 'all',
  clientId: 'all',
  from: null,
  to: null,
};

export interface UiState {
  language: Language;
  filters: GlobalFilters;
  /** Group-2 workspace: which branch + entity table is open. */
  selectedBranch: BranchKey | null;
  selectedEntity: EntityName | null;

  setLanguage: (lang: Language) => void;
  setFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  resetFilters: () => void;
  selectBranch: (branch: BranchKey | null) => void;
  selectEntity: (entity: EntityName | null) => void;
  /** Project the active filters into the shape lib/kpis.ts expects. */
  toKpiFilters: () => KpiFilters;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      language: 'fr',
      filters: DEFAULT_FILTERS,
      selectedBranch: null,
      selectedEntity: null,

      setLanguage: (language) => set({ language }),
      setFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value } })),
      setDateRange: (from, to) => set((s) => ({ filters: { ...s.filters, from, to } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      selectBranch: (selectedBranch) => set({ selectedBranch }),
      selectEntity: (selectedEntity) => set({ selectedEntity }),

      toKpiFilters: () => {
        const f = get().filters;
        return {
          branchKey: f.branchKey,
          serviceLine: f.serviceLine,
          salespersonId: f.salespersonId,
          clientId: f.clientId,
          from: f.from ?? undefined,
          to: f.to ?? undefined,
        };
      },
    }),
    { name: 'moustachir-ui' },
  ),
);
