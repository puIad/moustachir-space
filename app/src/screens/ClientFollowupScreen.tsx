/**
 * ClientFollowupScreen — Client Follow-up (acquisition counts REAL; scores/NPS
 * SIMULATED). Cards: Total / Active / VIP / Satisfaction / Churn. KPIs:
 * Retention, Churn, NPS, CSAT, LTV. Sections: segmentation
 * (industry/country/size/service), behaviour & growth/upsell opportunities.
 * Graphs: Client Growth, Segmentation, Retention/Satisfaction Trend, Service
 * Adoption Matrix. Mixed provenance ⇒ PROJECTION badge.
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
  uniqueClients, activeClients, vipClients, satisfactionScore, churnRate,
  retentionRate, nps, csat, ltv, upsellClients, churnRiskClients,
  clientGrowthByMonth, clientsByIndustry, clientsByCountry, clientsBySize, clientsByService,
  satisfactionByMonth,
} from '../lib/kpis';
import { formatDA, formatNumber, formatPct } from '../lib/format';
import { serviceLabel, serviceHex, seriesColor } from '../lib/labels';

export function ClientFollowupScreen() {
  const { t } = useTranslation();
  const { ready, ds } = useAnalytics();
  const scope = useScope();

  if (!ready) return <LoadingState />;

  const growth = clientGrowthByMonth(ds);
  const byIndustry = clientsByIndustry(ds);
  const byCountry = clientsByCountry(ds);
  const bySize = clientsBySize(ds);
  const byService = clientsByService(ds);
  const satTrend = satisfactionByMonth(ds);

  const industryEntries = Object.entries(byIndustry).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const countryEntries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const serviceEntries = Object.entries(byService).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <ScreenHeader
        icon="ph-address-book"
        title={t('nav.clientFollowup')}
        subtitle={t('analytics.clientSub')}
        scope={scope}
        accent="var(--branch-academy)"
        projection
      />

      <KpiGrid>
        <Kpi icon="ph-users" accent="var(--branch-academy)" label={t('kpi.totalClients')} value={formatNumber(uniqueClients(ds))} delta={t('badge.real')} deltaTone="flat" />
        <Kpi icon="ph-user-check" accent="var(--green-500)" label={t('kpi.activeClients')} value={formatNumber(activeClients(ds))} delta={t('kpi.inScope')} deltaTone="up" />
        <Kpi icon="ph-crown" accent="var(--orange-500)" label={t('kpi.vip')} value={formatNumber(vipClients(ds))} delta={t('kpi.vip')} deltaTone="up" projected />
        <Kpi icon="ph-smiley" accent="var(--blue-500)" label={t('kpi.satisfaction')} value={`${formatNumber(satisfactionScore(ds))}/100`} delta={t('kpi.avgScore')} deltaTone="up" projected />
        <Kpi icon="ph-user-minus" accent="var(--red-500)" label={t('kpi.churn')} value={formatPct(churnRate(ds))} delta={t('kpi.ofClients')} deltaTone="down" projected />
      </KpiGrid>

      <KpiGrid>
        <Kpi icon="ph-shield-check" accent="var(--green-500)" label={t('kpi.retention')} value={formatPct(retentionRate(ds))} delta={t('kpi.ofClients')} deltaTone="up" projected />
        <Kpi icon="ph-user-minus" accent="var(--red-500)" label={t('kpi.churn')} value={formatPct(churnRate(ds))} delta={t('kpi.ofClients')} deltaTone="down" projected />
        <Kpi icon="ph-chart-line-up" accent="var(--violet-500)" label={t('kpi.nps')} value={formatPct(nps(ds))} delta="NPS" deltaTone="up" projected />
        <Kpi icon="ph-thumbs-up" accent="var(--blue-500)" label={t('kpi.csat')} value={formatPct(csat(ds))} delta={t('kpi.csatBased')} deltaTone="up" projected />
        <Kpi icon="ph-coins" accent="var(--orange-500)" label={t('kpi.ltv')} value={formatDA(ltv(ds))} delta={t('kpi.ltv')} deltaTone="flat" projected />
      </KpiGrid>

      <SectionTitle icon="ph-squares-four">{t('analytics.segmentation')}</SectionTitle>
      <ChartGrid>
        <ChartCard title={t('chart.segIndustry')} subtitle={t('badge.real')} accent="var(--branch-academy)" empty={industryEntries.length === 0}>
          <ColoredBarChart labels={industryEntries.map((c) => c[0])} values={industryEntries.map((c) => c[1])} colors={industryEntries.map((_, i) => seriesColor(i))} money={false} horizontal />
        </ChartCard>

        <ChartCard title={t('chart.segCountry')} empty={countryEntries.length === 0}>
          <ColoredBarChart labels={countryEntries.map((c) => c[0])} values={countryEntries.map((c) => c[1])} colors={countryEntries.map((_, i) => seriesColor(i))} money={false} horizontal />
        </ChartCard>

        <ChartCard title={t('chart.segSize')} empty={Object.keys(bySize).length === 0}>
          <DoughnutChart labels={Object.keys(bySize)} values={Object.values(bySize)} money={false} />
        </ChartCard>

        <ChartCard title={t('chart.serviceAdoption')} subtitle={t('badge.real')} accent="var(--green-500)" empty={serviceEntries.length === 0}>
          <ColoredBarChart labels={serviceEntries.map((c) => serviceLabel(c[0]))} values={serviceEntries.map((c) => c[1])} colors={serviceEntries.map((c) => serviceHex(c[0]))} money={false} horizontal />
        </ChartCard>
      </ChartGrid>

      <SectionTitle icon="ph-trend-up">{t('analytics.satisfactionSection')}</SectionTitle>
      <ChartGrid>
        <ChartCard title={t('chart.clientGrowth2')} subtitle={t('badge.real')} accent="var(--branch-academy)" empty={growth.length === 0} span2>
          <LineChart
            labels={growth.map((g) => monthLabel(g.month))}
            series={[
              { label: t('kpi.totalShort'), values: growth.map((g) => g.total), color: '#6d4bd8', fill: true },
              { label: t('kpi.newClients'), values: growth.map((g) => g.added), color: '#1fb255' },
            ]}
            money={false}
          />
        </ChartCard>

        <ChartCard title={t('chart.satisfactionTrend')} empty={satTrend.length === 0} span2>
          <LineChart
            labels={satTrend.map((s) => monthLabel(s.month))}
            series={[
              { label: t('kpi.csat'), values: satTrend.map((s) => s.csat), color: '#0074ff', fill: true },
              { label: t('kpi.nps'), values: satTrend.map((s) => s.nps), color: '#8b5cf6' },
            ]}
            money={false}
          />
        </ChartCard>
      </ChartGrid>

      <SectionTitle icon="ph-lightbulb">{t('analytics.behaviorGrowth')}</SectionTitle>
      <ChartGrid min={300}>
        <InsightCard tone="positive" title={t('insight.retentionTitle')}>
          {t('insight.retention', { rate: formatPct(retentionRate(ds)) })}
        </InsightCard>
        <InsightCard tone="neutral" title={t('insight.vipTitle')}>
          {t('insight.vip', { count: vipClients(ds) })} · {formatNumber(upsellClients(ds))} {t('kpi.upsell')}
        </InsightCard>
        <InsightCard tone="warning" title={t('insight.churnTitle')}>
          {t('insight.churn', { count: churnRiskClients(ds) })}
        </InsightCard>
      </ChartGrid>
    </div>
  );
}
