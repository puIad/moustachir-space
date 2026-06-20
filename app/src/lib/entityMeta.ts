/**
 * lib/entityMeta.ts — entity config, column definitions, and branch ownership.
 * Derived from spec/taxonomy.md §4 (entity ownership matrix).
 * Every DataTable, sidebar, and detail drawer imports from here.
 */

import type { BranchKey } from '@spec/entities';
import { formatDA, formatNumber, formatPct } from './format';

/* ========================================================================== *
 *  Column definition
 * ========================================================================== */

export type FilterType = 'text' | 'enum' | 'date' | 'number';

export interface ColDef<T = Record<string, unknown>> {
  key: keyof T & string;
  label: string;
  defaultVisible: boolean;
  sortable: boolean;
  filterable: boolean;
  filterType: FilterType;
  /** Enum options for dropdown filter. */
  options?: string[];
  /** Custom cell renderer — returns a string for display (and CSV). */
  render?: (val: unknown, row: T) => string;
  /** Right-align numbers/money. */
  align?: 'left' | 'right' | 'center';
  minWidth?: number;
}

/** Canonical entity keys matching Dexie table names and spec/entities.ts. */
export type EntityKey =
  | 'clients' | 'leads' | 'interactions' | 'opportunities' | 'proposals'
  | 'sales' | 'payments' | 'expenses' | 'marketingCampaigns' | 'salespeople'
  | 'consultants' | 'projects' | 'tasks' | 'feedback' | 'auditEvents';

/* ========================================================================== *
 *  Branch → entity ownership (spec/taxonomy.md §4)
 * ========================================================================== */

export const BRANCH_ENTITIES: Record<BranchKey, EntityKey[]> = {
  consulting: [
    'clients', 'leads', 'interactions', 'opportunities', 'proposals',
    'sales', 'payments', 'consultants', 'projects', 'tasks', 'feedback',
  ],
  comptabilite: [
    'clients', 'leads', 'interactions', 'opportunities', 'proposals',
    'sales', 'payments', 'expenses', 'tasks', 'feedback',
  ],
  communication: [
    'clients', 'leads', 'interactions', 'opportunities', 'proposals',
    'sales', 'payments', 'marketingCampaigns', 'projects', 'tasks', 'feedback',
  ],
  academy: [
    'clients', 'leads', 'interactions', 'opportunities',
    'sales', 'payments', 'projects', 'tasks', 'feedback',
  ],
  management: [
    'clients', 'leads', 'interactions', 'tasks', 'salespeople', 'expenses', 'feedback',
  ],
  unassigned: ['clients', 'leads'],
};

/* Branch-specific display name aliases (spec/taxonomy.md §4). */
export const ENTITY_ALIAS: Partial<Record<BranchKey, Partial<Record<EntityKey, string>>>> = {
  academy: {
    clients: 'Étudiants',
    opportunities: 'Inscriptions',
    projects: 'Cohortes',
  },
  comptabilite: {
    sales: 'Factures',
  },
  communication: {
    projects: 'Contenu / Production',
  },
  management: {
    tasks: 'Objectifs / Évaluations',
  },
};

export function entityDisplayName(entityKey: EntityKey, branchKey?: BranchKey): string {
  if (branchKey) {
    const alias = ENTITY_ALIAS[branchKey]?.[entityKey];
    if (alias) return alias;
  }
  return ENTITY_LABELS[entityKey] ?? entityKey;
}

export const ENTITY_LABELS: Record<EntityKey, string> = {
  clients: 'Clients',
  leads: 'Leads',
  interactions: 'Interactions',
  opportunities: 'Opportunités',
  proposals: 'Propositions',
  sales: 'Ventes',
  payments: 'Paiements',
  expenses: 'Dépenses',
  marketingCampaigns: 'Campagnes',
  salespeople: 'Commerciaux',
  consultants: 'Consultants',
  projects: 'Projets',
  tasks: 'Tâches',
  feedback: 'Feedback',
  auditEvents: 'Audit',
};

export const ENTITY_ICONS: Record<EntityKey, string> = {
  clients: 'ph-users',
  leads: 'ph-funnel',
  interactions: 'ph-chat-dots',
  opportunities: 'ph-lightning',
  proposals: 'ph-file-text',
  sales: 'ph-receipt',
  payments: 'ph-currency-circle-dollar',
  expenses: 'ph-money-wavy',
  marketingCampaigns: 'ph-megaphone',
  salespeople: 'ph-identification-card',
  consultants: 'ph-briefcase',
  projects: 'ph-folder-open',
  tasks: 'ph-check-square',
  feedback: 'ph-star',
  auditEvents: 'ph-clock-clockwise',
};

/* ========================================================================== *
 *  Stage taxonomy for client lifecycle (spec/taxonomy.md §5)
 * ========================================================================== */

export type MetaStatus = 'lead' | 'active' | 'delivered';

export interface StageDef {
  name: string;
  metaStatus: MetaStatus;
  order: number;
}

export const BRANCH_STAGES: Record<string, StageDef[]> = {
  consulting: [
    { order: 0, name: 'Demande', metaStatus: 'lead' },
    { order: 1, name: 'Planifié', metaStatus: 'active' },
    { order: 2, name: 'Session', metaStatus: 'active' },
    { order: 3, name: 'Terminé', metaStatus: 'delivered' },
  ],
  comptabilite: [
    { order: 0, name: 'Intégration', metaStatus: 'lead' },
    { order: 1, name: 'Contrat', metaStatus: 'active' },
    { order: 2, name: 'Déclaration', metaStatus: 'active' },
    { order: 3, name: 'Renouvelé', metaStatus: 'delivered' },
  ],
  communication: [
    { order: 0, name: 'Brief', metaStatus: 'lead' },
    { order: 1, name: 'Design', metaStatus: 'active' },
    { order: 2, name: 'Développement', metaStatus: 'active' },
    { order: 3, name: 'Livraison', metaStatus: 'delivered' },
    { order: 4, name: 'Clôturé', metaStatus: 'delivered' },
  ],
  academy: [
    { order: 0, name: 'Inscrit', metaStatus: 'lead' },
    { order: 1, name: 'En cours', metaStatus: 'active' },
    { order: 2, name: 'Certifié', metaStatus: 'delivered' },
  ],
  management: [
    { order: 0, name: 'Réception', metaStatus: 'lead' },
    { order: 1, name: 'Traitement', metaStatus: 'active' },
    { order: 2, name: 'Soumis', metaStatus: 'active' },
    { order: 3, name: 'Accordé', metaStatus: 'delivered' },
  ],
};

/* ========================================================================== *
 *  Per-entity column definitions
 * ========================================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCol = ColDef<any>;

const clientCols: AnyCol[] = [
  { key: 'fullName', label: 'Nom', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 160 },
  { key: 'companyName', label: 'Entreprise', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 140 },
  { key: 'type', label: 'Type', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Lead', 'Prospect', 'Customer', 'Former Customer'], minWidth: 110 },
  { key: 'industry', label: 'Secteur', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 120 },
  { key: 'country', label: 'Pays', defaultVisible: false, sortable: true, filterable: true, filterType: 'text', minWidth: 100 },
  { key: 'branchKey', label: 'Branche', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['consulting', 'comptabilite', 'communication', 'academy', 'management', 'unassigned'], minWidth: 120 },
  { key: 'serviceLine', label: 'Service', defaultVisible: false, sortable: true, filterable: true, filterType: 'text', minWidth: 140 },
  { key: 'customerScore', label: 'Score', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => typeof v === 'number' ? `${Math.round(v)}` : '—', align: 'right', minWidth: 70 },
  { key: 'lifetimeRevenue', label: 'CA total', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 120 },
  { key: 'status', label: 'Statut', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 110 },
  { key: 'firstContactDate', label: '1er contact', defaultVisible: false, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'churnRiskScore', label: 'Risque churn', defaultVisible: false, sortable: true, filterable: true, filterType: 'number', render: (v) => formatPct((v as number) * 100), align: 'right', minWidth: 110 },
];

const leadCols: AnyCol[] = [
  { key: 'id', label: 'ID', defaultVisible: false, sortable: false, filterable: false, filterType: 'text', minWidth: 80 },
  { key: 'clientId', label: 'Client ID', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 100 },
  { key: 'source', label: 'Source', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Campagne Marketing', 'Prospection Classique', 'Website', 'Événementiel'], minWidth: 150 },
  { key: 'status', label: 'Statut', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Dropped'], minWidth: 110 },
  { key: 'branchKey', label: 'Branche', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['consulting', 'comptabilite', 'communication', 'academy', 'management'], minWidth: 120 },
  { key: 'qualificationScore', label: 'Score qual.', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => typeof v === 'number' ? `${Math.round(v)}` : '—', align: 'right', minWidth: 90 },
  { key: 'expectedBudget', label: 'Budget estimé', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => v != null ? formatDA(v as number) : '—', align: 'right', minWidth: 120 },
  { key: 'dateCreated', label: 'Créé le', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'converted', label: 'Converti', defaultVisible: false, sortable: true, filterable: true, filterType: 'enum', options: ['true', 'false'], render: (v) => v ? 'Oui' : 'Non', minWidth: 80 },
  { key: 'assignedSalespersonId', label: 'Commercial', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 130 },
];

const interactionCols: AnyCol[] = [
  { key: 'clientId', label: 'Client ID', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 100 },
  { key: 'type', label: 'Type', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Call', 'Meeting', 'WhatsApp', 'Email'], minWidth: 100 },
  { key: 'date', label: 'Date', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'salespersonId', label: 'Commercial', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 130 },
  { key: 'durationMinutes', label: 'Durée (min)', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => v != null ? `${v} min` : '—', align: 'right', minWidth: 90 },
  { key: 'result', label: 'Résultat', defaultVisible: true, sortable: false, filterable: true, filterType: 'text', minWidth: 160 },
  { key: 'followUpDate', label: 'Suivi prévu', defaultVisible: false, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
];

const opportunityCols: AnyCol[] = [
  { key: 'clientId', label: 'Client ID', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 100 },
  { key: 'stage', label: 'Étape', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['New Lead', 'Contacted', 'Qualified', 'Meeting', 'Proposal', 'Negotiation', 'Won', 'Lost'], minWidth: 120 },
  { key: 'valueExpected', label: 'Valeur estimée', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 130 },
  { key: 'probability', label: 'Probabilité', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatPct((v as number) * 100), align: 'right', minWidth: 100 },
  { key: 'salespersonId', label: 'Commercial', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 130 },
  { key: 'branchKey', label: 'Branche', defaultVisible: false, sortable: true, filterable: true, filterType: 'text', minWidth: 120 },
  { key: 'createdDate', label: 'Créé le', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'closingDate', label: 'Clôture prévue', defaultVisible: false, sortable: true, filterable: true, filterType: 'date', minWidth: 110 },
  { key: 'lostReason', label: 'Raison perte', defaultVisible: false, sortable: false, filterable: true, filterType: 'text', minWidth: 150 },
];

const proposalCols: AnyCol[] = [
  { key: 'clientId', label: 'Client ID', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 100 },
  { key: 'status', label: 'Statut', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired'], minWidth: 110 },
  { key: 'amount', label: 'Montant', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 120 },
  { key: 'version', label: 'Version', defaultVisible: true, sortable: true, filterable: false, filterType: 'number', align: 'center', minWidth: 70 },
  { key: 'salespersonId', label: 'Commercial', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 130 },
  { key: 'branchKey', label: 'Branche', defaultVisible: false, sortable: true, filterable: true, filterType: 'text', minWidth: 120 },
  { key: 'creationDate', label: 'Créé le', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'sentDate', label: 'Envoyé le', defaultVisible: false, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'acceptanceDate', label: 'Accepté le', defaultVisible: false, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'rejectionReason', label: 'Raison refus', defaultVisible: false, sortable: false, filterable: true, filterType: 'text', minWidth: 150 },
];

const saleCols: AnyCol[] = [
  { key: 'clientId', label: 'Client ID', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 100 },
  { key: 'date', label: 'Date', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'branchKey', label: 'Branche', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['consulting', 'comptabilite', 'communication', 'academy', 'management'], minWidth: 120 },
  { key: 'amount', label: 'CA reconnu', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 120 },
  { key: 'grossFlowAmount', label: 'CA brut', defaultVisible: false, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 110 },
  { key: 'margin', label: 'Marge', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 110 },
  { key: 'salespersonId', label: 'Commercial', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 130 },
  { key: 'paymentStatus', label: 'Paiement', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Pending', 'Partial', 'Paid', 'Overdue', 'Refunded'], minWidth: 110 },
  { key: 'serviceLine', label: 'Service', defaultVisible: false, sortable: true, filterable: true, filterType: 'text', minWidth: 140 },
];

const paymentCols: AnyCol[] = [
  { key: 'clientId', label: 'Client ID', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 100 },
  { key: 'saleId', label: 'Vente ID', defaultVisible: false, sortable: false, filterable: false, filterType: 'text', minWidth: 90 },
  { key: 'date', label: 'Date', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'amount', label: 'Montant', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 110 },
  { key: 'method', label: 'Méthode', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Online'], minWidth: 120 },
  { key: 'status', label: 'Statut', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Pending', 'Partial', 'Paid', 'Overdue', 'Refunded'], minWidth: 110 },
  { key: 'dueDate', label: 'Échéance', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
];

const expenseCols: AnyCol[] = [
  { key: 'date', label: 'Date', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'branchKey', label: 'Branche', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['consulting', 'comptabilite', 'communication', 'academy', 'management'], minWidth: 120 },
  { key: 'category', label: 'Catégorie', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Salary', 'Marketing', 'Software', 'Investment', 'Transport', 'Digital production', 'Freelancers', 'HR', 'Taxes', 'Other'], minWidth: 150 },
  { key: 'description', label: 'Description', defaultVisible: true, sortable: false, filterable: true, filterType: 'text', minWidth: 200 },
  { key: 'supplier', label: 'Fournisseur', defaultVisible: false, sortable: true, filterable: true, filterType: 'text', minWidth: 130 },
  { key: 'quantity', label: 'Qté', defaultVisible: false, sortable: true, filterable: false, filterType: 'number', align: 'right', minWidth: 60 },
  { key: 'totalCost', label: 'Coût total', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 120 },
  { key: 'responsiblePersonId', label: 'Responsable', defaultVisible: false, sortable: true, filterable: true, filterType: 'text', minWidth: 130 },
];

const campaignCols: AnyCol[] = [
  { key: 'campaignName', label: 'Campagne', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 180 },
  { key: 'platform', label: 'Plateforme', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 100 },
  { key: 'channel', label: 'Canal', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Campagne Marketing', 'Prospection Classique', 'Website', 'Événementiel'], minWidth: 150 },
  { key: 'startDate', label: 'Début', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'leads', label: 'Leads', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatNumber(v as number), align: 'right', minWidth: 80 },
  { key: 'amountSpent', label: 'Dépensé', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 110 },
  { key: 'revenueGenerated', label: 'CA généré', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 120 },
  { key: 'reach', label: 'Portée', defaultVisible: false, sortable: true, filterable: false, filterType: 'number', render: (v) => formatNumber(v as number), align: 'right', minWidth: 90 },
  { key: 'clicks', label: 'Clics', defaultVisible: false, sortable: true, filterable: false, filterType: 'number', render: (v) => formatNumber(v as number), align: 'right', minWidth: 80 },
];

const salespersonCols: AnyCol[] = [
  { key: 'name', label: 'Nom', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 150 },
  { key: 'role', label: 'Rôle', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 130 },
  { key: 'branchKey', label: 'Branche principale', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 140 },
  { key: 'status', label: 'Statut', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Active', 'Inactive', 'On Leave'], minWidth: 100 },
  { key: 'department', label: 'Département', defaultVisible: false, sortable: true, filterable: true, filterType: 'text', minWidth: 130 },
  { key: 'hireDate', label: 'Embauché le', defaultVisible: false, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'salary', label: 'Salaire', defaultVisible: false, sortable: true, filterable: false, filterType: 'number', render: (v) => v != null ? formatDA(v as number) : '—', align: 'right', minWidth: 110 },
];

const consultantCols: AnyCol[] = [
  { key: 'fullName', label: 'Nom', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 160 },
  { key: 'seniorityLevel', label: 'Niveau', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Junior', 'Mid', 'Senior', 'Expert'], minWidth: 100 },
  { key: 'availabilityStatus', label: 'Disponibilité', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Available', 'Partially Available', 'Unavailable'], minWidth: 140 },
  { key: 'performanceScore', label: 'Performance', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => `${Math.round(v as number)}/100`, align: 'right', minWidth: 110 },
  { key: 'utilizationRate', label: 'Utilisation', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatPct((v as number) * 100), align: 'right', minWidth: 100 },
  { key: 'hourlyRate', label: 'Tarif horaire', defaultVisible: false, sortable: true, filterable: false, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 120 },
  { key: 'experienceYears', label: 'Exp. (ans)', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', align: 'right', minWidth: 80 },
  { key: 'country', label: 'Pays', defaultVisible: false, sortable: true, filterable: true, filterType: 'text', minWidth: 100 },
];

const projectCols: AnyCol[] = [
  { key: 'clientId', label: 'Client ID', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 100 },
  { key: 'branchKey', label: 'Branche', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['consulting', 'communication', 'academy'], minWidth: 120 },
  { key: 'status', label: 'Statut', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Planned', 'Active', 'Delayed', 'Completed', 'Cancelled'], minWidth: 110 },
  { key: 'startDate', label: 'Début', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'endDate', label: 'Fin', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'budget', label: 'Budget', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 120 },
  { key: 'profit', label: 'Profit', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => formatDA(v as number), align: 'right', minWidth: 110 },
  { key: 'estimatedHours', label: 'H estimées', defaultVisible: false, sortable: true, filterable: false, filterType: 'number', align: 'right', minWidth: 90 },
  { key: 'actualHours', label: 'H réelles', defaultVisible: false, sortable: true, filterable: false, filterType: 'number', render: (v) => v != null ? String(v) : '—', align: 'right', minWidth: 80 },
];

const taskCols: AnyCol[] = [
  { key: 'title', label: 'Titre', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 200 },
  { key: 'kind', label: 'Type', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['task', 'objective', 'evaluation', 'decision'], minWidth: 110 },
  { key: 'status', label: 'Statut', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['To Do', 'In Progress', 'Done', 'Blocked'], minWidth: 110 },
  { key: 'priority', label: 'Priorité', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Low', 'Medium', 'High', 'Critical'], minWidth: 100 },
  { key: 'employeeId', label: 'Assigné à', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 130 },
  { key: 'dueDate', label: 'Échéance', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'completionDate', label: 'Terminé le', defaultVisible: false, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'estimatedHours', label: 'H estimées', defaultVisible: false, sortable: true, filterable: false, filterType: 'number', render: (v) => v != null ? `${v} h` : '—', align: 'right', minWidth: 90 },
];

const feedbackCols: AnyCol[] = [
  { key: 'clientId', label: 'Client ID', defaultVisible: true, sortable: true, filterable: true, filterType: 'text', minWidth: 100 },
  { key: 'date', label: 'Date', defaultVisible: true, sortable: true, filterable: true, filterType: 'date', minWidth: 100 },
  { key: 'rating', label: 'Note', defaultVisible: true, sortable: true, filterable: true, filterType: 'number', render: (v) => `${v}/5`, align: 'right', minWidth: 70 },
  { key: 'type', label: 'Type', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Service Quality', 'Product Quality', 'Support', 'Sales Experience', 'Delivery Experience', 'General Satisfaction'], minWidth: 160 },
  { key: 'source', label: 'Source', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['WhatsApp', 'Email', 'Survey', 'Phone Call', 'Google Review', 'Facebook Review', 'Website Form', 'Direct Meeting'], minWidth: 140 },
  { key: 'resolutionStatus', label: 'Résolution', defaultVisible: true, sortable: true, filterable: true, filterType: 'enum', options: ['Open', 'In Progress', 'Resolved', 'Closed'], minWidth: 110 },
  { key: 'npsScore', label: 'NPS', defaultVisible: false, sortable: true, filterable: true, filterType: 'number', render: (v) => v != null ? `${v}/10` : '—', align: 'right', minWidth: 70 },
  { key: 'feedbackText', label: 'Commentaire', defaultVisible: false, sortable: false, filterable: true, filterType: 'text', minWidth: 200 },
];

export const ENTITY_COLUMNS: Record<EntityKey, AnyCol[]> = {
  clients: clientCols,
  leads: leadCols,
  interactions: interactionCols,
  opportunities: opportunityCols,
  proposals: proposalCols,
  sales: saleCols,
  payments: paymentCols,
  expenses: expenseCols,
  marketingCampaigns: campaignCols,
  salespeople: salespersonCols,
  consultants: consultantCols,
  projects: projectCols,
  tasks: taskCols,
  feedback: feedbackCols,
  auditEvents: [],
};

/** Default sort key per entity. */
export const ENTITY_DEFAULT_SORT: Partial<Record<EntityKey, string>> = {
  clients: 'lifetimeRevenue',
  leads: 'dateCreated',
  interactions: 'date',
  opportunities: 'valueExpected',
  proposals: 'creationDate',
  sales: 'date',
  payments: 'date',
  expenses: 'date',
  marketingCampaigns: 'startDate',
  salespeople: 'name',
  consultants: 'performanceScore',
  projects: 'startDate',
  tasks: 'dueDate',
  feedback: 'date',
};

/** The FK field used to scope by branch for each entity (null = no branch scope). */
export const ENTITY_BRANCH_FIELD: Partial<Record<EntityKey, string>> = {
  clients: 'branchKey',
  leads: 'branchKey',
  opportunities: 'branchKey',
  proposals: 'branchKey',
  sales: 'branchKey',
  expenses: 'branchKey',
  projects: 'branchKey',
};
