import { describe, it, expect, beforeEach } from 'vitest';

// zustand/persist resolves localStorage lazily; provide a memory shim for node.
const mem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
} as Storage;

const { useUiStore } = await import('@/store/ui');

describe('useUiStore', () => {
  beforeEach(() => useUiStore.getState().resetFilters());

  it('defaults to French and All branch', () => {
    const s = useUiStore.getState();
    expect(s.language).toBe('fr');
    expect(s.filters.branchKey).toBe('all');
  });

  it('setFilter updates a single facet', () => {
    useUiStore.getState().setFilter('branchKey', 'academy');
    expect(useUiStore.getState().filters.branchKey).toBe('academy');
  });

  it('setDateRange sets both bounds', () => {
    useUiStore.getState().setDateRange('2026-01', '2026-06');
    const f = useUiStore.getState().filters;
    expect([f.from, f.to]).toEqual(['2026-01', '2026-06']);
  });

  it('toKpiFilters maps null dates to undefined and passes facets through', () => {
    useUiStore.getState().setFilter('serviceLine', 'academy');
    const kf = useUiStore.getState().toKpiFilters();
    expect(kf.serviceLine).toBe('academy');
    expect(kf.from).toBeUndefined();
    expect(kf.to).toBeUndefined();
  });

  it('resetFilters restores defaults', () => {
    useUiStore.getState().setFilter('branchKey', 'consulting');
    useUiStore.getState().resetFilters();
    expect(useUiStore.getState().filters.branchKey).toBe('all');
  });
});
