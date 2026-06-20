/**
 * components/explorer/DataTable.tsx — generic, full-featured data table.
 *
 * Design: "Dense Command Interface" — 32px rows, monospace numbers, branch-color
 * accents on sort indicators, compact chrome. No library dependency.
 *
 * Props:
 *   columns    — ColDef<T>[] from entityMeta
 *   fetcher    — async fn: (q: TableQuery) => { rows: T[], total: number }
 *   branchHex  — branch accent color for sort/active states
 *   onRowClick — optional: opens detail drawer
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ColDef } from '../../lib/entityMeta';

/* ========================================================================== *
 *  Types
 * ========================================================================== */

export interface TableQuery {
  search: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
  columnFilters: Record<string, string>;
}

export interface TableResult<T> {
  rows: T[];
  total: number;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColDef<T>[];
  fetcher: (q: TableQuery) => Promise<TableResult<T>>;
  branchHex?: string;
  onRowClick?: (row: T) => void;
  /** Label shown above search bar (entity name). */
  entityLabel?: string;
  /** Allow branch-filter reset when changing entity. */
  resetKey?: string;
  refreshTrigger?: number;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

/* ========================================================================== *
 *  Helpers
 * ========================================================================== */

function cellValue<T>(col: ColDef<T>, row: T): string {
  const raw = row[col.key as keyof T];
  if (col.render) return col.render(raw, row);
  if (raw == null) return '—';
  return String(raw);
}

function exportCSV<T>(cols: ColDef<T>[], rows: T[], filename: string) {
  const visibleCols = cols.filter((c) => c.defaultVisible);
  const header = visibleCols.map((c) => `"${c.label}"`).join(',');
  const body = rows
    .map((r) => visibleCols.map((c) => `"${cellValue(c, r).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ========================================================================== *
 *  Sub-components
 * ========================================================================== */

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <i className="ph ph-arrows-down-up" style={{ opacity: 0.3, fontSize: 12 }} />;
  return (
    <i
      className={`ph ph-caret-${dir === 'asc' ? 'up' : 'down'}-bold`}
      style={{ fontSize: 11 }}
    />
  );
}

function ColumnFilter<T>({
  col,
  value,
  onChange,
}: {
  col: ColDef<T>;
  value: string;
  onChange: (v: string) => void;
}) {
  if (!col.filterable) return null;

  const base: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--ink-100)',
    font: '400 11px/1 var(--font-mono)',
    padding: '3px 6px',
    outline: 'none',
  };

  if (col.filterType === 'enum' && col.options) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} style={base}>
        <option value="">Tous</option>
        {col.options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={col.filterType === 'date' ? 'date' : col.filterType === 'number' ? 'number' : 'text'}
      placeholder="—"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={base}
    />
  );
}

/* ========================================================================== *
 *  Main component
 * ========================================================================== */

export function DataTable<T extends Record<string, unknown>>({
  columns,
  fetcher,
  branchHex = '#0ea5e9',
  onRowClick,
  entityLabel = 'Enregistrements',
  resetKey,
  refreshTrigger,
}: DataTableProps<T>) {
  /* --- state --- */
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState(columns[0]?.key ?? 'id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
    () => new Set(columns.filter((c) => c.defaultVisible).map((c) => c.key))
  );
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const colMenuRef = useRef<HTMLDivElement>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  /* Reset state when entity changes */
  useEffect(() => {
    setSearch('');
    setDebouncedSearch('');
    setColumnFilters({});
    setPage(1);
    setSortBy(columns[0]?.key ?? 'id');
    setSortDir('asc');
    setVisibleKeys(new Set(columns.filter((c) => c.defaultVisible).map((c) => c.key)));
    setSelectedId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  /* Fetch data */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcher({ search: debouncedSearch, sortBy, sortDir, page, pageSize, columnFilters })
      .then((res) => {
        if (!cancelled) { setRows(res.rows); setTotal(res.total); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetcher, debouncedSearch, sortBy, sortDir, page, pageSize, columnFilters, refreshTrigger]);

  /* Close column menu on outside click */
  useEffect(() => {
    if (!colMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setColMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [colMenuOpen]);

  /* --- handlers --- */
  const handleSort = useCallback((key: string) => {
    if (sortBy === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
    setPage(1);
  }, [sortBy]);

  const handleColFilter = useCallback((key: string, val: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (val) next[key] = val; else delete next[key];
      return next;
    });
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const handleExport = useCallback(async () => {
    const all = await fetcher({ search: debouncedSearch, sortBy, sortDir, page: 1, pageSize: 5000, columnFilters });
    exportCSV(columns.filter((c) => visibleKeys.has(c.key)), all.rows, `${entityLabel}.csv`);
  }, [fetcher, debouncedSearch, sortBy, sortDir, columnFilters, columns, visibleKeys, entityLabel]);

  const visibleCols = useMemo(() => columns.filter((c) => visibleKeys.has(c.key)), [columns, visibleKeys]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeFilters = Object.keys(columnFilters).length;

  /* --- styles --- */
  const s = {
    root: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      overflow: 'hidden',
      background: 'var(--surface-1)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)',
      '--focus-ring': `0 0 0 3px color-mix(in srgb, ${branchHex} 38%, transparent)`,
    } as React.CSSProperties,
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    } as React.CSSProperties,
    searchWrap: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xs)',
      padding: '0 10px',
      height: 32,
    } as React.CSSProperties,
    searchInput: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--ink-100)',
      font: '400 13px/1 var(--font-text)',
    } as React.CSSProperties,
    btn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 32,
      padding: '0 12px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border)',
      background: 'var(--surface-2)',
      color: 'var(--ink-200)',
      font: '500 12px/1 var(--font-text)',
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
      flexShrink: 0,
    } as React.CSSProperties,
    tableWrap: {
      flex: 1,
      overflow: 'auto',
    } as React.CSSProperties,
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: 12,
    } as React.CSSProperties,
    th: {
      position: 'sticky' as const,
      top: 0,
      background: 'var(--surface-2)',
      borderBottom: '1px solid var(--border)',
      padding: '6px 12px 4px',
      textAlign: 'left' as const,
      userSelect: 'none' as const,
      whiteSpace: 'nowrap' as const,
      zIndex: 2,
    } as React.CSSProperties,
    thInner: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      font: '600 11px/1 var(--font-text)',
      color: 'var(--ink-300)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
      cursor: 'pointer',
      marginBottom: 4,
    } as React.CSSProperties,
    filterCell: {
      padding: '2px 6px 4px',
    } as React.CSSProperties,
    td: {
      padding: '0 12px',
      height: 32,
      borderBottom: '1px solid var(--border-soft, rgba(255,255,255,0.04))',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
      maxWidth: 260,
      color: 'var(--ink-100)',
      font: '400 12px/1 var(--font-text)',
    } as React.CSSProperties,
    tdMono: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      textAlign: 'right' as const,
    } as React.CSSProperties,
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '8px 14px',
      borderTop: '1px solid var(--border)',
      flexShrink: 0,
    } as React.CSSProperties,
    pagBtn: (disabled: boolean, active = false, hovered = false) => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      borderRadius: 'var(--radius-xs)',
      border: `1px solid ${active || (hovered && !disabled) ? branchHex : 'var(--border)'}`,
      background: active ? `${branchHex}22` : 'var(--surface-2)',
      color: disabled ? 'var(--ink-400)' : active || (hovered && !disabled) ? branchHex : 'var(--ink-200)',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.15s ease',
    } as React.CSSProperties),
  };

  return (
    <div style={s.root}>
      {/* Toolbar */}
      <div style={s.toolbar}>
        <div
          style={{
            ...s.searchWrap,
            borderColor: isSearchFocused ? branchHex : 'var(--border)',
            boxShadow: isSearchFocused ? `0 0 0 3px color-mix(in srgb, ${branchHex} 38%, transparent)` : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <i className="ph ph-magnifying-glass" style={{ color: 'var(--ink-300)', fontSize: 14, flexShrink: 0 }} />
          <input
            style={s.searchInput}
            placeholder={`Rechercher dans ${entityLabel}…`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            aria-label="Recherche"
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-300)', padding: 2 }}>
              <i className="ph ph-x" style={{ fontSize: 12 }} />
            </button>
          )}
        </div>

        {/* Column toggle */}
        <div style={{ position: 'relative' }} ref={colMenuRef}>
          <button
            style={{
              ...s.btn,
              borderColor: hoveredBtn === 'cols' || colMenuOpen ? branchHex : 'var(--border)',
              color: hoveredBtn === 'cols' || colMenuOpen ? branchHex : 'var(--ink-200)',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setColMenuOpen((o) => !o)}
            onMouseEnter={() => setHoveredBtn('cols')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <i className="ph ph-columns" style={{ fontSize: 13 }} />
            Colonnes
          </button>
          {colMenuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 30,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '6px 0', minWidth: 180,
              boxShadow: 'var(--shadow-md)',
            }}>
              {columns.map((col) => (
                <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', cursor: 'pointer', color: 'var(--ink-200)', font: '400 12px/1 var(--font-text)', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={visibleKeys.has(col.key)}
                    onChange={() => setVisibleKeys((prev) => {
                      const next = new Set(prev);
                      next.has(col.key) ? next.delete(col.key) : next.add(col.key);
                      return next;
                    })}
                    style={{ accentColor: branchHex }}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <button
          style={{
            ...s.btn,
            borderColor: hoveredBtn === 'csv' ? branchHex : 'var(--border)',
            color: hoveredBtn === 'csv' ? branchHex : 'var(--ink-200)',
            transition: 'all 0.15s ease',
          }}
          onClick={handleExport}
          title="Exporter en CSV"
          onMouseEnter={() => setHoveredBtn('csv')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <i className="ph ph-export" style={{ fontSize: 13 }} />
          CSV
        </button>

        {/* Active filter count badge */}
        {activeFilters > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 8px', height: 24, borderRadius: 100, background: `${branchHex}22`, color: branchHex, font: '600 11px/1 var(--font-mono)', flexShrink: 0 }}>
            {activeFilters} filtre{activeFilters > 1 ? 's' : ''}
          </span>
        )}

        {/* Count */}
        <span style={{ color: 'var(--ink-300)', font: '400 11px/1 var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {total} résultat{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  style={{ ...s.th, minWidth: col.minWidth ?? 80, textAlign: col.align === 'right' ? 'right' : 'left' }}
                >
                  <div
                    style={{ ...s.thInner, justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start', color: sortBy === col.key ? branchHex : undefined }}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    {col.label}
                    {col.sortable !== false && (
                      <span style={{ color: sortBy === col.key ? branchHex : undefined }}>
                        <SortIcon active={sortBy === col.key} dir={sortDir} />
                      </span>
                    )}
                  </div>
                  <div style={s.filterCell}>
                    <ColumnFilter col={col} value={columnFilters[col.key] ?? ''} onChange={(v) => handleColFilter(col.key, v)} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleCols.length} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-300)', font: '400 12px/1 var(--font-text)' }}>
                  <i className="ph ph-circle-notch" style={{ animation: 'ms-spin 0.9s linear infinite', marginRight: 8 }} />
                  Chargement…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-400)', font: '400 12px/1 var(--font-text)' }}>
                  Aucun enregistrement trouvé.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const id = (row as Record<string, unknown>)['id'] as string | undefined;
                const isSelected = id != null && id === selectedId;
                return (
                  <tr
                    key={id ?? i}
                    onClick={() => {
                      if (id) setSelectedId(isSelected ? null : id);
                      onRowClick?.(row);
                    }}
                    style={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      background: isSelected ? `${branchHex}18` : undefined,
                      borderLeft: isSelected ? `3px solid ${branchHex}` : '3px solid transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-2)'; }}
                    onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                  >
                    {visibleCols.map((col) => {
                      const display = cellValue(col, row);
                      return (
                        <td
                          key={col.key}
                          style={{
                            ...s.td,
                            ...(col.align === 'right' ? s.tdMono : {}),
                            textAlign: col.align ?? 'left',
                          }}
                          title={display !== '—' ? display : undefined}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div style={s.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--ink-300)', font: '400 11px/1 var(--font-mono)' }}>Lignes :</span>
          {PAGE_SIZE_OPTIONS.map((ps) => (
            <button
              key={ps}
              onClick={() => handlePageSizeChange(ps)}
              onMouseEnter={() => setHoveredBtn(`ps-${ps}`)}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                ...s.pagBtn(false, pageSize === ps, hoveredBtn === `ps-${ps}`),
                font: '500 11px/1 var(--font-mono)',
                width: 'auto',
                padding: '0 8px',
              }}
            >
              {ps}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--ink-300)', font: '400 11px/1 var(--font-mono)' }}>
            Page {page} / {totalPages}
          </span>
          <button
            style={s.pagBtn(page <= 1, false, hoveredBtn === 'pag-first')}
            onClick={() => setPage(1)}
            disabled={page <= 1}
            title="Première page"
            onMouseEnter={() => setHoveredBtn('pag-first')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <i className="ph ph-caret-double-left" style={{ fontSize: 12 }} />
          </button>
          <button
            style={s.pagBtn(page <= 1, false, hoveredBtn === 'pag-prev')}
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
            title="Page précédente"
            onMouseEnter={() => setHoveredBtn('pag-prev')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <i className="ph ph-caret-left" style={{ fontSize: 12 }} />
          </button>
          <button
            style={s.pagBtn(page >= totalPages, false, hoveredBtn === 'pag-next')}
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            title="Page suivante"
            onMouseEnter={() => setHoveredBtn('pag-next')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <i className="ph ph-caret-right" style={{ fontSize: 12 }} />
          </button>
          <button
            style={s.pagBtn(page >= totalPages, false, hoveredBtn === 'pag-last')}
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            title="Dernière page"
            onMouseEnter={() => setHoveredBtn('pag-last')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <i className="ph ph-caret-double-right" style={{ fontSize: 12 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
