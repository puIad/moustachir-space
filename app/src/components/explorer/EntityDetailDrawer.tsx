/**
 * components/explorer/EntityDetailDrawer.tsx — right-side detail drawer.
 *
 * Three tabs:
 *   Détails   — full attribute grid (all fields, formatted)
 *   Historique — AuditEvent timeline for this entity+id
 *   Parcours  — ClientLifeline (only when entity = 'clients')
 */

import React, { useEffect, useState } from 'react';
import type { BranchKey } from '@spec/entities';
import type { AuditEvent } from '@spec/entities';
import type { EntityKey } from '../../lib/entityMeta';
import { ENTITY_COLUMNS, entityDisplayName, ENTITY_ICONS } from '../../lib/entityMeta';
import {
  salespeopleRepo, clientsRepo, opportunitiesRepo,
  salesRepo, projectsRepo, auditEventsRepo
} from '../../store/repositories';
import { branchHex } from '../../lib/labels';
import { ClientLifeline } from './ClientLifeline';
import {
  assignLeadSalesperson, changeLeadStatus, convertLeadToOpportunity,
  dropLead, dropOpportunity, recordSaleFromOpportunity,
  recordPayment, updateProposalDecision, updateFeedbackResolution
} from '../../lib/actions';
import { getEntityFormSchema, FormOptions, SERVICE_LINES } from '../forms/formSchemas';
import { ModalForm } from '../forms/ModalForm';
import * as repositories from '../../store/repositories';

type Tab = 'details' | 'history' | 'lifecycle';

interface EntityDetailDrawerProps {
  entityKey: EntityKey;
  row: Record<string, unknown> | null;
  branchKey: BranchKey;
  onClose: () => void;
  onMutationSuccess?: () => void;
}

function AuditTimeline({ entityKey, entityId }: { entityKey: EntityKey; entityId: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditEventsRepo
      .list({
        where: { entity: entityKey.replace(/s$/, '') as never, entityId: entityId as never },
        sortBy: 'timestamp',
        sortDir: 'desc',
      })
      .then((r) => { setEvents(r.rows as AuditEvent[]); setLoading(false); });
  }, [entityKey, entityId]);

  if (loading) return <div style={{ padding: 16, color: 'var(--ink-400)', fontSize: 12 }}>Chargement…</div>;
  if (events.length === 0) return <div style={{ padding: 16, color: 'var(--ink-400)', fontSize: 12, textAlign: 'center' }}>Aucun historique enregistré.</div>;

  return (
    <div style={{ padding: '12px 16px' }}>
      {events.map((evt) => (
        <div key={evt.id} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className={`ph ph-${evt.action === 'create' ? 'plus' : evt.action === 'delete' ? 'trash' : evt.action === 'status_change' ? 'arrows-clockwise' : evt.action === 'convert' ? 'swap' : 'pencil'}`}
              style={{ fontSize: 12, color: 'var(--ink-300)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '500 12px/1.3 var(--font-text)', color: 'var(--ink-100)' }}>
              {evt.action === 'create' && 'Créé'}
              {evt.action === 'update' && `Mis à jour : ${evt.field}`}
              {evt.action === 'delete' && 'Supprimé'}
              {evt.action === 'status_change' && `Statut : ${evt.before} → ${evt.after}`}
              {evt.action === 'convert' && `Converti : ${evt.after}`}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              <span style={{ font: '400 10px/1 var(--font-mono)', color: 'var(--ink-400)' }}>
                {evt.timestamp.slice(0, 10)}
              </span>
              <span style={{ font: '400 10px/1 var(--font-mono)', color: 'var(--ink-300)' }}>
                {evt.actor}
              </span>
            </div>
            {evt.action === 'update' && evt.before && evt.after && (
              <div style={{ marginTop: 4, display: 'flex', gap: 6, font: '400 11px/1.3 var(--font-mono)' }}>
                <span style={{ color: 'var(--state-negative, #ef4444)', textDecoration: 'line-through', background: 'rgba(239,68,68,0.1)', padding: '1px 4px', borderRadius: 3 }}>{evt.before}</span>
                <span style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '1px 4px', borderRadius: 3 }}>{evt.after}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttributeGrid({ row, entityKey }: { row: Record<string, unknown>; entityKey: EntityKey }) {
  const cols = ENTITY_COLUMNS[entityKey] ?? [];

  const renderValue = (col: (typeof cols)[0], val: unknown): React.ReactNode => {
    if (col.render) return col.render(val, row as never);
    if (val == null) return <span style={{ color: 'var(--ink-400)' }}>—</span>;
    if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
    if (Array.isArray(val)) return val.join(', ') || '—';
    return String(val);
  };

  const allFields = Object.keys(row).filter((k) => k !== 'isSample');

  return (
    <div style={{ padding: '12px 16px' }}>
      {/* isSample badge */}
      {row['isSample'] === true && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--orange-50, rgba(251,146,60,0.1))', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <i className="ph-fill ph-flask" style={{ color: 'var(--orange-400, #fb923c)', fontSize: 12 }} />
          <span style={{ font: '600 10px/1 var(--font-mono)', color: 'var(--orange-500, #f97316)' }}>PROJECTION — données simulées</span>
        </div>
      )}

      {/* Defined columns first */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
        {cols.map((col) => {
          const val = row[col.key];
          return (
            <div key={col.key} style={{ minWidth: 0 }}>
              <div style={{ font: '600 10px/1 var(--font-text)', color: 'var(--ink-400)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>
                {col.label}
              </div>
              <div style={{ font: `400 12px/1.4 ${col.align === 'right' ? 'var(--font-mono)' : 'var(--font-text)'}`, color: 'var(--ink-100)', wordBreak: 'break-word' }}>
                {renderValue(col, val)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Remaining raw fields not in column defs */}
      {(() => {
        const definedKeys = new Set(cols.map((c) => c.key));
        const extra = allFields.filter((k) => !definedKeys.has(k) && k !== 'id');
        if (extra.length === 0) return null;
        return (
          <>
            <div style={{ margin: '16px 0 8px', borderTop: '1px solid var(--border)', paddingTop: 12, font: '600 10px/1 var(--font-text)', color: 'var(--ink-400)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Champs supplémentaires
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
              {extra.map((k) => {
                const val = row[k];
                return (
                  <div key={k}>
                    <div style={{ font: '600 10px/1 var(--font-text)', color: 'var(--ink-400)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                    <div style={{ font: '400 11px/1.4 var(--font-mono)', color: 'var(--ink-200)', wordBreak: 'break-all' }}>
                      {val == null ? '—' : Array.isArray(val) ? val.join(', ') || '—' : String(val)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
    </div>
  );
}

export function EntityDetailDrawer({ entityKey, row, branchKey, onClose, onMutationSuccess }: EntityDetailDrawerProps) {
  const [tab, setTab] = useState<Tab>('details');
  const accent = branchHex(branchKey);
  const isClient = entityKey === 'clients';

  // step 7 forms state
  const [activeForm, setActiveForm] = useState<{
    entityKey: string;
    title: string;
    initialValues: Record<string, string>;
    onSubmit: (values: Record<string, string>) => Promise<void>;
    sections: any[];
  } | null>(null);

  useEffect(() => { setTab('details'); }, [row]);

  const isOpen = row !== null;
  const rowId = row ? String(row['id'] ?? '') : '';

  const tabs: { id: Tab; label: string; icon: string; show: boolean }[] = [
    { id: 'details', label: 'Détails', icon: 'ph-list', show: true },
    { id: 'history', label: 'Historique', icon: 'ph-clock-clockwise', show: true },
    { id: 'lifecycle', label: 'Parcours', icon: 'ph-path', show: isClient },
  ];

  const entityIcon = ENTITY_ICONS[entityKey]?.replace('ph-', '') ?? 'dot';

  const handleEditClick = async () => {
    if (!row) return;

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

    const schema = getEntityFormSchema(entityKey, options, branchKey);

    const init: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v == null) init[k] = '';
      else if (v instanceof Date) init[k] = v.toISOString().slice(0, 10);
      else init[k] = String(v);
    }

    setActiveForm({
      entityKey,
      title: `Modifier ${entityDisplayName(entityKey, branchKey)}`,
      initialValues: init,
      sections: schema,
      onSubmit: async (values) => {
        const repoName = `${entityKey}Repo`;
        const repo = (repositories as any)[repoName] || (repositories as any)[`${entityKey}sRepo`] || (repositories as any)[entityKey];
        if (repo) {
          const patch: any = {};
          for (const [k, v] of Object.entries(values)) {
            if (k === 'id') continue;
            if (v === '') {
              patch[k] = null;
            } else if (!isNaN(Number(v)) && v !== 'true' && v !== 'false' && k !== 'phone') {
              patch[k] = Number(v);
            } else if (v === 'true') {
              patch[k] = true;
            } else if (v === 'false') {
              patch[k] = false;
            } else {
              patch[k] = v;
            }
          }
          await repo.update(rowId, patch);
          onMutationSuccess?.();
          setActiveForm(null);
        }
      }
    });
  };

  const renderContextActions = () => {
    if (!row) return null;
    
    const btnStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 28,
      padding: '0 12px',
      borderRadius: 'var(--radius-xs)',
      border: `1px solid ${accent}44`,
      background: 'rgba(255,255,255,0.02)',
      color: 'var(--ink-100)',
      font: '500 11px/1 var(--font-text)',
      cursor: 'pointer',
      transition: 'all 0.1s',
    };

    const flexWrapStyle: React.CSSProperties = {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      padding: '12px 16px',
      borderTop: '1px solid var(--border)',
      background: 'var(--surface-2)',
    };

    switch (entityKey) {
      case 'leads': {
        const isConverted = row.converted === true || row.status === 'Converted';
        if (isConverted) return null;
        return (
          <div style={flexWrapStyle}>
            <button
              style={btnStyle}
              onClick={async () => {
                const salespeople = await salespeopleRepo.all();
                const salespersonOptions = salespeople.map(s => ({ label: s.name, value: s.name }));
                
                setActiveForm({
                  entityKey: 'assign_salesperson',
                  title: 'Assigner Commercial',
                  initialValues: { assignedSalespersonId: (row.assignedSalespersonId as string) || '' },
                  sections: [{
                    title: 'Assignation',
                    fields: [{ key: 'assignedSalespersonId', label: 'Commercial', type: 'select', options: salespersonOptions, required: true }]
                  }],
                  onSubmit: async (values) => {
                    await assignLeadSalesperson(rowId, values.assignedSalespersonId);
                    onMutationSuccess?.();
                    setActiveForm(null);
                  }
                });
              }}
            >
              <i className="ph ph-user" style={{ color: accent }} />
              Assigner Commercial
            </button>

            <button
              style={btnStyle}
              onClick={async () => {
                setActiveForm({
                  entityKey: 'change_status',
                  title: 'Changer Statut',
                  initialValues: { status: (row.status as string) || '' },
                  sections: [{
                    title: 'Statut du Lead',
                    fields: [{
                      key: 'status',
                      label: 'Statut',
                      type: 'select',
                      options: [
                        { label: 'Nouveau (New)', value: 'New' },
                        { label: 'Contacté', value: 'Contacted' },
                        { label: 'Qualifié', value: 'Qualified' },
                        { label: 'Non qualifié', value: 'Unqualified' },
                        { label: 'Abandonné', value: 'Dropped' },
                      ],
                      required: true
                    }]
                  }],
                  onSubmit: async (values) => {
                    await changeLeadStatus(rowId, values.status as any);
                    onMutationSuccess?.();
                    setActiveForm(null);
                  }
                });
              }}
            >
              <i className="ph ph-arrows-clockwise" style={{ color: accent }} />
              Changer Statut
            </button>

            <button
              style={{ ...btnStyle, background: `${accent}22`, borderColor: accent }}
              onClick={async () => {
                await convertLeadToOpportunity(rowId, (row.assignedSalespersonId as string) || 'Walid');
                onMutationSuccess?.();
              }}
            >
              <i className="ph ph-swap" style={{ color: accent }} />
              Convertir en Opportunité
            </button>

            <button
              style={{ ...btnStyle, color: 'var(--red-400)', borderColor: 'var(--red-900)' }}
              onClick={async () => {
                await dropLead(rowId);
                onMutationSuccess?.();
              }}
            >
              <i className="ph ph-trash" style={{ color: 'var(--red-400)' }} />
              Abandonner Lead
            </button>
          </div>
        );
      }

      case 'opportunities': {
        const isClosed = row.stage === 'Won' || row.stage === 'Lost';
        if (isClosed) return null;
        return (
          <div style={flexWrapStyle}>
            <button
              style={{ ...btnStyle, background: `${accent}22`, borderColor: accent }}
              onClick={async () => {
                const salespeople = await salespeopleRepo.all();
                const salespersonOptions = salespeople.map(s => ({ label: s.name, value: s.name }));
                const projects = await projectsRepo.all();
                const projectOptions = projects.map(p => ({ label: `${p.startDate} (${p.id})`, value: p.id }));

                setActiveForm({
                  entityKey: 'record_sale',
                  title: 'Enregistrer Vente depuis l\'Opportunité',
                  initialValues: {
                    amount: String(row.valueExpected || 0),
                    grossFlowAmount: String(row.valueExpected || 0),
                    margin: String(Math.round(Number(row.valueExpected || 0) * 0.5)),
                    serviceLine: (row.serviceLine as string) || '',
                    salespersonId: (row.salespersonId as string) || '',
                    date: new Date().toISOString().slice(0, 10),
                    revenueModel: 'service_fee'
                  },
                  sections: [
                    {
                      title: 'Détails de la Vente',
                      fields: [
                        { key: 'date', label: 'Date', type: 'date', required: true },
                        { key: 'salespersonId', label: 'Commercial', type: 'select', options: salespersonOptions, required: true },
                        { key: 'serviceLine', label: 'Service', type: 'select', options: SERVICE_LINES, required: true },
                        { key: 'projectId', label: 'Projet lié', type: 'select', options: projectOptions },
                      ]
                    },
                    {
                      title: 'Chiffres et Modèle',
                      fields: [
                        { key: 'pricingRef', label: 'Tarif (dim_pricing)', type: 'pricing', serviceLineField: 'serviceLine' },
                        {
                          key: 'revenueModel',
                          label: 'Modèle',
                          type: 'select',
                          options: [
                            { label: 'Service Fee', value: 'service_fee' },
                            { label: 'Commission', value: 'commission' },
                            { label: 'Abonnement', value: 'subscription' }
                          ],
                          required: true
                        },
                        { key: 'amount', label: 'Net CA (DA)', type: 'number', required: true },
                        { key: 'grossFlowAmount', label: 'Brut CA (DA)', type: 'number', required: true },
                        { key: 'margin', label: 'Marge (DA)', type: 'number', required: true }
                      ]
                    }
                  ],
                  onSubmit: async (values) => {
                    await recordSaleFromOpportunity(rowId, {
                      amount: Number(values.amount),
                      grossFlowAmount: Number(values.grossFlowAmount),
                      margin: Number(values.margin),
                      serviceLine: values.serviceLine as any,
                      date: values.date,
                      salespersonId: values.salespersonId,
                      projectId: values.projectId || undefined,
                      pricingRef: values.pricingRef || undefined,
                      revenueModel: values.revenueModel as any
                    });
                    onMutationSuccess?.();
                    setActiveForm(null);
                  }
                });
              }}
            >
              <i className="ph ph-receipt" style={{ color: accent }} />
              Enregistrer Vente / Gagné
            </button>

            <button
              style={{ ...btnStyle, color: 'var(--red-400)', borderColor: 'var(--red-900)' }}
              onClick={async () => {
                setActiveForm({
                  entityKey: 'drop_opportunity',
                  title: 'Abandonner l\'Opportunité',
                  initialValues: { lostReason: '' },
                  sections: [{
                    title: 'Raison de la perte',
                    fields: [{ key: 'lostReason', label: 'Raison', type: 'text', required: true }]
                  }],
                  onSubmit: async (values) => {
                    await dropOpportunity(rowId, values.lostReason);
                    onMutationSuccess?.();
                    setActiveForm(null);
                  }
                });
              }}
            >
              <i className="ph ph-trash" style={{ color: 'var(--red-400)' }} />
              Abandonner / Perdu
            </button>
          </div>
        );
      }

      case 'proposals': {
        const isDraftOrSent = row.status === 'Draft' || row.status === 'Sent' || row.status === 'Viewed';
        if (!isDraftOrSent) return null;
        return (
          <div style={flexWrapStyle}>
            <button
              style={{ ...btnStyle, background: '#22c55e22', borderColor: '#22c55e', color: '#22c55e' }}
              onClick={async () => {
                await updateProposalDecision(rowId, true);
                onMutationSuccess?.();
              }}
            >
              <i className="ph ph-check" />
              Accepter la Proposition
            </button>

            <button
              style={{ ...btnStyle, color: 'var(--red-400)', borderColor: 'var(--red-950)' }}
              onClick={async () => {
                setActiveForm({
                  entityKey: 'reject_proposal',
                  title: 'Refuser la Proposition',
                  initialValues: { reason: '' },
                  sections: [{
                    title: 'Raison du refus',
                    fields: [{ key: 'reason', label: 'Raison', type: 'text', required: true }]
                  }],
                  onSubmit: async (values) => {
                    await updateProposalDecision(rowId, false, values.reason);
                    onMutationSuccess?.();
                    setActiveForm(null);
                  }
                });
              }}
            >
              <i className="ph ph-x" />
              Refuser la Proposition
            </button>
          </div>
        );
      }

      case 'sales': {
        const isPending = row.paymentStatus === 'Pending' || row.paymentStatus === 'Partial';
        if (!isPending) return null;
        return (
          <div style={flexWrapStyle}>
            <button
              style={{ ...btnStyle, background: `${accent}22`, borderColor: accent }}
              onClick={async () => {
                setActiveForm({
                  entityKey: 'record_payment',
                  title: 'Enregistrer Paiement pour cette Vente',
                  initialValues: {
                    amount: String(Number(row.amount || 0) - Number(row.amountPaid || 0)),
                    date: new Date().toISOString().slice(0, 10),
                    method: 'Bank Transfer'
                  },
                  sections: [{
                    title: 'Détails du Paiement',
                    fields: [
                      { key: 'date', label: 'Date', type: 'date', required: true },
                      { key: 'amount', label: 'Montant versé (DA)', type: 'number', required: true },
                      {
                        key: 'method',
                        label: 'Méthode',
                        type: 'select',
                        options: [
                          { label: 'Espèces', value: 'Cash' },
                          { label: 'Virement', value: 'Bank Transfer' },
                          { label: 'Carte', value: 'Card' },
                          { label: 'Chèque', value: 'Cheque' },
                          { label: 'En ligne', value: 'Online' }
                        ],
                        required: true
                      },
                      { key: 'invoiceId', label: 'Facture Réf.', type: 'text' }
                    ]
                  }],
                  onSubmit: async (values) => {
                    await recordPayment(rowId, {
                      amount: Number(values.amount),
                      method: values.method,
                      date: values.date,
                      invoiceId: values.invoiceId || undefined
                    });
                    onMutationSuccess?.();
                    setActiveForm(null);
                  }
                });
              }}
            >
              <i className="ph ph-currency-circle-dollar" style={{ color: accent }} />
              Associer Paiement
            </button>
          </div>
        );
      }

      case 'feedback': {
        return (
          <div style={flexWrapStyle}>
            <button
              style={btnStyle}
              onClick={async () => {
                setActiveForm({
                  entityKey: 'update_feedback_resolution',
                  title: 'Mettre à jour la Résolution',
                  initialValues: { resolutionStatus: (row.resolutionStatus as string) || 'Open' },
                  sections: [{
                    title: 'Traitement de la réclamation',
                    fields: [{
                      key: 'resolutionStatus',
                      label: 'Résolution',
                      type: 'select',
                      options: [
                        { label: 'Ouvert (Open)', value: 'Open' },
                        { label: 'En cours', value: 'In Progress' },
                        { label: 'Résolu (Resolved)', value: 'Resolved' },
                        { label: 'Clôturé', value: 'Closed' }
                      ],
                      required: true
                    }]
                  }],
                  onSubmit: async (values) => {
                    await updateFeedbackResolution(rowId, values.resolutionStatus);
                    onMutationSuccess?.();
                    setActiveForm(null);
                  }
                });
              }}
            >
              <i className="ph ph-check-square" style={{ color: accent }} />
              Statut Résolution
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Détail de l'enregistrement"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          background: 'var(--surface-1)',
          borderLeft: '1px solid var(--border)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s cubic-bezier(0.32,0,0.67,0)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-xs)', background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ph ph-${entityIcon}`} style={{ fontSize: 16, color: accent }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '600 13px/1.2 var(--font-text)', color: 'var(--ink-100)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entityDisplayName(entityKey, branchKey)}
            </div>
            <div style={{ font: '400 10px/1 var(--font-mono)', color: 'var(--ink-400)', marginTop: 2 }}>{rowId}</div>
          </div>

          {/* Modifier (Edit) button */}
          {row && (
            <button
              onClick={handleEditClick}
              title="Modifier l'enregistrement"
              style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 8px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--ink-200)', font: '500 11px/1 var(--font-text)', marginRight: 4 }}
            >
              <i className="ph ph-pencil" style={{ fontSize: 12 }} />
              Modifier
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 'var(--radius-xs)', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--ink-300)', flexShrink: 0 }}
          >
            <i className="ph ph-x" style={{ fontSize: 14 }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {tabs.filter((t) => t.show).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                height: 38,
                background: 'transparent',
                border: 'none',
                borderBottom: tab === t.id ? `2px solid ${accent}` : '2px solid transparent',
                cursor: 'pointer',
                font: `${tab === t.id ? '600' : '400'} 12px/1 var(--font-text)`,
                color: tab === t.id ? accent : 'var(--ink-300)',
                transition: 'color 0.1s',
              }}
            >
              <i className={`ph ${t.icon}`} style={{ fontSize: 13 }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {row && (
              <>
                {tab === 'details' && <AttributeGrid row={row} entityKey={entityKey} />}
                {tab === 'history' && <AuditTimeline entityKey={entityKey} entityId={rowId} />}
                {tab === 'lifecycle' && isClient && <ClientLifeline clientId={rowId} branchKey={branchKey} />}
              </>
            )}
          </div>
          
          {/* Action buttons (only in details tab) */}
          {tab === 'details' && renderContextActions()}
        </div>
      </div>

      {/* Edit/Action Form modal */}
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
    </>
  );
}
