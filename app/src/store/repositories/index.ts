/**
 * store/repositories — typed CRUD + queries per entity.
 * ----------------------------------------------------------------------------
 * Screens never touch Dexie directly; they call a repository. Each repo wraps
 * one table with getById / create / update / remove (all persisted) and a
 * `list` that filters (equality map + arbitrary predicate), sorts, and paginates.
 *
 * Queries read the whole table into memory then filter/sort/slice — fine for the
 * prototype's row counts (≤ a few thousand) and lets `list` accept any predicate
 * and sort key without per-field Dexie indexes.
 */

import { db } from '@/store/db';
import type { EntityTable, Table } from 'dexie';
import type {
  Client, Lead, Interaction, Opportunity, Proposal, Sale, Payment, Expense,
  MarketingCampaign, Salesperson, Consultant, Project, Task, Feedback, AuditEvent,
} from '@spec/entities';

export interface ListQuery<T> {
  /** Exact-match filter: every key/value must equal the row's field. */
  where?: Partial<Record<keyof T, unknown>>;
  /** Arbitrary row predicate, ANDed with `where`. */
  predicate?: (row: T) => boolean;
  sortBy?: keyof T & string;
  sortDir?: 'asc' | 'desc';
  /** Page size; omit for all matching rows. */
  limit?: number;
  offset?: number;
}

export interface Page<T> {
  rows: T[];
  /** Total matching rows before pagination. */
  total: number;
}

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export interface Repository<T extends { id: string }> {
  table: EntityTable<T, 'id'>;
  list(query?: ListQuery<T>): Promise<Page<T>>;
  all(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  create(row: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
  count(): Promise<number>;
}

/** Build a repository over a Dexie EntityTable keyed on `id`. */
export function makeRepository<T extends { id: string }>(
  table: EntityTable<T, 'id'>,
): Repository<T> {
  // String-keyed view: every entity PK is a string, but Dexie's IDType<T,'id'>
  // can't be proven `string` for a generic T — narrow it once here.
  const tbl = table as unknown as Table<T, string>;
  return {
    table,

    async list(query: ListQuery<T> = {}): Promise<Page<T>> {
      let rows = await table.toArray();
      if (query.where) {
        const entries = Object.entries(query.where) as [keyof T, unknown][];
        rows = rows.filter((r) => entries.every(([k, v]) => r[k] === v));
      }
      if (query.predicate) rows = rows.filter(query.predicate);
      const total = rows.length;
      if (query.sortBy) {
        const dir = query.sortDir === 'desc' ? -1 : 1;
        const key = query.sortBy;
        rows = [...rows].sort((a, b) => compare(a[key], b[key]) * dir);
      }
      const offset = query.offset ?? 0;
      const end = query.limit != null ? offset + query.limit : undefined;
      rows = rows.slice(offset, end);
      return { rows, total };
    },

    all() {
      return table.toArray();
    },

    getById(id) {
      return tbl.get(id);
    },

    async create(row) {
      await tbl.add(row);
      return row;
    },

    async update(id, patch) {
      await tbl.update(id, patch as never);
      const updated = await tbl.get(id);
      if (!updated) throw new Error(`update: row ${id} not found in ${table.name}`);
      return updated;
    },

    async remove(id) {
      await tbl.delete(id);
    },

    count() {
      return table.count();
    },
  };
}

/* One repository per entity — the import surface screens use. */
export const clientsRepo = makeRepository<Client>(db.clients);
export const leadsRepo = makeRepository<Lead>(db.leads);
export const interactionsRepo = makeRepository<Interaction>(db.interactions);
export const opportunitiesRepo = makeRepository<Opportunity>(db.opportunities);
export const proposalsRepo = makeRepository<Proposal>(db.proposals);
export const salesRepo = makeRepository<Sale>(db.sales);
export const paymentsRepo = makeRepository<Payment>(db.payments);
export const expensesRepo = makeRepository<Expense>(db.expenses);
export const marketingCampaignsRepo = makeRepository<MarketingCampaign>(db.marketingCampaigns);
export const salespeopleRepo = makeRepository<Salesperson>(db.salespeople);
export const consultantsRepo = makeRepository<Consultant>(db.consultants);
export const projectsRepo = makeRepository<Project>(db.projects);
export const tasksRepo = makeRepository<Task>(db.tasks);
export const feedbackRepo = makeRepository<Feedback>(db.feedback);
export const auditEventsRepo = makeRepository<AuditEvent>(db.auditEvents);

/** Snapshot every business table into a kpis.ts Dataset (drops auditEvents). */
export async function loadDataset() {
  const [
    clients, leads, interactions, opportunities, proposals, sales, payments,
    expenses, marketingCampaigns, salespeople, consultants, projects, tasks, feedback,
  ] = await Promise.all([
    clientsRepo.all(), leadsRepo.all(), interactionsRepo.all(), opportunitiesRepo.all(),
    proposalsRepo.all(), salesRepo.all(), paymentsRepo.all(), expensesRepo.all(),
    marketingCampaignsRepo.all(), salespeopleRepo.all(), consultantsRepo.all(),
    projectsRepo.all(), tasksRepo.all(), feedbackRepo.all(),
  ]);
  return {
    clients, leads, interactions, opportunities, proposals, sales, payments,
    expenses, marketingCampaigns, salespeople, consultants, projects, tasks, feedback,
  };
}
