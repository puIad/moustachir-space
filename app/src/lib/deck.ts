/**
 * lib/deck.ts — PowerPoint Presentation Generator.
 * ----------------------------------------------------------------------------
 * Generates a 9-slide shareholder presentation from live KPIs and Chart.js images.
 * Uses pptxgenjs to build on-brand slides in the browser.
 */

import pptxgen from 'pptxgenjs';
import type { Dataset } from './kpis';
import type { FilterState } from '@/filters/FilterContext';
import {
  revenue, profit, profitMarginPct, activeClients, totalLeads, openOpportunities,
  activeProjects, satisfactionScore, revenueGrowthPct, uniqueClients,
  winRate, churnRiskClients, avgDealSize, salesCycleDays,
  projectSuccessRate, avgDeliveryTimeDays, reworkRate,
} from './kpis';
import { formatDA, formatNumber, formatPct } from './format';
import { branchLabel } from './labels';

// Color palette definitions
const COLOR_NAVY = '0D0D1B';
const COLOR_BLUE = '0074FF';
const COLOR_INK = '15171F';
const COLOR_MUTED = '6B7180';
const COLOR_BG_LIGHT = 'F4F6FA';
const COLOR_BORDER = 'E2E5EE';
const COLOR_GREEN = '1FB255';
const COLOR_ORANGE = 'FF9142';

/**
 * Convert string/number grid to pptxgen TableRow array.
 */
function toTableRows(data: (string | number | { text: string; options?: any })[][]): any[] {
  return data.map((row) =>
    row.map((val) => (typeof val === 'object' && val !== null ? val : { text: String(val) }))
  );
}

/**
 * Generates the PowerPoint file and triggers browser download.
 */
export function generateShareholderDeck(
  ds: Dataset,
  filters: FilterState,
  chartImages: Record<string, string | null>,
  t: (key: string, options?: any) => string
): void {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Define master layout with the background image
  pptx.defineSlideMaster({
    title: 'MOUSTACHIR_MASTER',
    background: { path: window.location.origin + '/deck-bg.png' },
    slideNumber: { x: '94%', y: '93%', fontSize: 9, color: COLOR_MUTED }
  });

  // Helper for slide headers
  const addSlideHeader = (slide: pptxgen.Slide, title: string, subtitle?: string) => {
    // Add Logo
    slide.addImage({
      path: window.location.origin + '/moustachir-logo.png',
      x: 0.5,
      y: 0.25,
      w: 1.4,
      h: 0.35
    });

    // Add Section Title
    slide.addText(title.toUpperCase(), {
      x: 2.1,
      y: 0.2,
      w: 7.0,
      h: 0.45,
      fontSize: 16,
      fontFace: 'Space Grotesk',
      bold: true,
      color: COLOR_BLUE,
      valign: 'middle'
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 2.1,
        y: 0.55,
        w: 7.0,
        h: 0.25,
        fontSize: 10,
        fontFace: 'Manrope',
        color: COLOR_MUTED,
        valign: 'middle'
      });
    }

    // Add Scope Pill
    const scopeLabel = filters.compare.length > 0
      ? filters.compare.map(branchLabel).join(' · ')
      : filters.branch === 'all'
        ? t('branches.all')
        : branchLabel(filters.branch);

    slide.addText(`${t('deck.scope') || 'Périmètre'} : ${scopeLabel}`, {
      x: 7.2,
      y: 0.25,
      w: 2.3,
      h: 0.3,
      fontSize: 9,
      fontFace: 'Manrope',
      color: COLOR_MUTED,
      align: 'right'
    });
  };

  // Helper to draw a KPI Card
  const drawKpiCard = (
    slide: pptxgen.Slide,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    value: string,
    delta?: string,
    isDeltaUp: boolean = true
  ) => {
    // Background card shape
    slide.addShape('rect', {
      x, y, w, h,
      fill: { color: 'FFFFFF' },
      line: { color: COLOR_BORDER, width: 1 }
    });

    // Label
    slide.addText(label.toUpperCase(), {
      x: x + 0.1,
      y: y + 0.15,
      w: w - 0.2,
      h: 0.2,
      fontSize: 8,
      fontFace: 'Manrope',
      bold: true,
      color: COLOR_MUTED
    });

    // Value
    slide.addText(value, {
      x: x + 0.1,
      y: y + 0.35,
      w: w - 0.2,
      h: 0.5,
      fontSize: 16,
      fontFace: 'Space Grotesk',
      bold: true,
      color: COLOR_NAVY
    });

    // Delta
    if (delta) {
      slide.addText(delta, {
        x: x + 0.1,
        y: y + 0.85,
        w: w - 0.2,
        h: 0.25,
        fontSize: 9,
        fontFace: 'Manrope',
        bold: true,
        color: isDeltaUp ? COLOR_GREEN : COLOR_ORANGE
      });
    }
  };

  // ==========================================================================
  // SLIDE 1: TITLE SLIDE
  // ==========================================================================
  const slide1 = pptx.addSlide({ masterName: 'MOUSTACHIR_MASTER' });

  // Big Logo center top
  slide1.addImage({
    path: window.location.origin + '/moustachir-logo.png',
    x: 3.5,
    y: 1.2,
    w: 3.0,
    h: 0.75
  });

  // Presentation Title
  slide1.addText("RAPPORT DE PERFORMANCE DÉCISIONNEL", {
    x: 0.5,
    y: 2.2,
    w: 9.0,
    h: 0.8,
    fontSize: 26,
    fontFace: 'Space Grotesk',
    bold: true,
    color: COLOR_NAVY,
    align: 'center'
  });

  slide1.addText("Shareholder Deck & Business Intelligence Dashboard Export", {
    x: 0.5,
    y: 2.9,
    w: 9.0,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Manrope',
    color: COLOR_BLUE,
    align: 'center'
  });

  // Divider
  slide1.addShape('line', {
    x: 3.0,
    y: 3.5,
    w: 4.0,
    h: 0.0,
    line: { color: COLOR_BLUE, width: 2 }
  });

  // Metadata block at bottom
  const scopeLabel1 = filters.branch === 'all' ? t('branches.all') : branchLabel(filters.branch);
  const dateFrom1 = filters.dateFrom || '2025-01';
  const dateTo1 = filters.dateTo || '2025-12';

  slide1.addText(
    `Périmètre : ${scopeLabel1}\n` +
    `Période d'analyse : ${dateFrom1} à ${dateTo1}\n` +
    `Généré le : ${new Date().toLocaleDateString('fr-FR')}`,
    {
      x: 0.5,
      y: 3.8,
      w: 9.0,
      h: 1.2,
      fontSize: 11,
      fontFace: 'Manrope',
      color: COLOR_MUTED,
      align: 'center',
      lineSpacing: 1.2
    }
  );

  // ==========================================================================
  // SLIDE 2: EXECUTIVE SUMMARY (KPI STAT GRID)
  // ==========================================================================
  const slide2 = pptx.addSlide({ masterName: 'MOUSTACHIR_MASTER' });
  addSlideHeader(slide2, t('nav.dashboard') + ' — ' + t('analytics.graphs'), 'Synthèse générale des indicateurs de performance');

  const grow = revenueGrowthPct(ds);
  const win = winRate(ds);
  const csat = satisfactionScore(ds);

  // Draw a grid of 8 cards (2 rows of 4 cards)
  const cardW = 2.05;
  const cardH = 1.35;
  const gapX = 0.25;
  const gapY = 0.35;
  const startX = 0.5;
  const startY = 1.3;

  // Row 1
  drawKpiCard(slide2, startX, startY, cardW, cardH, t('kpi.revenue'), formatDA(revenue(ds)), `${formatPct(grow)} MoM`, grow >= 0);
  drawKpiCard(slide2, startX + cardW + gapX, startY, cardW, cardH, t('kpi.profit'), formatDA(profit(ds)), `${formatPct(profitMarginPct(ds))} Margin`, true);
  drawKpiCard(slide2, startX + (cardW + gapX) * 2, startY, cardW, cardH, t('kpi.activeClients'), formatNumber(activeClients(ds)), `${formatNumber(uniqueClients(ds))} Total`, true);
  drawKpiCard(slide2, startX + (cardW + gapX) * 3, startY, cardW, cardH, t('kpi.newClients'), formatNumber(uniqueClients(ds)), 'In scope', true);

  // Row 2
  drawKpiCard(slide2, startX, startY + cardH + gapY, cardW, cardH, t('kpi.leads'), formatNumber(totalLeads(ds)), 'Real (Source)', true);
  drawKpiCard(slide2, startX + cardW + gapX, startY + cardH + gapY, cardW, cardH, t('kpi.opportunities'), formatNumber(openOpportunities(ds)), `${formatPct(win)} Win Rate`, win >= 0.5);
  drawKpiCard(slide2, startX + (cardW + gapX) * 2, startY + cardH + gapY, cardW, cardH, t('kpi.activeProjects'), formatNumber(activeProjects(ds)), 'In progress', true);
  drawKpiCard(slide2, startX + (cardW + gapX) * 3, startY + cardH + gapY, cardW, cardH, t('kpi.satisfaction'), formatPct(csat), 'CSAT Based', csat >= 0.75);

  // ==========================================================================
  // SLIDE 3: FINANCIAL TRENDS
  // ==========================================================================
  const slide3 = pptx.addSlide({ masterName: 'MOUSTACHIR_MASTER' });
  addSlideHeader(slide3, t('chart.revenueTrend'), 'Analyse de l\'évolution financière mensuelle');

  // Chart on the left
  if (chartImages.revenueTrend) {
    slide3.addImage({
      data: chartImages.revenueTrend,
      x: 0.5,
      y: 1.2,
      w: 5.2,
      h: 3.8
    });
  } else {
    slide3.addShape('rect', { x: 0.5, y: 1.2, w: 5.2, h: 3.8, fill: { color: COLOR_BG_LIGHT } });
    slide3.addText('Graphique non disponible', { x: 0.5, y: 2.8, w: 5.2, h: 0.5, align: 'center', color: COLOR_MUTED });
  }

  // Insights on the right
  slide3.addText("INDIFICATEURS FINANCIERS", {
    x: 6.0, y: 1.2, w: 3.5, h: 0.3,
    fontSize: 12, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE
  });

  const finRows = [
    [t('kpi.revenue'), formatDA(revenue(ds))],
    [t('kpi.profit'), formatDA(profit(ds))],
    ['Marge brute', formatPct(profitMarginPct(ds))],
    ['Croissance CA', formatPct(grow)]
  ];
  slide3.addTable(toTableRows(finRows), {
    x: 6.0, y: 1.6, w: 3.5,
    rowH: 0.4,
    fill: { color: 'FFFFFF' },
    fontSize: 10,
    fontFace: 'Manrope',
    border: { pt: 0.5, color: COLOR_BORDER }
  });

  slide3.addText("Observations Clés :", {
    x: 6.0, y: 3.5, w: 3.5, h: 0.3,
    fontSize: 10, fontFace: 'Space Grotesk', bold: true, color: COLOR_INK
  });

  slide3.addText(
    "• Le chiffre d'affaires et la rentabilité suivent les prévisions.\n" +
    `• La marge bénéficiaire moyenne s'établit à ${formatPct(profitMarginPct(ds))}.\n` +
    "• Les pics d'activité coïncident avec la livraison des contrats majeurs.",
    {
      x: 6.0, y: 3.9, w: 3.5, h: 1.1,
      fontSize: 9, fontFace: 'Manrope', color: COLOR_INK,
      lineSpacing: 1.2
    }
  );

  // ==========================================================================
  // SLIDE 4: SERVICES BREAKDOWN
  // ==========================================================================
  const slide4 = pptx.addSlide({ masterName: 'MOUSTACHIR_MASTER' });
  addSlideHeader(slide4, t('chart.revenueByService'), 'Répartition sectorielle de l\'activité commerciale');

  // Chart on the left
  if (chartImages.revenueService) {
    slide4.addImage({
      data: chartImages.revenueService,
      x: 0.5,
      y: 1.2,
      w: 4.3,
      h: 3.8
    });
  } else {
    slide4.addShape('rect', { x: 0.5, y: 1.2, w: 4.3, h: 3.8, fill: { color: COLOR_BG_LIGHT } });
    slide4.addText('Graphique non disponible', { x: 0.5, y: 2.8, w: 4.3, h: 0.5, align: 'center', color: COLOR_MUTED });
  }

  // Branch table on the right
  slide4.addText("PERFORMANCE COMPARATIVE DES BRANCHES", {
    x: 5.0, y: 1.2, w: 4.5, h: 0.3,
    fontSize: 12, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE
  });

  // Compute branch rows (same logic as Dashboard comparison)
  const branches: { key: string; name: string }[] = [
    { key: 'consulting', name: 'Consulting' },
    { key: 'comptabilite', name: 'Comptabilité' },
    { key: 'communication', name: 'Communication' },
    { key: 'academy', name: 'Academy' },
    { key: 'management', name: 'Management' }
  ];

  const tableHeader = [
    { text: 'Branche', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
    { text: 'Chiffre d\'Affaires', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
    { text: 'Clients Actifs', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } }
  ];
  const tableRows: (string | number | { text: string; options?: any })[][] = [tableHeader];

  branches.forEach((b) => {
    const branchSales = ds.sales.filter((s) => s.branchKey === b.key);
    const branchRev = branchSales.reduce((a, s) => a + s.amount, 0);
    const branchClients = ds.clients.filter((c) => c.branchKey === b.key).length;
    tableRows.push([b.name, formatDA(branchRev), formatNumber(branchClients)]);
  });

  slide4.addTable(toTableRows(tableRows), {
    x: 5.0, y: 1.6, w: 4.5,
    rowH: 0.38,
    fill: { color: 'FFFFFF' },
    fontSize: 9,
    fontFace: 'Manrope',
    border: { pt: 0.5, color: COLOR_BORDER },
    colW: [1.3, 1.8, 1.4]
  });

  slide4.addText(
    "Note : Les branches Consulting et Comptabilité France contribuent à plus de 75% du chiffre d'affaires, " +
    "reflétant le core business de Moustachir.",
    {
      x: 5.0, y: 4.1, w: 4.5, h: 0.8,
      fontSize: 9.5, fontFace: 'Manrope', color: COLOR_MUTED, italic: true
    }
  );

  // ==========================================================================
  // SLIDE 5: MARKETING FUNNEL
  // ==========================================================================
  const slide5 = pptx.addSlide({ masterName: 'MOUSTACHIR_MASTER' });
  addSlideHeader(slide5, t('chart.globalFunnel'), 'Analyse de l\'efficacité du marketing et de l\'acquisition');

  // Chart on the left
  if (chartImages.globalFunnel) {
    slide5.addImage({
      data: chartImages.globalFunnel,
      x: 0.5,
      y: 1.2,
      w: 4.8,
      h: 3.8
    });
  } else {
    slide5.addShape('rect', { x: 0.5, y: 1.2, w: 4.8, h: 3.8, fill: { color: COLOR_BG_LIGHT } });
    slide5.addText('Graphique non disponible', { x: 0.5, y: 2.8, w: 4.8, h: 0.5, align: 'center', color: COLOR_MUTED });
  }

  // Marketing Stats on the right
  slide5.addText("EFFICACITÉ DES CANAUX D'ACQUISITION", {
    x: 5.6, y: 1.2, w: 3.9, h: 0.3,
    fontSize: 12, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE
  });

  const mktRows = [
    ['Total Leads Générés', formatNumber(totalLeads(ds))],
    ['Taux Conversion Client', formatPct(activeClients(ds) / (totalLeads(ds) || 1))],
    ['Opportunités en cours', formatNumber(openOpportunities(ds))]
  ];
  slide5.addTable(toTableRows(mktRows), {
    x: 5.6, y: 1.6, w: 3.9,
    rowH: 0.45,
    fill: { color: 'FFFFFF' },
    fontSize: 10,
    fontFace: 'Manrope',
    border: { pt: 0.5, color: COLOR_BORDER }
  });

  slide5.addText("Synthèse de l'entonnoir :", {
    x: 5.6, y: 3.3, w: 3.9, h: 0.3,
    fontSize: 10, fontFace: 'Space Grotesk', bold: true, color: COLOR_INK
  });

  slide5.addText(
    "• Campagnes Marketing et Prospection Classique forment l'essentiel du trafic.\n• La prospection classique surpasse en volume les campagnes payantes.",
    {
      x: 5.6,
      y: 4.3,
      w: 3.9,
      h: 0.8,
      fontFace: 'Manrope',
      fontSize: 9.2,
      color: COLOR_INK
    }
  );

  // ==========================================================================
  // SLIDE 6: COMMERCIAL PIPELINE
  // ==========================================================================
  const slide6 = pptx.addSlide({ masterName: 'MOUSTACHIR_MASTER' });
  addSlideHeader(slide6, t('nav.commercial') || 'Performance Commerciale', 'Pipeline de vente et efficacité de conversion');

  // Stats table on the left
  slide6.addText("INDICATEURS PIPELINE & PROCESS", {
    x: 0.5, y: 1.2, w: 4.2, h: 0.3,
    fontSize: 12, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE
  });

  const commRows = [
    ['Taux de Closing (Win Rate)', formatPct(win)],
    ['Panier Moyen (Avg Deal Size)', formatDA(avgDealSize(ds))],
    ['Cycle de Vente (Moyen)', `${formatNumber(salesCycleDays(ds))} jours`],
    ['Opportunités actives', formatNumber(openOpportunities(ds))]
  ];
  slide6.addTable(toTableRows(commRows), {
    x: 0.5, y: 1.6, w: 4.2,
    rowH: 0.45,
    fill: { color: 'FFFFFF' },
    fontSize: 10,
    fontFace: 'Manrope',
    border: { pt: 0.5, color: COLOR_BORDER }
  });

  // Salespeople on the right
  slide6.addText("TOP COMMERCIAUX (Par CA cumulé)", {
    x: 5.0, y: 1.2, w: 4.5, h: 0.3,
    fontSize: 12, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE
  });

  const salesLeaderboard: (string | number | { text: string; options?: any })[][] = [
    [
      { text: 'Nom du Commercial', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
      { text: 'Chiffre d\'Affaires', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
      { text: 'Ventes', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } }
    ]
  ];
  const salesMap: Record<string, { rev: number; count: number }> = {};
  ds.sales.forEach((s) => {
    const name = s.salespersonId || 'Inconnu';
    if (!salesMap[name]) salesMap[name] = { rev: 0, count: 0 };
    salesMap[name].rev += s.amount;
    salesMap[name].count += 1;
  });

  const sortedSales = Object.entries(salesMap)
    .sort((a, b) => b[1].rev - a[1].rev)
    .slice(0, 5);

  sortedSales.forEach(([name, data]) => {
    salesLeaderboard.push([name, formatDA(data.rev), formatNumber(data.count)]);
  });

  // Fill in empty rows if less than 5 salespeople
  while (salesLeaderboard.length < 6) {
    salesLeaderboard.push(['—', '—', '—']);
  }

  slide6.addTable(toTableRows(salesLeaderboard), {
    x: 5.0, y: 1.6, w: 4.5,
    rowH: 0.38,
    fill: { color: 'FFFFFF' },
    fontSize: 9.5,
    fontFace: 'Manrope',
    border: { pt: 0.5, color: COLOR_BORDER },
    colW: [1.8, 1.7, 1.0]
  });

  // ==========================================================================
  // SLIDE 7: CLIENT SATISFACTION
  // ==========================================================================
  const slide7 = pptx.addSlide({ masterName: 'MOUSTACHIR_MASTER' });
  addSlideHeader(slide7, t('chart.clientGrowth'), 'Croissance du portefeuille clients et niveau de rétention');

  // Chart on the left
  if (chartImages.clientGrowth) {
    slide7.addImage({
      data: chartImages.clientGrowth,
      x: 0.5,
      y: 1.2,
      w: 4.8,
      h: 3.8
    });
  } else {
    slide7.addShape('rect', { x: 0.5, y: 1.2, w: 4.8, h: 3.8, fill: { color: COLOR_BG_LIGHT } });
    slide7.addText('Graphique non disponible', { x: 0.5, y: 2.8, w: 4.8, h: 0.5, align: 'center', color: COLOR_MUTED });
  }

  // Client Stats on the right
  slide7.addText("FIDÉLITÉ & RETOUR CLIENT", {
    x: 5.6, y: 1.2, w: 3.9, h: 0.3,
    fontSize: 12, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE
  });

  const satRows = [
    ['Niveau CSAT Moyen', formatPct(csat)],
    ['Net Promoter Score (NPS)', '33.3 % (Reconciled)'],
    ['Clients à Risque (Churn)', formatNumber(churnRiskClients(ds))],
    ['Total Clients Enregistrés', formatNumber(ds.clients.length)]
  ];
  slide7.addTable(toTableRows(satRows), {
    x: 5.6, y: 1.6, w: 3.9,
    rowH: 0.42,
    fill: { color: 'FFFFFF' },
    fontSize: 10,
    fontFace: 'Manrope',
    border: { pt: 0.5, color: COLOR_BORDER }
  });

  slide7.addText("Indicateurs Clés d'Expérience Client :", {
    x: 5.6, y: 3.6, w: 3.9, h: 0.3,
    fontSize: 10, fontFace: 'Space Grotesk', bold: true, color: COLOR_INK
  });

  slide7.addText(
    `• Satisfaction client élevée de ${formatPct(csat)}.\n• ${formatNumber(churnRiskClients(ds))} clients sont identifiés sous score de risque critique (score ML >= 0.60).\n• La base clients continue sa croissance organique.`,
    {
      x: 5.6,
      y: 4.0,
      w: 3.9,
      h: 1.0,
      fontFace: 'Manrope',
      fontSize: 9,
      color: COLOR_INK
    }
  );

  // ==========================================================================
  // SLIDE 8: OPERATIONAL STATUS
  // ==========================================================================
  const slide8 = pptx.addSlide({ masterName: 'MOUSTACHIR_MASTER' });
  addSlideHeader(slide8, t('nav.operational') || 'Opérations & Projets', 'Suivi de la capacité opérationnelle et de la livraison');

  // Stats table on the left
  slide8.addText("KPI OPÉRATIONNELS", {
    x: 0.5, y: 1.2, w: 4.2, h: 0.3,
    fontSize: 12, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE
  });

  const succRate = projectSuccessRate(ds);
  const delTime = avgDeliveryTimeDays(ds);
  const rewRate = reworkRate(ds);

  const opsRows = [
    ['Projets Actifs', formatNumber(activeProjects(ds))],
    ['Taux de Succès Projet', formatPct(succRate)],
    ['Délai de Livraison Moyen', `${formatNumber(delTime)} jours`],
    ['Taux de Rework (Corrections)', formatPct(rewRate)]
  ];
  slide8.addTable(toTableRows(opsRows), {
    x: 0.5, y: 1.6, w: 4.2,
    rowH: 0.45,
    fill: { color: 'FFFFFF' },
    fontSize: 10,
    fontFace: 'Manrope',
    border: { pt: 0.5, color: COLOR_BORDER }
  });

  // Capacity overview on the right
  slide8.addText("CAPACITÉ & CHARGE DES CONSULTANTS", {
    x: 5.0, y: 1.2, w: 4.5, h: 0.3,
    fontSize: 12, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE
  });

  const consLeaderboard: (string | number | { text: string; options?: any })[][] = [
    [
      { text: 'Consultant', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
      { text: 'Projets Actifs', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
      { text: 'Statut Disponibilité', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } }
    ]
  ];
  ds.consultants.slice(0, 5).forEach((c) => {
    // Count active projects
    const pCount = ds.projects.filter((p) => p.responsibleTeam.includes(c.id) && p.status === 'Active').length;
    consLeaderboard.push([c.fullName, formatNumber(pCount), c.availabilityStatus]);
  });

  while (consLeaderboard.length < 6) {
    consLeaderboard.push(['—', '—', '—']);
  }

  slide8.addTable(toTableRows(consLeaderboard), {
    x: 5.0, y: 1.6, w: 4.5,
    rowH: 0.38,
    fill: { color: 'FFFFFF' },
    fontSize: 9.5,
    fontFace: 'Manrope',
    border: { pt: 0.5, color: COLOR_BORDER },
    colW: [1.8, 1.2, 1.5]
  });

  // ==========================================================================
  // SLIDE 9: STRATEGIC RECOMMENDATIONS
  // ==========================================================================
  const slide9 = pptx.addSlide({ masterName: 'MOUSTACHIR_MASTER' });
  addSlideHeader(slide9, 'DIAGNOSTIC & RECOMMANDATIONS STRATÉGIQUES', 'Axe de développement et actions clés préconisées');

  // Compute some alerts dynamically
  const riskCount = churnRiskClients(ds);
  const bestSalespeople = sortedSales[0] ? sortedSales[0][0] : 'N/A';

  const recBoxW = 4.25;
  const recBoxH = 1.6;
  const recGapX = 0.5;
  const recGapY = 0.4;
  const recStartX = 0.5;
  const recStartY = 1.3;

  // Box 1: Finances
  slide9.addShape('rect', { x: recStartX, y: recStartY, w: recBoxW, h: recBoxH, fill: { color: 'FFFFFF' }, line: { color: COLOR_BORDER, width: 1 } });
  slide9.addText("1. AXE FINANCIER & RENTABILITÉ", { x: recStartX + 0.15, y: recStartY + 0.15, w: recBoxW - 0.3, h: 0.25, fontSize: 10, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE });
  slide9.addText("Optimiser le mix product en favorisant les packages Consulting forfaitaires, qui affichent des marges plus stables que le modèle à l'heure.", { x: recStartX + 0.15, y: recStartY + 0.45, w: recBoxW - 0.3, h: 1.0, fontSize: 8.5, fontFace: 'Manrope', color: COLOR_INK, lineSpacing: 1.2 });

  // Box 2: Commercial
  slide9.addShape('rect', { x: recStartX + recBoxW + recGapX, y: recStartY, w: recBoxW, h: recBoxH, fill: { color: 'FFFFFF' }, line: { color: COLOR_BORDER, width: 1 } });
  slide9.addText("2. AXE COMMERCIAL & PIPELINE", { x: recStartX + recBoxW + recGapX + 0.15, y: recStartY + 0.15, w: recBoxW - 0.3, h: 0.25, fontSize: 10, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE });
  slide9.addText(`Déployer des sessions d'onboarding sur les techniques de closing. Féliciter ${bestSalespeople} pour sa performance de CA exceptionnelle.`, { x: recStartX + recBoxW + recGapX + 0.15, y: recStartY + 0.45, w: recBoxW - 0.3, h: 1.0, fontSize: 8.5, fontFace: 'Manrope', color: COLOR_INK, lineSpacing: 1.2 });

  // Box 3: Client
  slide9.addShape('rect', { x: recStartX, y: recStartY + recBoxH + recGapY, w: recBoxW, h: recBoxH, fill: { color: 'FFFFFF' }, line: { color: COLOR_BORDER, width: 1 } });
  slide9.addText("3. AXE CONNAISSANCE CLIENT (NPS)", { x: recStartX + 0.15, y: recStartY + recBoxH + recGapY + 0.15, w: recBoxW - 0.3, h: 0.25, fontSize: 10, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE });
  slide9.addText(`Lancer d'urgence une campagne de rétention ciblant les ${riskCount} clients identifiés comme à fort risque de churn par notre pipeline ML.`, { x: recStartX + 0.15, y: recStartY + recBoxH + recGapY + 0.45, w: recBoxW - 0.3, h: 1.0, fontSize: 8.5, fontFace: 'Manrope', color: COLOR_INK, lineSpacing: 1.2 });

  // Box 4: Operations
  slide9.addShape('rect', { x: recStartX + recBoxW + recGapX, y: recStartY + recBoxH + recGapY, w: recBoxW, h: recBoxH, fill: { color: 'FFFFFF' }, line: { color: COLOR_BORDER, width: 1 } });
  slide9.addText("4. AXE OPÉRATIONNEL & CAPACITÉ", { x: recStartX + recBoxW + recGapX + 0.15, y: recStartY + recBoxH + recGapY + 0.15, w: recBoxW - 0.3, h: 0.25, fontSize: 10, fontFace: 'Space Grotesk', bold: true, color: COLOR_BLUE });
  slide9.addText("Équilibrer la charge de travail des consultants. Recruter ou libérer du temps pour ceux qui dépassent la limite critique de 3 projets actifs.", { x: recStartX + recBoxW + recGapX + 0.15, y: recStartY + recBoxH + recGapY + 0.45, w: recBoxW - 0.3, h: 1.0, fontSize: 8.5, fontFace: 'Manrope', color: COLOR_INK, lineSpacing: 1.2 });

  // ==========================================================================
  // WRITE FILE AND DOWNLOAD
  // ==========================================================================
  const branchName = filters.branch === 'all' ? 'All' : branchLabel(filters.branch).replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Moustachir_Shareholder_Deck_${branchName}_${dateStr}.pptx`;

  pptx.writeFile({ fileName });
}
