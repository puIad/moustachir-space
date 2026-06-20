/**
 * components/explorer/EntitySidebar.tsx — secondary sidebar listing entities
 * for the selected branch with row counts.
 */

import { useEffect, useState } from 'react';
import type { BranchKey } from '@spec/entities';
import { BRANCH_ENTITIES, ENTITY_ICONS, entityDisplayName } from '../../lib/entityMeta';
import type { EntityKey } from '../../lib/entityMeta';
import { db } from '../../store/db';
import { branchHex } from '../../lib/labels';

interface EntitySidebarProps {
  branchKey: BranchKey;
  selected: EntityKey | null;
  onSelect: (key: EntityKey) => void;
}

/** Fetch entity row counts from Dexie (approximate). */
async function fetchCounts(branchKey: BranchKey): Promise<Record<EntityKey, number>> {
  const entities = BRANCH_ENTITIES[branchKey] ?? [];
  const entries = await Promise.all(
    entities.map(async (key) => {
      try {
        const tbl = (db as unknown as Record<string, { count: () => Promise<number> }>)[key];
        const count = tbl ? await tbl.count() : 0;
        return [key, count] as [EntityKey, number];
      } catch {
        return [key, 0] as [EntityKey, number];
      }
    })
  );
  return Object.fromEntries(entries) as Record<EntityKey, number>;
}

export function EntitySidebar({ branchKey, selected, onSelect }: EntitySidebarProps) {
  const entities = BRANCH_ENTITIES[branchKey] ?? [];
  const accent = branchHex(branchKey);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCounts(branchKey).then(setCounts);
  }, [branchKey]);

  return (
    <nav
      aria-label="Entités de la branche"
      style={{
        width: 200,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--surface-1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '8px 6px',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '2px 6px 8px', font: '600 10px/1 var(--font-text)', color: 'var(--ink-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Entités
      </div>
      {entities.map((key) => {
        const isActive = key === selected;
        const count = counts[key] ?? 0;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 10px',
              borderRadius: 'var(--radius-xs)',
              background: isActive ? `${accent}18` : 'transparent',
              border: 'none',
              borderLeft: `3px solid ${isActive ? accent : 'transparent'}`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
            }}
            onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = `${accent}0d`; }}
            onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <i
              className={`ph ph-${ENTITY_ICONS[key].replace('ph-', '')}`}
              style={{ fontSize: 15, color: isActive ? accent : 'var(--ink-300)', flexShrink: 0 }}
            />
            <span style={{ flex: 1, font: `${isActive ? '600' : '400'} 12px/1.2 var(--font-text)`, color: isActive ? 'var(--ink-100)' : 'var(--ink-200)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entityDisplayName(key, branchKey)}
            </span>
            {count > 0 && (
              <span style={{
                padding: '1px 6px',
                borderRadius: 100,
                background: isActive ? `${accent}30` : 'var(--surface-3)',
                color: isActive ? accent : 'var(--ink-400)',
                font: '600 10px/1.4 var(--font-mono)',
                flexShrink: 0,
              }}>
                {count > 999 ? `${Math.floor(count / 1000)}k` : count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
