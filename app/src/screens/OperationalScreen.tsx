/**
 * OperationalScreen — Operational Performance (projects/consultants SIMULATED).
 * Cards: Active Projects / Delayed / Completed / Consultant Utilization /
 * Complaints. KPIs: Project Success, On-Time, Delivery Time, Utilization, Rework.
 * Sections: projects, consultants/capacity. Graphs: Project Status, Delivery
 * Time Trend, Utilization, Workload, Project Profitability. PROJECTION badge.
 */

import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../lib/useAnalytics';
import {
  ScreenHeader, KpiGrid, Kpi, SectionTitle, ChartGrid, InsightCard, LoadingState, useScope,
} from '../components/analytics';
import {
  ChartCard, LineChart, ColoredBarChart, DoughnutChart, monthLabel,
} from '../components/charts';
import {
  activeProjects, delayedProjects, completedProjects, utilizationRate, complaintsCount,
  openComplaints, projectSuccessRate, onTimeDeliveryRate, avgDeliveryTimeDays, reworkRate,
  projectsByStatus, deliveryTimeByMonth, utilizationByConsultant, workloadByConsultant,
  projectProfitByBranch,
} from '../lib/kpis';
import { formatDA, formatNumber, formatPct } from '../lib/format';
import { branchLabel, branchHex, seriesColor } from '../lib/labels';

export function OperationalScreen() {
  const { t } = useTranslation();
  const { ready, ds } = useAnalytics();
  const scope = useScope();

  if (!ready) return <LoadingState />;

  const byStatus = projectsByStatus(ds);
  const deliveryTrend = deliveryTimeByMonth(ds);
  const utilization = utilizationByConsultant(ds);
  const workload = workloadByConsultant(ds);
  const profitByBranch = Object.entries(projectProfitByBranch(ds)).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <ScreenHeader
        icon="ph-gear-six"
        title={t('nav.operational')}
        subtitle={t('analytics.operationalSub')}
        scope={scope}
        accent="var(--branch-management)"
        projection
      />

      <KpiGrid>
        <Kpi icon="ph-rocket-launch" accent="var(--branch-management)" label={t('kpi.activeProjects')} value={formatNumber(activeProjects(ds))} delta={t('kpi.inProgress')} deltaTone="up" projected />
        <Kpi icon="ph-clock-afternoon" accent="var(--red-500)" label={t('kpi.delayed')} value={formatNumber(delayedProjects(ds))} delta={t('kpi.delayed')} deltaTone="down" projected />
        <Kpi icon="ph-check-circle" accent="var(--green-500)" label={t('kpi.completed')} value={formatNumber(completedProjects(ds))} delta={`${formatPct(projectSuccessRate(ds))} ${t('kpi.projectSuccess')}`} deltaTone="up" projected />
        <Kpi icon="ph-gauge" accent="var(--blue-500)" label={t('kpi.utilization')} value={formatPct(utilizationRate(ds))} delta={t('analytics.capacitySection')} deltaTone="flat" projected />
        <Kpi icon="ph-warning-circle" accent="var(--orange-500)" label={t('kpi.complaints')} value={formatNumber(complaintsCount(ds))} delta={`${formatNumber(openComplaints(ds))} ${t('kpi.open')}`} deltaTone="down" projected />
      </KpiGrid>

      <KpiGrid>
        <Kpi icon="ph-trophy" accent="var(--green-500)" label={t('kpi.projectSuccess')} value={formatPct(projectSuccessRate(ds))} delta={t('kpi.completed')} deltaTone="up" projected />
        <Kpi icon="ph-timer" accent="var(--blue-500)" label={t('kpi.onTime')} value={formatPct(onTimeDeliveryRate(ds))} delta={t('kpi.onTime')} deltaTone="up" projected />
        <Kpi icon="ph-calendar-check" accent="var(--branch-management)" label={t('kpi.deliveryTime')} value={`${formatNumber(avgDeliveryTimeDays(ds))} ${t('kpi.days')}`} delta={t('kpi.deliveryTime')} deltaTone="flat" projected />
        <Kpi icon="ph-gauge" accent="var(--violet-500)" label={t('kpi.utilization')} value={formatPct(utilizationRate(ds))} delta={t('analytics.capacitySection')} deltaTone="flat" projected />
        <Kpi icon="ph-arrow-counter-clockwise" accent="var(--red-500)" label={t('kpi.rework')} value={formatPct(reworkRate(ds))} delta={t('kpi.rework')} deltaTone="down" projected />
      </KpiGrid>

      <SectionTitle icon="ph-kanban">{t('analytics.projectsSection')}</SectionTitle>
      <ChartGrid>
        <ChartCard title={t('chart.projectStatus')} subtitle={t('badge.projection')} accent="var(--branch-management)" empty={Object.keys(byStatus).length === 0}>
          <DoughnutChart labels={Object.keys(byStatus)} values={Object.values(byStatus)} money={false} />
        </ChartCard>

        <ChartCard title={t('chart.deliveryTrend')} empty={deliveryTrend.length === 0}>
          <LineChart labels={deliveryTrend.map((d) => monthLabel(d.month))} series={[{ label: t('kpi.deliveryTime'), values: deliveryTrend.map((d) => d.days), color: '#6d4bd8', fill: true }]} money={false} />
        </ChartCard>

        <ChartCard title={t('chart.projectProfitability')} empty={profitByBranch.length === 0} span2>
          <ColoredBarChart labels={profitByBranch.map((b) => branchLabel(b[0]))} values={profitByBranch.map((b) => b[1])} colors={profitByBranch.map((b) => branchHex(b[0]))} />
        </ChartCard>
      </ChartGrid>

      <SectionTitle icon="ph-users-three">{t('analytics.capacitySection')}</SectionTitle>
      <ChartGrid>
        <ChartCard title={t('chart.utilizationByConsultant')} empty={utilization.length === 0}>
          <ColoredBarChart labels={utilization.map((c) => c.name)} values={utilization.map((c) => c.utilization)} colors={utilization.map((_, i) => seriesColor(i))} money={false} horizontal />
        </ChartCard>

        <ChartCard title={t('chart.workload')} empty={workload.length === 0}>
          <ColoredBarChart labels={workload.map((c) => c.name)} values={workload.map((c) => c.projects)} colors={workload.map((_, i) => seriesColor(i))} money={false} horizontal />
        </ChartCard>
      </ChartGrid>

      <SectionTitle icon="ph-lightbulb">{t('analytics.strategic')}</SectionTitle>
      <ChartGrid min={300}>
        <InsightCard tone="neutral" title={t('insight.utilizationTitle')}>
          {t('insight.utilization', { rate: formatPct(utilizationRate(ds)) })}
        </InsightCard>
        {delayedProjects(ds) > 0 && (
          <InsightCard tone="warning" title={t('insight.delayTitle')}>
            {t('insight.delay', { count: delayedProjects(ds) })}
          </InsightCard>
        )}
        <InsightCard tone="positive" title={t('insight.winTitle')}>
          {formatPct(projectSuccessRate(ds))} · {formatDA(profitByBranch.reduce((s, b) => s + b[1], 0))}
        </InsightCard>
      </ChartGrid>
    </div>
  );
}
