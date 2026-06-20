import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dataQuality from '../seed/data_quality.json';
import { loadDataset } from '../store/repositories';
import type { Dataset } from '../lib/kpis';
import {
  ScreenHeader, KpiGrid, Kpi, SectionTitle, LoadingState
} from '../components/analytics';
import { formatDA, formatNumber, formatPct } from '../lib/format';
import { branchHex, branchLabel } from '../lib/labels';
import { ENTITY_ICONS, ENTITY_LABELS, EntityKey } from '../lib/entityMeta';
import { computeAlerts } from '../lib/alerts';

type TabKey = 'overview' | 'pipelines' | 'alerts';

export function DataManagerScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  
  // States for alerts calculation
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  
  // State for selected table details in overview
  const [selectedTableKey, setSelectedTableKey] = useState<string>('clients');

  useEffect(() => {
    let cancelled = false;
    if (activeTab === 'alerts' && !dataset) {
      setLoadingAlerts(true);
      loadDataset()
        .then((ds) => {
          if (!cancelled) {
            setDataset(ds);
            setLoadingAlerts(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoadingAlerts(false);
        });
    } else {
      setLoadingAlerts(false);
    }
    return () => {
      cancelled = true;
    };
  }, [activeTab, dataset]);

  // Selected table quality details
  const selectedTable = useMemo(() => {
    return dataQuality.tables.find((t) => t.table === selectedTableKey);
  }, [selectedTableKey]);

  // Compute Alerts dynamically using the library helper
  const alertsData = useMemo(() => {
    if (!dataset) return null;
    return computeAlerts(dataset);
  }, [dataset]);

  // Tab Header Style helpers
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    font: '600 13px/1 var(--font-text)',
    color: active ? 'var(--white)' : 'var(--ink-400)',
    background: active ? 'var(--grad-primary)' : 'transparent',
    border: active ? 'none' : '1px solid var(--border)',
    borderRadius: 'var(--radius-xs)',
    cursor: 'pointer',
    boxShadow: active ? 'var(--shadow-btn)' : 'none',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <ScreenHeader
        icon="ph-database"
        title={t('dataManager.title')}
        subtitle={t('dataManager.subtitle')}
        accent="var(--branch-unassigned)"
        projection={false} // Real data diagnostics
      />

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={tabStyle(activeTab === 'overview')}
        >
          {t('dataManager.tabQuality')}
        </button>
        <button
          onClick={() => setActiveTab('pipelines')}
          style={tabStyle(activeTab === 'pipelines')}
        >
          {t('dataManager.tabPipelines')}
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          style={tabStyle(activeTab === 'alerts')}
        >
          {t('dataManager.tabAlerts')}
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Ingestion metrics */}
          <KpiGrid min={180}>
            <Kpi
              icon="ph-package"
              accent="var(--branch-unassigned)"
              label={t('dataManager.ingested')}
              value={formatNumber(dataQuality.meta.rawRowsIngested)}
              delta="Total"
              deltaTone="flat"
            />
            <Kpi
              icon="ph-seal-check"
              accent="var(--branch-comptabilite)"
              label={t('dataManager.unique')}
              value={formatNumber(dataQuality.meta.uniqueAfterResolution)}
              delta="Net database"
              deltaTone="flat"
            />
            <Kpi
              icon="ph-arrows-merge"
              accent="var(--branch-consulting)"
              label={t('dataManager.duplicates')}
              value={formatNumber(dataQuality.meta.duplicatesCollapsed)}
              delta={`~${Math.round((dataQuality.meta.duplicatesCollapsed / dataQuality.meta.rawRowsIngested) * 100)}% reduction`}
              deltaTone="up"
            />
            <Kpi
              icon="ph-tree-structure"
              accent="var(--branch-management)"
              label={t('dataManager.merged')}
              value={formatNumber(dataQuality.meta.mergedFromMultiple)}
              delta="Multi-source"
              deltaTone="flat"
            />
            <Kpi
              icon={dataQuality.meta.needsReview > 0 ? 'ph-warning-octagon' : 'ph-check-circle'}
              accent={dataQuality.meta.needsReview > 0 ? 'var(--state-negative)' : 'var(--branch-comptabilite)'}
              label={t('dataManager.needsReview')}
              value={formatNumber(dataQuality.meta.needsReview)}
              delta={dataQuality.meta.needsReview > 0 ? "Requires review" : "Perfect state"}
              deltaTone={dataQuality.meta.needsReview > 0 ? 'down' : 'up'}
            />
          </KpiGrid>

          {/* Tables grid */}
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <SectionTitle icon="ph-table">{t('dataManager.table')}</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--ink-400)', textTransform: 'uppercase', font: '600 11px/1 var(--font-text)', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>{t('dataManager.table')}</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('dataManager.rowsIn')}</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('dataManager.rowsOut')}</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('dataManager.dedups')}</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('dataManager.imputations')}</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('dataManager.normalizations')}</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('dataManager.anomalies')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dataQuality.tables.map((tRow) => {
                    const isSelected = tRow.table === selectedTableKey;
                    const entityKey = (tRow.table + 's').replace('ys', 'ies') as EntityKey;
                    const iconName = ENTITY_ICONS[entityKey] || 'ph-table';
                    const displayTableName = ENTITY_LABELS[entityKey] || tRow.table;
                    return (
                      <tr
                        key={tRow.table}
                        onClick={() => setSelectedTableKey(tRow.table)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(100, 116, 139, 0.08)' : 'transparent',
                          borderLeft: `3px solid ${isSelected ? 'var(--branch-unassigned)' : 'transparent'}`,
                          borderBottom: '1px solid var(--line-100)',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-2)'; }}
                        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                      >
                        <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, font: '600 12px var(--font-text)', color: 'var(--ink-900)' }}>
                          <i className={`ph ${iconName}`} style={{ color: 'var(--ink-400)', fontSize: 15 }} />
                          {displayTableName}
                          <span style={{ font: '400 10px var(--font-mono)', color: 'var(--ink-400)', textTransform: 'lowercase' }}>({tRow.table})</span>
                        </td>
                        <td className="ms-mono" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--ink-500)' }}>{formatNumber(tRow.rowsIn)}</td>
                        <td className="ms-mono" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--ink-900)', fontWeight: 600 }}>{formatNumber(tRow.rowsOut)}</td>
                        <td className="ms-mono" style={{ padding: '10px 12px', textAlign: 'right', color: tRow.actions.dedupMerges > 0 ? 'var(--branch-consulting)' : 'var(--ink-400)' }}>{tRow.actions.dedupMerges || '—'}</td>
                        <td className="ms-mono" style={{ padding: '10px 12px', textAlign: 'right', color: tRow.actions.imputations > 0 ? 'var(--branch-academy)' : 'var(--ink-400)' }}>{tRow.actions.imputations || '—'}</td>
                        <td className="ms-mono" style={{ padding: '10px 12px', textAlign: 'right', color: tRow.actions.normalizations > 0 ? 'var(--branch-comptabilite)' : 'var(--ink-400)' }}>{tRow.actions.normalizations || '—'}</td>
                        <td className="ms-mono" style={{ padding: '10px 12px', textAlign: 'right', color: tRow.actions.anomaliesFlagged > 0 ? 'var(--state-negative)' : 'var(--ink-400)', fontWeight: tRow.actions.anomaliesFlagged > 0 ? 600 : 400 }}>{tRow.actions.anomaliesFlagged || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drill down table rules */}
          {selectedTable && (
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <SectionTitle icon="ph-wrench">
                {t('dataManager.drillDownTitle', { name: ENTITY_LABELS[(selectedTable.table + 's').replace('ys', 'ies') as EntityKey] || selectedTable.table })}
              </SectionTitle>
              {selectedTable.details.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-400)', font: 'var(--text-body)' }}>
                  Aucune modification ML appliquée sur cette table. Les données source sont conformes.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink-400)', font: '600 11px/1 var(--font-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '6px 12px', textAlign: 'left' }}>{t('dataManager.ruleType')}</th>
                        <th style={{ padding: '6px 12px', textAlign: 'left' }}>{t('dataManager.ruleDesc')}</th>
                        <th style={{ padding: '6px 12px', textAlign: 'right' }}>{t('dataManager.ruleAffected')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTable.details.map((d, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--line-100)' }}>
                          <td style={{ padding: '8px 12px', textTransform: 'capitalize' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: d.type === 'merge' ? 'rgba(14, 165, 233, 0.12)' : d.type === 'impute' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                              color: d.type === 'merge' ? 'var(--branch-consulting)' : d.type === 'impute' ? 'var(--branch-academy)' : 'var(--branch-comptabilite)',
                              font: '600 10px var(--font-text)'
                            }}>
                              {d.type}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', font: 'var(--fw-medium) 12px var(--font-text)', color: 'var(--ink-700)' }}>
                            {d.rule ? <code>{d.rule}</code> : d.field ? <span>Imputation sur <code>{d.field}</code> via <code>{d.method}</code></span> : '—'}
                          </td>
                          <td className="ms-mono" style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-900)' }}>
                            {formatNumber(d.affected)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ML Pipelines Tab */}
      {activeTab === 'pipelines' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ padding: '4px 0' }}>
            <h2 style={{ font: '700 18px var(--font-display)', color: 'var(--ink-900)', margin: 0 }}>{t('dataManager.mlTitle')}</h2>
            <p style={{ font: '400 13px var(--font-text)', color: 'var(--ink-500)', margin: '4px 0 0 0' }}>{t('dataManager.mlSub')}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            <div style={pipelineCardStyle()}>
              <div style={pipelineHeaderStyle('var(--branch-academy)')}>
                <i className="ph-fill ph-magic-wand" style={{ fontSize: 18 }} />
                <span>SimpleImputer (Median)</span>
              </div>
              <p style={pipelineDescStyle()}>
                Détecte les budgets non renseignés dans les prospects de Consulting et d’Académie, puis leur attribue le budget médian de leur secteur respectif. Évite la distorsion des prévisions de pipeline.
              </p>
              <div style={pipelineMetaStyle()}>
                <span>Modèle : <code>scikit-learn / SimpleImputer</code></span>
                <span>Champ : <code>expectedBudget</code></span>
              </div>
            </div>

            <div style={pipelineCardStyle()}>
              <div style={pipelineHeaderStyle('var(--branch-consulting)')}>
                <i className="ph-fill ph-chart-scatter" style={{ fontSize: 18 }} />
                <span>K-Means Clustering (Client Classification)</span>
              </div>
              <p style={pipelineDescStyle()}>
                Classe le portefeuille client en plusieurs segments de valeur (VIP, Standard, Actif, etc.) en exploitant un partitionnement non-supervisé basé sur le chiffre d’affaires total, le nombre de factures et l’engagement.
              </p>
              <div style={pipelineMetaStyle()}>
                <span>Algorithme : <code>K-Means (k=4)</code></span>
                <span>Score : <code>customerScore</code> (0-100)</span>
              </div>
            </div>

            <div style={pipelineCardStyle()}>
              <div style={pipelineHeaderStyle('var(--state-negative)')}>
                <i className="ph-fill ph-pulse" style={{ fontSize: 18 }} />
                <span>Régression Logistique (Churn Risk)</span>
              </div>
              <p style={pipelineDescStyle()}>
                Estime la probabilité qu'un client actif devienne inactif à court terme en évaluant la récence de sa dernière activité, la fréquence de ses réunions et le volume de réclamations enregistrées.
              </p>
              <div style={pipelineMetaStyle()}>
                <span>Modèle : <code>LogisticRegression</code></span>
                <span>Indicateur : <code>churnRiskScore</code> (0-1)</span>
              </div>
            </div>

            <div style={pipelineCardStyle()}>
              <div style={pipelineHeaderStyle('var(--branch-communication)')}>
                <i className="ph-fill ph-funnel" style={{ fontSize: 18 }} />
                <span>Heuristiques de qualification (Leads)</span>
              </div>
              <p style={pipelineDescStyle()}>
                Calcule un score d'opportunité pondéré pour chaque prospect entrant, combinant la réputation du canal d'acquisition, l'adéquation du secteur d'activité et la maturité du besoin formulé.
              </p>
              <div style={pipelineMetaStyle()}>
                <span>Modèle : <code>Heuristic Weights</code></span>
                <span>Score : <code>qualificationScore</code> (0-100)</span>
              </div>
            </div>

            <div style={pipelineCardStyle()}>
              <div style={pipelineHeaderStyle('var(--branch-management)')}>
                <i className="ph-fill ph-user-gear" style={{ fontSize: 18 }} />
                <span>Performance des Consultants</span>
              </div>
              <p style={pipelineDescStyle()}>
                Synthétise un indice de performance pour chaque collaborateur de livraison en agrégeant le taux de succès de ses projets passés, son taux d’occupation réel et la satisfaction moyenne de ses clients.
              </p>
              <div style={pipelineMetaStyle()}>
                <span>Modèle : <code>Composite Scoring</code></span>
                <span>Indicateur : <code>performanceScore</code> (0-100)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategic Alerts Tab */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ padding: '4px 0' }}>
            <h2 style={{ font: '700 18px var(--font-display)', color: 'var(--ink-900)', margin: 0 }}>{t('dataManager.alertsTitle')}</h2>
            <p style={{ font: '400 13px var(--font-text)', color: 'var(--ink-500)', margin: '4px 0 0 0' }}>{t('dataManager.alertsSub')}</p>
          </div>

          {loadingAlerts ? (
            <LoadingState />
          ) : !alertsData ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>
              Aucune donnée à analyser.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
              
              {/* Row 1: KPI Summary of alerts counts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={miniAlertSummaryStyle('var(--state-negative)')}>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{alertsData.churnRisk.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600 }}>Clients à risque d’attrition</div>
                </div>
                <div style={miniAlertSummaryStyle('var(--branch-comptabilite)')}>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{alertsData.upsell.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600 }}>Clients prêts pour upsell</div>
                </div>
                <div style={miniAlertSummaryStyle('var(--branch-academy)')}>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{alertsData.overloadedConsultants.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600 }}>Consultants en surcharge</div>
                </div>
                <div style={miniAlertSummaryStyle('var(--state-negative)')}>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{alertsData.delayedProjects.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600 }}>Projets en retard</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
                {/* 1. Churn Risk Cards */}
                <div style={alertSectionCardStyle()}>
                  <div style={alertSectionHeaderStyle('var(--state-negative)')}>
                    <i className="ph ph-warning-octagon" style={{ color: 'var(--state-negative)', fontSize: 16 }} />
                    Risques d'attrition critiques (Score ≥ 0.6)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                    {alertsData.churnRisk.length === 0 ? (
                      <div style={emptyAlertStyle()}>Aucun client à risque critique.</div>
                    ) : (
                      alertsData.churnRisk.map((c) => (
                        <div key={c.id} style={alertItemRowStyle()}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: 'var(--ink-950)' }}>{c.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 2 }}>
                              {c.company ? `${c.company} · ` : ''}{c.industry}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--ink-500)', background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: branchHex(c.branchKey) }} />
                              {branchLabel(c.branchKey)}
                            </span>
                            <span style={{ font: '700 12px var(--font-mono)', color: 'var(--state-negative)' }}>
                              {formatPct(c.risk * 100, 0)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Upsell Ready Cards */}
                <div style={alertSectionCardStyle()}>
                  <div style={alertSectionHeaderStyle('var(--branch-comptabilite)')}>
                    <i className="ph ph-trend-up" style={{ color: 'var(--branch-comptabilite)', fontSize: 16 }} />
                    Opportunités de Vente Incitative (Upsell)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                    {alertsData.upsell.length === 0 ? (
                      <div style={emptyAlertStyle()}>Aucune opportunité disponible.</div>
                    ) : (
                      alertsData.upsell.map((c) => (
                        <div key={c.id} style={alertItemRowStyle()}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: 'var(--ink-950)' }}>{c.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 2 }}>
                              ID: <code>{c.id}</code>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--ink-500)', background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: branchHex(c.branchKey) }} />
                              {branchLabel(c.branchKey)}
                            </span>
                            <span style={{ font: '700 12px var(--font-mono)', color: 'var(--branch-comptabilite)' }}>
                              Score: {Math.round(c.score)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Overloaded Consultants */}
                <div style={alertSectionCardStyle()}>
                  <div style={alertSectionHeaderStyle('var(--branch-academy)')}>
                    <i className="ph ph-user-gear" style={{ color: 'var(--branch-academy)', fontSize: 16 }} />
                    Collaborateurs surchargés (Occupation &gt; 80% ou &gt; 3 projets)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                    {alertsData.overloadedConsultants.length === 0 ? (
                      <div style={emptyAlertStyle()}>Aucun consultant en surcharge de travail.</div>
                    ) : (
                      alertsData.overloadedConsultants.map((c) => (
                        <div key={c.id} style={alertItemRowStyle()}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: 'var(--ink-950)' }}>{c.fullName}</div>
                            <div style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 2 }}>
                              Code: <code>{c.id}</code>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 11, color: 'var(--ink-700)' }}>
                              <strong style={{ fontFamily: 'var(--font-mono)' }}>{c.activeProjects}</strong> prj. actif{c.activeProjects > 1 ? 's' : ''}
                            </span>
                            <span style={{
                              font: '700 12px var(--font-mono)',
                              color: c.utilizationRate > 0.8 ? 'var(--state-negative)' : 'var(--branch-academy)'
                            }}>
                              {formatPct(c.utilizationRate * 100, 0)} occ.
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. Delivery Issues & Rework Rates */}
                <div style={alertSectionCardStyle()}>
                  <div style={alertSectionHeaderStyle('var(--state-negative)')}>
                    <i className="ph ph-folder-open" style={{ color: 'var(--state-negative)', fontSize: 16 }} />
                    Diagnostics de Livraison & Taux de Rework
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Delayed projects list */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-400)', letterSpacing: '0.04em', marginBottom: 6 }}>
                        Projets en retard
                      </div>
                      {alertsData.delayedProjects.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--ink-400)', background: 'var(--surface-2)', padding: '6px 12px', borderRadius: 4 }}>
                          Aucun projet actif en retard.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                          {alertsData.delayedProjects.map((p) => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 4, fontSize: 11 }}>
                              <span style={{ fontWeight: 600 }}>Projet {p.id} ({p.serviceLine})</span>
                              <span style={{ color: 'var(--state-negative)', fontWeight: 600 }}>Budget: {formatDA(p.budget)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Services rework rate list */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-400)', letterSpacing: '0.04em', marginBottom: 6 }}>
                        Surcharges d’heures par Service (Rework)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {alertsData.serviceReworkRates.length === 0 ? (
                          <div style={emptyAlertStyle()}>Aucun rework détecté.</div>
                        ) : (
                          alertsData.serviceReworkRates.map((s) => (
                            <div key={s.service} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 4, fontSize: 11 }}>
                              <span style={{ fontStyle: 'italic' }}>{s.service}</span>
                              <span style={{ font: '600 11px var(--font-mono)', color: 'var(--orange-600)' }}>
                                {s.reworkRate}% de dépassement ({s.overran}/{s.total} prj.)
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Sales Performance card */}
                <div style={{ ...alertSectionCardStyle(), gridColumn: '1 / -1' }}>
                  <div style={alertSectionHeaderStyle('var(--branch-consulting)')}>
                    <i className="ph ph-identification-card" style={{ color: 'var(--branch-consulting)', fontSize: 16 }} />
                    Indicateurs de Performance Commerciale (Ventes)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    
                    {/* Top Salesperson */}
                    {alertsData.topSales && (
                      <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 6, borderLeft: '3px solid var(--branch-comptabilite)' }}>
                        <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 700 }}>MEILLEUR VENDEUR (Volume CA)</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', marginTop: 4 }}>{alertsData.topSales.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
                          <span>Chiffre d'Affaires:</span>
                          <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--branch-comptabilite)' }}>{formatDA(alertsData.topSales.revenue)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                          <span>Deals Signés:</span>
                          <strong>{alertsData.topSales.deals}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                          <span>Taux de Concrétisation:</span>
                          <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatPct(alertsData.topSales.winRate)}</strong>
                        </div>
                      </div>
                    )}

                    {/* Underperforming Salesperson */}
                    {alertsData.underperformingSales && (
                      <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 6, borderLeft: '3px solid var(--state-negative)' }}>
                        <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 700 }}>MOINS PERFORMANT (Chiffre d’Affaires)</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', marginTop: 4 }}>{alertsData.underperformingSales.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
                          <span>Chiffre d'Affaires:</span>
                          <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--state-negative)' }}>{formatDA(alertsData.underperformingSales.revenue)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                          <span>Deals Signés:</span>
                          <strong>{alertsData.underperformingSales.deals}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                          <span>Taux de Concrétisation:</span>
                          <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatPct(alertsData.underperformingSales.winRate)}</strong>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Styling helpers for visual consistency
function pipelineCardStyle(): React.CSSProperties {
  return {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: 'var(--shadow-card)',
  };
}

function pipelineHeaderStyle(accentColor: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    font: '700 13px/1 var(--font-display)',
    color: 'var(--ink-900)',
    borderBottom: `2px solid ${accentColor}`,
    paddingBottom: 8,
  };
}

// Additional styles
function pipelineDescStyle(): React.CSSProperties {
  return {
    font: '400 12px/1.45 var(--font-text)',
    color: 'var(--ink-500)',
    margin: 0,
    flex: 1,
  };
}

function pipelineMetaStyle(): React.CSSProperties {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    font: '400 10px var(--font-mono)',
    color: 'var(--ink-400)',
    background: 'var(--surface-2)',
    padding: '4px 8px',
    borderRadius: 'var(--radius-xs)',
  };
}

function alertSectionCardStyle(): React.CSSProperties {
  return {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: 16,
    boxShadow: 'var(--shadow-card)',
  };
}

function alertSectionHeaderStyle(borderColor?: string): React.CSSProperties {
  return {
    font: '700 13px/1.2 var(--font-display)',
    color: 'var(--ink-950)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderBottom: borderColor ? `2px solid ${borderColor}` : '1px solid var(--border)',
    paddingBottom: 10,
    marginBottom: 12,
  };
}

function alertItemRowStyle(): React.CSSProperties {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    background: 'var(--surface-2)',
    borderRadius: 'var(--radius-xs)',
    borderLeft: '3px solid transparent',
    fontSize: 12,
  };
}

function miniAlertSummaryStyle(borderColor: string): React.CSSProperties {
  return {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    borderLeft: `4px solid ${borderColor}`,
    boxShadow: 'var(--shadow-xs)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };
}

function emptyAlertStyle(): React.CSSProperties {
  return {
    padding: 14,
    textAlign: 'center',
    color: 'var(--ink-400)',
    fontSize: 11,
    background: 'var(--surface-2)',
    borderRadius: 'var(--radius-xs)',
    fontStyle: 'italic',
  };
}
