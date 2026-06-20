/**
 * store/seed.ts — first-load seeding + reset from app/src/seed/seed.json.
 * ----------------------------------------------------------------------------
 * On boot: if the DB is empty OR the loaded seed schemaVersion is older than the
 * bundled one, bulk-import every entity array. Versioned so re-seeding is safe
 * and idempotent. resetToSeed() wipes user mutations and re-imports.
 */

import seedJson from '@/seed/seed.json';
import { db, ENTITY_TABLES, type EntityTableName } from '@/store/db';

interface SeedMeta {
  schemaVersion: number;
  seedVersion: string;
  counts: Record<string, number>;
}
const seed = seedJson as unknown as Record<string, unknown[]> & { meta: SeedMeta };

const META_KEY = 'seedSchemaVersion';

async function loadedSchemaVersion(): Promise<number | null> {
  const row = await db._meta.get(META_KEY);
  return row ? Number(row.value) : null;
}

/** Bulk-import all entity arrays, replacing existing rows. */
async function importAll(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const name of ENTITY_TABLES) {
      const rows = (seed[name] as unknown[]) ?? [];
      await db.table(name).clear();
      if (rows.length) await db.table(name).bulkAdd(rows as never[]);
    }
    await db._meta.put({ key: META_KEY, value: seed.meta.schemaVersion });
  });
}

export interface SeedResult {
  /** true if rows were (re)imported this call; false if the DB was already current. */
  seeded: boolean;
  schemaVersion: number;
}

/**
 * Seed once. No-op when the bundled schemaVersion is already loaded and the DB
 * holds rows. Call from app bootstrap before rendering data screens.
 */
export async function seedIfNeeded(): Promise<SeedResult> {
  if (!db.isOpen()) await db.open();
  const loaded = await loadedSchemaVersion();
  const clientCount = await db.clients.count();
  const stale = loaded === null || loaded < seed.meta.schemaVersion || clientCount === 0;
  if (stale) {
    await importAll();
    return { seeded: true, schemaVersion: seed.meta.schemaVersion };
  }
  return { seeded: false, schemaVersion: seed.meta.schemaVersion };
}

/** Wipe all tables and re-import from seed.json (the dev "Reset data" action). */
export async function resetToSeed(): Promise<SeedResult> {
  if (!db.isOpen()) await db.open();
  await importAll();
  return { seeded: true, schemaVersion: seed.meta.schemaVersion };
}

export interface SeedStatus {
  seeded: boolean;
  schemaVersion: number | null;
  seedVersion: string;
  totalRows: number;
  byTable: Record<EntityTableName, number>;
}

/** Snapshot for the dev "Data status" indicator. */
export async function getSeedStatus(): Promise<SeedStatus> {
  if (!db.isOpen()) await db.open();
  const byTable = {} as Record<EntityTableName, number>;
  let totalRows = 0;
  for (const name of ENTITY_TABLES) {
    const c = await db.table(name).count();
    byTable[name] = c;
    totalRows += c;
  }
  const schemaVersion = await loadedSchemaVersion();
  return {
    seeded: totalRows > 0 && schemaVersion !== null,
    schemaVersion,
    seedVersion: seed.meta.seedVersion,
    totalRows,
    byTable,
  };
}
