/**
 * screens/BranchWorkspace.tsx — Group-2 branch workspace shell (Step 6, read path).
 *
 * Layout:
 *   [EntitySidebar 200px] | [Header + DataTable]   [EntityDetailDrawer overlay]
 *
 * The fetcher bridges the generic DataTable ↔ the typed repositories, applying:
 *   1. Global FilterContext (date, service, teamMember, clientSearch)
 *   2. Branch scope (branchKey field on supporting entities)
 *   3. Table query (search, sort, columnFilters, pagination)
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { BranchKey } from '@spec/entities';
import { EntitySidebar } from '../components/explorer/EntitySidebar';
import { DataTable } from '../components/explorer/DataTable';
import type { TableQuery, TableResult } from '../components/explorer/DataTable';
import { EntityDetailDrawer } from '../components/explorer/EntityDetailDrawer';
import type { EntityKey } from '../lib/entityMeta';
import {
  BRANCH_ENTITIES, ENTITY_COLUMNS, ENTITY_DEFAULT_SORT,
  ENTITY_BRANCH_FIELD, entityDisplayName,
} from '../lib/entityMeta';
import { db } from '../store/db';
import { branchHex, BRANCH_LABEL } from '../lib/labels';
import { useFilters } from '../filters/FilterContext';
import { BRANCHES } from '../config/branches';
import { ProjectionBadge } from '../components/analytics';
import {
  clientsRepo, opportunitiesRepo, salesRepo, salespeopleRepo, projectsRepo,
} from '../store/repositories';
import {
  createLead, createOpportunity, createProposal,
  recordSaleFromOpportunity, recordPayment, createInteraction,
  createFeedback, createExpense, createProject, createTask,
  createCampaign,
} from '../lib/actions';
import { getEntityFormSchema, FormOptions } from '../components/forms/formSchemas';
import { ModalForm } from '../components/forms/ModalForm';

/* ========================================================================== *
 *  Fetcher factory — bridges TableQuery → Dexie repository
 * ========================================================================== */

function buildFetcher(
  entityKey: EntityKey,
  branchKey: BranchKey,
  globalFilters: { dateFrom: string; dateTo: string; service: string; teamMember: string; clientSearch: string },
  defaultSort: string,
) {
  return async (q: TableQuery): Promise<TableResult<Record<string, unknown>>> => {
    const tbl = (db as unknown as Record<string, { toArray: () => Promise<Record<string, unknown>[]> }>)[entityKey];
    if (!tbl) return { rows: [], total: 0 };

    let rows = await tbl.toArray();

    // 1. Branch scope
    const branchField = ENTITY_BRANCH_FIELD[entityKey];
    if (branchField) {
      rows = rows.filter((r) => r[branchField] === branchKey);
    }

    // 2. Global filters
    if (globalFilters.dateFrom) {
      rows = rows.filter((r) => {
        const d = (r['date'] ?? r['dateCreated'] ?? r['createdDate'] ?? r['startDate'] ?? '') as string;
        return d >= globalFilters.dateFrom;
      });
    }
    if (globalFilters.dateTo) {
      rows = rows.filter((r) => {
        const d = (r['date'] ?? r['dateCreated'] ?? r['createdDate'] ?? r['startDate'] ?? '') as string;
        return !d || d <= globalFilters.dateTo;
      });
    }
    if (globalFilters.service && globalFilters.service !== 'all') {
      rows = rows.filter((r) => r['serviceLine'] === globalFilters.service);
    }
    if (globalFilters.teamMember && globalFilters.teamMember !== 'all') {
      rows = rows.filter((r) =>
        r['salespersonId'] === globalFilters.teamMember ||
        r['assignedSalespersonId'] === globalFilters.teamMember ||
        r['responsiblePersonId'] === globalFilters.teamMember ||
        r['employeeId'] === globalFilters.teamMember
      );
    }
    if (globalFilters.clientSearch) {
      const q2 = globalFilters.clientSearch.toLowerCase();
      rows = rows.filter((r) =>
        String(r['fullName'] ?? '').toLowerCase().includes(q2) ||
        String(r['companyName'] ?? '').toLowerCase().includes(q2) ||
        String(r['clientId'] ?? '').toLowerCase().includes(q2) ||
        String(r['id'] ?? '').toLowerCase().includes(q2)
      );
    }

    // 3. Global search across all visible text fields
    if (q.search) {
      const s = q.search.toLowerCase();
      rows = rows.filter((r) =>
        Object.values(r).some((v) => v != null && String(v).toLowerCase().includes(s))
      );
    }

    // 4. Column filters
    for (const [key, val] of Object.entries(q.columnFilters)) {
      if (!val) continue;
      rows = rows.filter((r) => {
        const rv = r[key];
        if (rv == null) return false;
        if (typeof rv === 'boolean') return String(rv) === val;
        return String(rv).toLowerCase().includes(val.toLowerCase());
      });
    }

    const total = rows.length;

    // 5. Sort
    const sortKey = q.sortBy || defaultSort;
    if (sortKey) {
      const dir = q.sortDir === 'desc' ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey]; const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return -1;
        if (bv == null) return 1;
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    }

    // 6. Paginate
    const offset = (q.page - 1) * q.pageSize;
    rows = rows.slice(offset, offset + q.pageSize);

    return { rows, total };
  };
}

/* ========================================================================== *
 *  Main component
 * ========================================================================== */

interface BranchWorkspaceProps {
  branchKey: BranchKey;
}

/* ========================================================================== *
 *  Branch Action Bar Component
 * ========================================================================== */

interface BranchActionBarProps {
  branchKey: BranchKey;
  onActionTrigger: (actionId: string) => void;
}

function BranchActionBar({ branchKey, onActionTrigger }: BranchActionBarProps) {
  const accent = branchHex(branchKey);

  const getButtons = () => {
    switch (branchKey) {
      case 'consulting':
        return [
          { id: 'add_prospect', label: 'Ajouter Prospect', icon: 'ph-user-plus' },
          { id: 'create_lead', label: 'Créer Piste', icon: 'ph-funnel' },
          { id: 'create_proposal', label: 'Créer Proposition', icon: 'ph-file-text' },
          { id: 'record_meeting', label: 'Enregistrer Réunion', icon: 'ph-chat-dots' },
          { id: 'record_sale', label: 'Enregistrer Vente', icon: 'ph-receipt' },
          { id: 'record_payment', label: 'Enregistrer Paiement', icon: 'ph-currency-circle-dollar' },
          { id: 'create_project', label: 'Créer Projet', icon: 'ph-folder-open' },
        ];
      case 'comptabilite':
        return [
          { id: 'create_invoice', label: 'Créer Facture', icon: 'ph-receipt' },
          { id: 'record_payment', label: 'Enregistrer Paiement', icon: 'ph-currency-circle-dollar' },
          { id: 'record_expense', label: 'Enregistrer Dépense', icon: 'ph-money-wavy' },
          { id: 'update_tax', label: 'Déclarer Impôt', icon: 'ph-percent' },
        ];
      case 'communication':
        return [
          { id: 'create_campaign', label: 'Créer Campagne', icon: 'ph-megaphone' },
          { id: 'create_content', label: 'Créer Contenu / Projet', icon: 'ph-folder-open' },
          { id: 'record_feedback', label: 'Enregistrer Feedback', icon: 'ph-star' },
        ];
      case 'academy':
        return [
          { id: 'create_student', label: 'Créer Étudiant', icon: 'ph-user-plus' },
          { id: 'register_enrollment', label: 'Enregistrer Inscription', icon: 'ph-lightning' },
          { id: 'record_attendance', label: 'Enregistrer Présence', icon: 'ph-check-square' },
          { id: 'record_payment', label: 'Enregistrer Paiement', icon: 'ph-currency-circle-dollar' },
        ];
      case 'management':
        return [
          { id: 'create_objective', label: 'Créer Objectif / Éval', icon: 'ph-check-square' },
          { id: 'record_decision', label: 'Enregistrer Décision', icon: 'ph-scales' },
          { id: 'create_internal_task', label: 'Tâche Interne', icon: 'ph-list-checks' },
        ];
      default:
        return [];
    }
  };

  const buttons = getButtons();
  if (buttons.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      padding: '10px 20px',
      background: 'var(--surface-2)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
      alignItems: 'center',
    }}>
      <span style={{ font: '600 10px/1 var(--font-mono)', color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4 }}>
        Actions :
      </span>
      {buttons.map((b) => (
        <button
          key={b.id}
          onClick={() => onActionTrigger(b.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 28,
            padding: '0 10px',
            borderRadius: 'var(--radius-xs)',
            border: `1px solid ${accent}44`,
            background: 'rgba(255,255,255,0.02)',
            color: 'var(--ink-100)',
            font: '500 11px/1 var(--font-text)',
            cursor: 'pointer',
            transition: 'all 0.1s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${accent}18`;
            e.currentTarget.style.borderColor = accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            e.currentTarget.style.borderColor = `${accent}44`;
          }}
        >
          <i className={`ph ${b.icon}`} style={{ color: accent, fontSize: 13 }} />
          {b.label}
        </button>
      ))}
    </div>
  );
}

/* ========================================================================== *
 *  Main Component
 * ========================================================================== */

export function BranchWorkspace({ branchKey }: BranchWorkspaceProps) {
  const branch = branchKey;
  const branchDef = BRANCHES.find((b) => b.key === branch);
  const accent = branchHex(branch);
  const { filters } = useFilters();

  const entities = BRANCH_ENTITIES[branch] ?? [];
  const [selectedEntity, setSelectedEntity] = useState<EntityKey>(entities[0] ?? 'clients');
  const [detailRow, setDetailRow] = useState<Record<string, unknown> | null>(null);
  
  // step 7 write states
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeForm, setActiveForm] = useState<{
    entityKey: string;
    title: string;
    initialValues: Record<string, string>;
    onSubmit: (values: Record<string, string>) => Promise<void>;
    sections: any[];
  } | null>(null);

  // Reset entity selection when branch changes
  React.useEffect(() => {
    const firstEntity = (BRANCH_ENTITIES[branch as BranchKey] ?? [])[0] ?? 'clients';
    setSelectedEntity(firstEntity);
    setDetailRow(null);
  }, [branch]);

  const cols = useMemo(() => ENTITY_COLUMNS[selectedEntity] ?? [], [selectedEntity]);
  const defaultSort = ENTITY_DEFAULT_SORT[selectedEntity] ?? (cols[0]?.key ?? 'id');

  const globalFilters = useMemo(() => ({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    service: filters.service,
    teamMember: filters.teamMember,
    clientSearch: filters.clientSearch,
  }), [filters]);

  const fetcher = useCallback(
    (q: TableQuery) => buildFetcher(selectedEntity, branch, globalFilters, defaultSort)(q),
    [selectedEntity, branch, globalFilters, defaultSort]
  );

  const resetKey = `${branch}-${selectedEntity}`;

  const handleEntitySelect = useCallback((key: EntityKey) => {
    setSelectedEntity(key);
    setDetailRow(null);
  }, []);

  const handleRowClick = useCallback((row: Record<string, unknown>) => {
    setDetailRow(row);
  }, []);

  const handleDrawerClose = useCallback(() => setDetailRow(null), []);

  const reloadDetailRow = useCallback(async () => {
    if (!detailRow) return;
    const rowId = detailRow.id as string;
    const tbl = (db as any)[selectedEntity];
    if (tbl && rowId) {
      const fresh = await tbl.get(rowId);
      setDetailRow(fresh || null);
    }
  }, [detailRow, selectedEntity]);

  const handleMutationSuccess = useCallback(async () => {
    setRefreshTrigger((t) => t + 1);
    await reloadDetailRow();
  }, [reloadDetailRow]);

  const openForm = useCallback(async (entityKey: string, title: string, initialValues: Record<string, string> = {}, customSubmit?: (values: Record<string, string>) => Promise<void>) => {
    const [clientsRaw, salespeopleRaw, opportunitiesRaw, salesRaw, projectsRaw] = await Promise.all([
      clientsRepo.all(),
      salespeopleRepo.all(),
      opportunitiesRepo.all(),
      salesRepo.all(),
      projectsRepo.all()
    ]);

    const options: FormOptions = {
      clients: clientsRaw.map(c => ({ id: c.id, name: c.fullName || c.companyName || 'Sans Nom' })),
      salespeople: salespeopleRaw.map(s => ({ id: s.id, name: s.name })),
      opportunities: opportunitiesRaw.map(o => ({ id: o.id, name: `Opp ${o.id}` })),
      sales: salesRaw.map(s => ({ id: s.id, name: `Sale ${s.id}` })),
      projects: projectsRaw.map(p => ({ id: p.id, name: `Project ${p.id}` }))
    };

    const schema = getEntityFormSchema(entityKey, options, branch);

    const defaultSubmit = async (values: Record<string, string>) => {
      const repo = (db as any)[entityKey];
      if (repo) {
        const row = {
          id: `${entityKey.slice(0, 3).toUpperCase()}${Date.now()}`,
          isSample: true,
          ...values
        };
        for (const [k, v] of Object.entries(row)) {
          if (!isNaN(Number(v)) && v !== 'true' && v !== 'false' && k !== 'phone') {
            (row as any)[k] = Number(v);
          } else if (v === 'true') {
            (row as any)[k] = true;
          } else if (v === 'false') {
            (row as any)[k] = false;
          }
        }
        await repo.add(row);
      }
    };

    setActiveForm({
      entityKey,
      title,
      initialValues,
      sections: schema,
      onSubmit: async (values) => {
        if (customSubmit) {
          await customSubmit(values);
        } else {
          await defaultSubmit(values);
        }
        setRefreshTrigger(t => t + 1);
      }
    });
  }, [branch]);

  const handleActionTrigger = useCallback((actionId: string) => {
    switch (actionId) {
      case 'add_prospect':
        openForm('add_prospect', 'Ajouter un Prospect Manuellement', {}, async (values) => {
          await createLead({
            fullName: values.fullName,
            companyName: values.companyName || undefined,
            email: values.email || undefined,
            phone: values.phone || undefined,
            industry: values.industry || undefined,
            country: values.country || undefined,
            source: values.source as any,
            branchKey: values.branchKey as any || branch,
            serviceLine: values.serviceLine as any,
            assignedSalespersonId: values.assignedSalespersonId || undefined,
            expectedBudget: values.expectedBudget ? Number(values.expectedBudget) : undefined,
            need: values.need || undefined,
          });
        });
        break;

      case 'create_lead':
        openForm('leads', 'Créer une Piste', { branchKey: branch, status: 'New', source: 'Website' }, async (values) => {
          await createLead({
            clientId: values.clientId,
            source: values.source as any,
            branchKey: values.branchKey as any || branch,
            serviceLine: values.serviceLine as any,
            assignedSalespersonId: values.assignedSalespersonId || undefined,
            expectedBudget: values.expectedBudget ? Number(values.expectedBudget) : undefined,
            need: values.need || undefined,
          });
        });
        break;

      case 'create_proposal':
        openForm('proposals', 'Créer une Proposition', { branchKey: branch, status: 'Draft' }, async (values) => {
          await createProposal({
            clientId: values.clientId,
            opportunityId: values.opportunityId,
            salespersonId: values.salespersonId,
            branchKey: values.branchKey as any || branch,
            serviceLine: values.serviceLine as any,
            amount: Number(values.amount),
            discount: values.discount ? Number(values.discount) : 0,
            estimatedDeliveryTimeDays: values.estimatedDeliveryTimeDays ? Number(values.estimatedDeliveryTimeDays) : undefined,
            pricingRef: values.pricingRef || undefined,
          });
        });
        break;

      case 'record_meeting':
        openForm('interactions', 'Enregistrer une Réunion', { type: 'Meeting', date: new Date().toISOString().slice(0, 10) }, async (values) => {
          await createInteraction({
            clientId: values.clientId,
            salespersonId: values.salespersonId,
            type: 'Meeting',
            date: values.date,
            durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
            result: values.result || undefined,
            notes: values.notes || undefined,
            followUpDate: values.followUpDate || undefined,
          });
        });
        break;

      case 'record_sale':
      case 'create_invoice':
        openForm('sales', 'Enregistrer une Vente / Facture', { branchKey: branch, date: new Date().toISOString().slice(0, 10), paymentStatus: 'Pending', revenueModel: 'service_fee' }, async (values) => {
          let oppId = values.opportunityId;
          if (!oppId) {
            const opp = await createOpportunity({
              clientId: values.clientId,
              salespersonId: values.salespersonId,
              branchKey: values.branchKey as any || branch,
              serviceLine: values.serviceLine as any,
              valueExpected: Number(values.amount),
              stage: 'Won' as any,
            });
            oppId = opp.id;
          }
          await recordSaleFromOpportunity(oppId, {
            amount: Number(values.amount),
            grossFlowAmount: Number(values.grossFlowAmount),
            margin: Number(values.margin),
            serviceLine: values.serviceLine as any,
            date: values.date,
            salespersonId: values.salespersonId,
            projectId: values.projectId || undefined,
            pricingRef: values.pricingRef || undefined,
            revenueModel: values.revenueModel as any,
          });
        });
        break;

      case 'record_payment':
        openForm('payments', 'Enregistrer un Paiement', { date: new Date().toISOString().slice(0, 10), method: 'Bank Transfer', status: 'Paid' }, async (values) => {
          await recordPayment(values.saleId, {
            amount: Number(values.amount),
            method: values.method,
            date: values.date,
            invoiceId: values.invoiceId || undefined,
            dueDate: values.dueDate || undefined,
          });
        });
        break;

      case 'create_project':
      case 'create_content':
        openForm('projects', 'Créer un Projet / Contenu', { branchKey: branch, startDate: new Date().toISOString().slice(0, 10), status: 'Planned' }, async (values) => {
          await createProject({
            clientId: values.clientId,
            saleId: values.saleId || undefined,
            branchKey: values.branchKey as any || branch,
            serviceLine: values.serviceLine as any,
            startDate: values.startDate,
            estimatedHours: Number(values.estimatedHours),
            budget: Number(values.budget),
          });
        });
        break;

      case 'record_expense':
        openForm('expenses', 'Enregistrer une Dépense', { branchKey: branch, date: new Date().toISOString().slice(0, 10), quantity: '1' }, async (values) => {
          await createExpense({
            date: values.date,
            branchKey: values.branchKey as any || branch,
            category: values.category,
            description: values.description || undefined,
            supplier: values.supplier || undefined,
            quantity: Number(values.quantity),
            unitCost: Number(values.unitCost),
            responsiblePersonId: values.responsiblePersonId || undefined,
          });
        });
        break;

      case 'update_tax':
        openForm('expenses', 'Déclarer un Impôt / Taxe', { branchKey: branch, category: 'Taxes', date: new Date().toISOString().slice(0, 10), quantity: '1', description: 'Taxes' }, async (values) => {
          await createExpense({
            date: values.date,
            branchKey: values.branchKey as any || branch,
            category: 'Taxes',
            description: values.description || 'Impôts / Taxes',
            supplier: values.supplier || undefined,
            quantity: 1,
            unitCost: Number(values.unitCost || values.totalCost),
            responsiblePersonId: values.responsiblePersonId || undefined,
          });
        });
        break;

      case 'create_campaign':
        openForm('marketingCampaigns', 'Créer une Campagne', { startDate: new Date().toISOString().slice(0, 10), channel: 'Campagne Marketing' }, async (values) => {
          await createCampaign({
            platform: values.platform,
            channel: values.channel as any,
            campaignName: values.campaignName,
            objective: values.objective || undefined,
            startDate: values.startDate,
            budget: Number(values.budget),
          });
        });
        break;

      case 'record_feedback':
        openForm('feedback', 'Enregistrer un Feedback Client', { date: new Date().toISOString().slice(0, 10), source: 'Survey', type: 'General Satisfaction', rating: '4', resolutionStatus: 'Open' }, async (values) => {
          await createFeedback({
            clientId: values.clientId,
            projectId: values.projectId || undefined,
            saleId: values.saleId || undefined,
            date: values.date,
            source: values.source,
            type: values.type,
            rating: Number(values.rating),
            feedbackText: values.feedbackText || undefined,
            npsScore: values.npsScore ? Number(values.npsScore) : undefined,
            responsibleEmployeeId: values.responsibleEmployeeId || undefined,
          });
        });
        break;

      case 'create_student':
        openForm('clients', 'Créer une Fiche Étudiant', { type: 'Lead', branchKey: 'academy', serviceLine: 'academy' }, async (values) => {
          await clientsRepo.create({
            id: `C${Date.now()}`,
            type: 'Lead' as any,
            fullName: values.fullName,
            email: values.email,
            phone: values.phone,
            companyName: values.companyName || null,
            industry: values.industry || null,
            country: values.country || null,
            city: values.city || null,
            address: null,
            position: null,
            companySize: null,
            sourceAcquisition: 'Website',
            acquisitionCampaign: null,
            acquisitionChannel: 'Website',
            responsibleSalespersonId: values.responsibleSalespersonId || null,
            branchKey: 'academy',
            serviceLine: 'academy',
            branchConfidence: 'direct' as any,
            firstContactDate: new Date().toISOString().slice(0, 10),
            firstPurchaseDate: null,
            lastPurchaseDate: null,
            lastActivityDate: new Date().toISOString().slice(0, 10),
            status: 'Lead',
            lifetimeRevenue: 0,
            lifetimeProfit: 0,
            numberPurchases: 0,
            numberCalls: 0,
            numberMeetings: 0,
            numberMessages: 0,
            customerScore: 0,
            churnRiskScore: 0,
            consentFlag: false,
            isMerged: false,
            needsReview: false,
            sourceCount: 1,
            isSample: true,
          });
        });
        break;

      case 'register_enrollment':
        openForm('opportunities', 'Enregistrer une Inscription (Academy)', { branchKey: 'academy', serviceLine: 'academy', stage: 'Qualified' }, async (values) => {
          await createOpportunity({
            clientId: values.clientId,
            salespersonId: values.salespersonId,
            branchKey: 'academy',
            serviceLine: 'academy',
            valueExpected: Number(values.valueExpected),
            stage: values.stage as any || 'Qualified',
          });
        });
        break;

      case 'record_attendance':
        openForm('tasks', 'Enregistrer une Présence (Academy)', { kind: 'task', status: 'Done', dueDate: new Date().toISOString().slice(0, 10), title: 'Présence cours' }, async (values) => {
          await createTask({
            projectId: values.projectId || undefined,
            employeeId: values.employeeId,
            kind: 'task',
            title: values.title || 'Présence cours',
            dueDate: values.dueDate || undefined,
            estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : undefined,
            department: 'Academy',
          });
        });
        break;

      case 'create_objective':
        openForm('tasks', 'Créer un Objectif / Évaluation', { kind: 'objective', status: 'To Do', priority: 'Medium' }, async (values) => {
          await createTask({
            projectId: values.projectId || undefined,
            employeeId: values.employeeId,
            kind: values.kind || 'objective',
            title: values.title,
            dueDate: values.dueDate || undefined,
            priority: values.priority as any || 'Medium',
            estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : undefined,
            department: values.department || undefined,
          });
        });
        break;

      case 'record_decision':
        openForm('tasks', 'Enregistrer une Décision Administrative', { kind: 'decision', status: 'Done', priority: 'Medium' }, async (values) => {
          await createTask({
            employeeId: values.employeeId,
            kind: 'decision',
            title: values.title,
            dueDate: values.dueDate || undefined,
            department: values.department || undefined,
          });
        });
        break;

      case 'create_internal_task':
        openForm('tasks', 'Créer une Tâche Interne', { kind: 'task', status: 'To Do', priority: 'Medium' }, async (values) => {
          await createTask({
            projectId: values.projectId || undefined,
            employeeId: values.employeeId,
            kind: 'task',
            title: values.title,
            dueDate: values.dueDate || undefined,
            priority: values.priority as any || 'Medium',
            estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : undefined,
            department: values.department || undefined,
          });
        });
        break;

      default:
        break;
    }
  }, [openForm, branch]);

  // Check if any displayed entity has sample data
  const hasSample = ['sales', 'payments', 'expenses', 'opportunities', 'proposals', 'projects',
    'tasks', 'interactions', 'consultants', 'marketingCampaigns'].includes(selectedEntity);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Secondary sidebar */}
      <EntitySidebar
        branchKey={branch}
        selected={selectedEntity}
        onSelect={handleEntitySelect}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Branch + entity header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          background: 'var(--surface-1)',
        }}>
          {/* Branch badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {branchDef && (
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-xs)', background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={branchDef.icon} style={{ fontSize: 16, color: accent }} />
              </div>
            )}
            <div>
              <div style={{ font: '600 13px/1.2 var(--font-text)', color: 'var(--ink-100)' }}>
                {BRANCH_LABEL[branch as BranchKey] ?? branch}
              </div>
              <div style={{ font: '400 10px/1 var(--font-mono)', color: 'var(--ink-400)', marginTop: 1 }}>
                {entityDisplayName(selectedEntity, branch)}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

          {/* Breadcrumb indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
            <span style={{ font: '500 13px/1 var(--font-text)', color: 'var(--ink-200)' }}>
              {entityDisplayName(selectedEntity, branch)}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Projection badge if entity has simulated data */}
          {hasSample && <ProjectionBadge />}
        </div>

        {/* Branch ActionBar */}
        <BranchActionBar
          branchKey={branch}
          onActionTrigger={handleActionTrigger}
        />

        {/* DataTable */}
        <div style={{ flex: 1, padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <DataTable
            key={resetKey}
            columns={cols}
            fetcher={fetcher}
            branchHex={accent}
            onRowClick={handleRowClick}
            entityLabel={entityDisplayName(selectedEntity, branch)}
            resetKey={resetKey}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

      {/* Detail drawer */}
      <EntityDetailDrawer
        entityKey={selectedEntity}
        row={detailRow}
        branchKey={branch}
        onClose={handleDrawerClose}
        onMutationSuccess={handleMutationSuccess}
      />

      {/* Form modal */}
      {activeForm && (
        <ModalForm
          title={activeForm.title}
          sections={activeForm.sections}
          initialValues={activeForm.initialValues}
          onSubmit={activeForm.onSubmit}
          onClose={() => setActiveForm(null)}
          accentColor={accent}
        />
      )}
    </div>
  );
}
