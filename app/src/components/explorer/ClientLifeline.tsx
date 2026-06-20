/**
 * components/explorer/ClientLifeline.tsx — client lifecycle timeline.
 *
 * Shows the full journey: Lead → Interaction(s) → Opportunity → Proposal → Sale → Project → Feedback
 * for a selected client, with branch-stage color coding from spec/taxonomy.md §5.
 */

import { useEffect, useState } from 'react';
import type { BranchKey } from '@spec/entities';
import type {
  Client, Lead, Interaction, Opportunity, Proposal, Sale, Project, Feedback,
} from '@spec/entities';
import {
  clientsRepo, leadsRepo, interactionsRepo, opportunitiesRepo,
  proposalsRepo, salesRepo, projectsRepo, feedbackRepo,
} from '../../store/repositories';
import { BRANCH_STAGES, type MetaStatus } from '../../lib/entityMeta';
import { branchHex } from '../../lib/labels';
import { formatDA } from '../../lib/format';

interface ClientLifelineProps {
  clientId: string;
  branchKey?: BranchKey;
}

type EventKind = 'lead' | 'interaction' | 'opportunity' | 'proposal' | 'sale' | 'project' | 'feedback';

interface TimelineEvent {
  id: string;
  kind: EventKind;
  date: string;
  label: string;
  sublabel?: string;
  status?: string;
  metaStatus: MetaStatus;
  amount?: number;
  icon: string;
}

function metaStatusToColor(ms: MetaStatus, accent: string): string {
  if (ms === 'delivered') return '#22c55e';
  if (ms === 'active') return accent;
  return `${accent}66`;
}

function kindIcon(kind: EventKind): string {
  const map: Record<EventKind, string> = {
    lead: 'ph-funnel',
    interaction: 'ph-chat-dots',
    opportunity: 'ph-lightning',
    proposal: 'ph-file-text',
    sale: 'ph-receipt',
    project: 'ph-folder-open',
    feedback: 'ph-star',
  };
  return map[kind];
}

function kindLabel(kind: EventKind): string {
  const map: Record<EventKind, string> = {
    lead: 'Lead',
    interaction: 'Interaction',
    opportunity: 'Opportunité',
    proposal: 'Proposition',
    sale: 'Vente',
    project: 'Projet',
    feedback: 'Feedback',
  };
  return map[kind];
}

function inferMetaStatus(kind: EventKind, status?: string): MetaStatus {
  if (kind === 'feedback') return 'delivered';
  if (kind === 'sale') return 'delivered';
  if (kind === 'project') {
    if (status === 'Completed') return 'delivered';
    if (status === 'Active' || status === 'Delayed') return 'active';
    return 'lead';
  }
  if (kind === 'opportunity') {
    if (status === 'Won') return 'delivered';
    if (status === 'Lost') return 'lead';
    return 'active';
  }
  if (kind === 'proposal') {
    if (status === 'Accepted') return 'delivered';
    if (status === 'Rejected' || status === 'Expired') return 'lead';
    return 'active';
  }
  if (kind === 'lead') {
    if (status === 'Converted') return 'delivered';
    if (status === 'Dropped' || status === 'Unqualified') return 'lead';
    return 'active';
  }
  return 'active';
}

export function ClientLifeline({ clientId, branchKey = 'consulting' }: ClientLifelineProps) {
  const accent = branchHex(branchKey);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [c, leads, interactions, opportunities, proposals, sales, projects, feedbacks] =
        await Promise.all([
          clientsRepo.getById(clientId),
          leadsRepo.list({ where: { clientId } as never }),
          interactionsRepo.list({ where: { clientId } as never }),
          opportunitiesRepo.list({ where: { clientId } as never }),
          proposalsRepo.list({ where: { clientId } as never }),
          salesRepo.list({ where: { clientId } as never }),
          projectsRepo.list({ where: { clientId } as never }),
          feedbackRepo.list({ where: { clientId } as never }),
        ]);

      if (cancelled) return;
      if (c) setClient(c);

      const evts: TimelineEvent[] = [];

      leads.rows.forEach((l: Lead) => evts.push({
        id: l.id,
        kind: 'lead',
        date: l.dateCreated,
        label: `Lead — ${l.source}`,
        sublabel: l.status,
        status: l.status,
        metaStatus: inferMetaStatus('lead', l.status),
        icon: kindIcon('lead'),
      }));

      interactions.rows.forEach((i: Interaction) => evts.push({
        id: i.id,
        kind: 'interaction',
        date: i.date,
        label: `${kindLabel('interaction')} — ${i.type}`,
        sublabel: i.result ?? undefined,
        metaStatus: 'active',
        icon: kindIcon('interaction'),
      }));

      opportunities.rows.forEach((o: Opportunity) => evts.push({
        id: o.id,
        kind: 'opportunity',
        date: o.createdDate,
        label: `Opportunité — ${o.stage}`,
        sublabel: formatDA(o.valueExpected),
        status: o.stage,
        metaStatus: inferMetaStatus('opportunity', o.stage),
        amount: o.valueExpected,
        icon: kindIcon('opportunity'),
      }));

      proposals.rows.forEach((p: Proposal) => evts.push({
        id: p.id,
        kind: 'proposal',
        date: p.creationDate,
        label: `Proposition v${p.version} — ${p.status}`,
        sublabel: formatDA(p.amount),
        status: p.status,
        metaStatus: inferMetaStatus('proposal', p.status),
        amount: p.amount,
        icon: kindIcon('proposal'),
      }));

      sales.rows.forEach((s: Sale) => evts.push({
        id: s.id,
        kind: 'sale',
        date: s.date,
        label: `Vente — ${s.paymentStatus}`,
        sublabel: formatDA(s.amount),
        status: s.paymentStatus,
        metaStatus: 'delivered',
        amount: s.amount,
        icon: kindIcon('sale'),
      }));

      projects.rows.forEach((p: Project) => evts.push({
        id: p.id,
        kind: 'project',
        date: p.startDate,
        label: `Projet — ${p.status}`,
        sublabel: formatDA(p.budget),
        status: p.status,
        metaStatus: inferMetaStatus('project', p.status),
        amount: p.budget,
        icon: kindIcon('project'),
      }));

      feedbacks.rows.forEach((f: Feedback) => evts.push({
        id: f.id,
        kind: 'feedback',
        date: f.date,
        label: `Feedback — ${f.rating}/5`,
        sublabel: f.type,
        metaStatus: 'delivered',
        icon: kindIcon('feedback'),
      }));

      evts.sort((a, b) => a.date.localeCompare(b.date));
      setEvents(evts);
      setLoading(false);
    }

    setLoading(true);
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  const stages = BRANCH_STAGES[branchKey] ?? [];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-300)', fontSize: 12 }}>
        <i className="ph ph-circle-notch" style={{ animation: 'ms-spin 0.9s linear infinite', marginRight: 8 }} />
        Chargement du parcours…
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px', overflowY: 'auto', height: '100%' }}>
      {/* Client name header */}
      {client && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ font: '600 14px/1.3 var(--font-text)', color: 'var(--ink-100)' }}>
            {client.fullName ?? client.companyName ?? client.id}
          </div>
          <div style={{ font: '400 11px/1.4 var(--font-mono)', color: 'var(--ink-300)', marginTop: 2 }}>
            {client.id} · {client.industry ?? 'Secteur inconnu'} · {client.country ?? ''}
          </div>
        </div>
      )}

      {/* Branch stage legend */}
      {stages.length > 0 && (
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 'var(--radius-xs)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {stages.map((stage, i) => {
            const color = metaStatusToColor(stage.metaStatus, accent);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: `${color}18`,
                  borderRight: i < stages.length - 1 ? '1px solid var(--border)' : 'none',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, margin: '0 auto 4px' }} />
                <div style={{ font: '500 10px/1.2 var(--font-text)', color: color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {stage.name}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline events */}
      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--ink-400)', fontSize: 12 }}>
          Aucun événement enregistré pour ce client.
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />

          {events.map((evt, i) => {
            const color = metaStatusToColor(evt.metaStatus, accent);
            return (
              <div key={evt.id + i} style={{ position: 'relative', marginBottom: 16 }}>
                {/* Dot */}
                <div style={{
                  position: 'absolute',
                  left: -24,
                  top: 4,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: `${color}22`,
                  border: `2px solid ${color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}>
                  <i className={`ph ${evt.icon}`} style={{ fontSize: 9, color }} />
                </div>

                {/* Content */}
                <div style={{
                  background: 'var(--surface-2)',
                  border: `1px solid var(--border)`,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--radius-xs)',
                  padding: '8px 12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ font: '500 12px/1.3 var(--font-text)', color: 'var(--ink-100)' }}>{evt.label}</span>
                    <span style={{ font: '400 10px/1 var(--font-mono)', color: 'var(--ink-400)', flexShrink: 0 }}>
                      {evt.date.slice(0, 10)}
                    </span>
                  </div>
                  {evt.sublabel && (
                    <div style={{ font: '400 11px/1.3 var(--font-text)', color: 'var(--ink-300)', marginTop: 3 }}>
                      {evt.sublabel}
                    </div>
                  )}
                  {evt.amount != null && evt.amount > 0 && (
                    <div style={{ font: '600 11px/1 var(--font-mono)', color, marginTop: 5 }}>
                      {formatDA(evt.amount)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
