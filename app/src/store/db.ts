/**
 * store/db.ts — Dexie (IndexedDB) database, one table per entity.
 * ----------------------------------------------------------------------------
 * Schema + indexes follow spec/seed-schema.md §4. Row shapes are the interfaces
 * in spec/entities.ts. The foundry seed (app/src/seed/seed.json) is bulk-imported
 * on first load by store/seed.ts; repositories (store/repositories) do all CRUD.
 *
 * `_meta` is a platform table (key/value) that records which seed schemaVersion
 * is currently loaded so re-seeding stays idempotent across reloads.
 */

import Dexie, { type EntityTable } from 'dexie';
import type {
  Client, Lead, Interaction, Opportunity, Proposal, Sale, Payment, Expense,
  MarketingCampaign, Salesperson, Consultant, Project, Task, Feedback, AuditEvent,
} from '@spec/entities';

export interface MetaRow {
  key: string;
  value: string | number;
}

/** Bump alongside seed.meta.schemaVersion only when the table set/index shape changes. */
export const DB_NAME = 'moustachir-bi';

export class MoustachirDB extends Dexie {
  clients!: EntityTable<Client, 'id'>;
  leads!: EntityTable<Lead, 'id'>;
  interactions!: EntityTable<Interaction, 'id'>;
  opportunities!: EntityTable<Opportunity, 'id'>;
  proposals!: EntityTable<Proposal, 'id'>;
  sales!: EntityTable<Sale, 'id'>;
  payments!: EntityTable<Payment, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  marketingCampaigns!: EntityTable<MarketingCampaign, 'id'>;
  salespeople!: EntityTable<Salesperson, 'id'>;
  consultants!: EntityTable<Consultant, 'id'>;
  projects!: EntityTable<Project, 'id'>;
  tasks!: EntityTable<Task, 'id'>;
  feedback!: EntityTable<Feedback, 'id'>;
  auditEvents!: EntityTable<AuditEvent, 'id'>;
  _meta!: EntityTable<MetaRow, 'key'>;

  constructor() {
    super(DB_NAME);
    // Index strings: PK first, then the indexed fields from seed-schema.md §4.
    this.version(1).stores({
      clients: 'id, branchKey, serviceLine, responsibleSalespersonId, type, churnRiskScore',
      leads: 'id, clientId, branchKey, source, status, assignedSalespersonId',
      interactions: 'id, clientId, salespersonId, type, date',
      opportunities: 'id, clientId, salespersonId, branchKey, stage',
      proposals: 'id, opportunityId, clientId, status, version',
      sales: 'id, clientId, branchKey, serviceLine, salespersonId, date',
      payments: 'id, saleId, clientId, status, dueDate',
      expenses: 'id, branchKey, category, date',
      marketingCampaigns: 'id, channel, platform, startDate',
      salespeople: 'id, branchKey, status',
      consultants: 'id, seniorityLevel, availabilityStatus, status',
      projects: 'id, clientId, branchKey, serviceLine, status',
      tasks: 'id, projectId, employeeId, kind, status, priority',
      feedback: 'id, clientId, source, type, resolutionStatus, date',
      auditEvents: 'id, entity, entityId, timestamp',
      _meta: 'key',
    });
  }
}

/** Singleton — every repository and the seeder share this instance. */
export const db = new MoustachirDB();

/** seed.json entity keys ↔ Dexie tables, in FK-safe import order. */
export const ENTITY_TABLES = [
  'salespeople', 'clients', 'leads', 'interactions', 'opportunities', 'proposals',
  'consultants', 'projects', 'sales', 'payments', 'expenses', 'marketingCampaigns',
  'tasks', 'feedback', 'auditEvents',
] as const;

export type EntityTableName = (typeof ENTITY_TABLES)[number];
