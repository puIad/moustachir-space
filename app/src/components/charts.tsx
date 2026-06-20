/**
 * components/charts.tsx — Chart.js (react-chartjs-2) wrappers for the analytics
 * screens. One module registers the controllers/elements once; the exported
 * components are thin, design-system-styled shells around <Line>/<Bar>/<Doughnut>.
 *
 * Canvases can't read CSS custom properties, so colors come from lib/labels.ts
 * (hexes mirroring the tokens) and the few greys are hard-coded to match.
 */

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card } from '../design-system';
import { formatCompact, formatCompactDA, formatDA, formatNumber } from '../lib/format';
import { seriesColor } from '../lib/labels';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Tooltip, Legend, Filler,
);

ChartJS.defaults.font.family =
  "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif";
ChartJS.defaults.font.size = 11;
ChartJS.defaults.color = '#6b7180';

const GRID = '#eceef3';
const INK = '#6b7180';

/* ---- month label (YYYY-MM → "mars 25") ----------------------------------- */
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const mi = Number(m) - 1;
  if (mi < 0 || mi > 11) return ym;
  return `${MONTHS_FR[mi]} ${y.slice(2)}`;
}

/* ========================================================================== *
 *  ChartCard — titled surface with a fixed-height canvas area + optional
 *  provenance dot. Empty datasets fall back to a quiet "no data" state.
 * ========================================================================== */

export interface ChartCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Provenance accent dot color (e.g. orange for projected series). */
  accent?: string;
  height?: number;
  empty?: boolean;
  emptyLabel?: string;
  children: React.ReactNode;
  span2?: boolean;
}

export function ChartCard({
  title, subtitle, accent, height = 260, empty = false, emptyLabel = 'Aucune donnée', children, span2 = false,
}: ChartCardProps) {
  return (
    <Card style={span2 ? { gridColumn: '1 / -1' } : undefined}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {accent && <span style={{ width: 9, height: 9, borderRadius: 3, background: accent, flex: '0 0 auto' }} aria-hidden="true" />}
          <h3 style={{ margin: 0, font: 'var(--fw-bold) var(--fs-h3)/1.2 var(--font-display)', letterSpacing: '-0.01em', color: 'var(--ink-900)' }}>{title}</h3>
        </div>
        {subtitle && <span style={{ font: 'var(--fw-medium) var(--fs-micro)/1 var(--font-text)', color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: 'var(--ls-caps)', whiteSpace: 'nowrap' }}>{subtitle}</span>}
      </div>
      <div style={{ position: 'relative', height }}>
        {empty ? (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--ink-300)', font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-text)', gap: 8 }}>
            <i className="ph ph-chart-bar" style={{ fontSize: 30 }} aria-hidden="true" />
            {emptyLabel}
          </div>
        ) : children}
      </div>
    </Card>
  );
}

/* ========================================================================== *
 *  Shared option builders
 * ========================================================================== */

/* Tooltip callbacks read across line/bar configs; ctx is loosely typed (the
 * Chart.js TooltipItem generic differs per chart type and can't be shared). */
const axisValue = (parsed: { x?: number | null; y?: number | null } | number): number => {
  if (typeof parsed === 'number') return parsed;
  return parsed.y ?? parsed.x ?? 0;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const moneyTooltip = (label?: string) => ({
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    label: (ctx: any) => {
      const v = axisValue(ctx.parsed);
      const name = label ?? ctx.dataset?.label ?? '';
      return `${name ? name + ' : ' : ''}${formatDA(v)}`;
    },
  },
});

const numberTooltip = {
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    label: (ctx: any) => {
      const v = axisValue(ctx.parsed);
      const name = ctx.dataset?.label ?? '';
      return `${name ? name + ' : ' : ''}${formatNumber(v)}`;
    },
  },
};

function moneyAxes(): ChartOptions<'line' | 'bar'>['scales'] {
  return {
    x: { grid: { display: false }, ticks: { color: INK } },
    y: { grid: { color: GRID }, border: { display: false }, ticks: { color: INK, callback: (v) => formatCompact(Number(v)) } },
  };
}

/* ========================================================================== *
 *  Line — single or multi series over months
 * ========================================================================== */

export interface Series { label: string; values: number[]; color: string; fill?: boolean; }

export function LineChart({ labels, series, money = true, id }: { labels: string[]; series: Series[]; money?: boolean; id?: string }) {
  const data = {
    labels,
    datasets: series.map((s) => ({
      label: s.label,
      data: s.values,
      borderColor: s.color,
      backgroundColor: s.fill ? `${s.color}22` : s.color,
      fill: s.fill ?? false,
      tension: 0.35,
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: s.color,
    })),
  };
  const options: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: series.length > 1, position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 14 } },
      tooltip: money ? moneyTooltip() : numberTooltip,
    },
    scales: money ? moneyAxes() : { x: { grid: { display: false }, ticks: { color: INK } }, y: { grid: { color: GRID }, border: { display: false }, ticks: { color: INK, callback: (v) => formatCompact(Number(v)) } } },
  };
  return <Line data={data} options={options} id={id} />;
}

/* ========================================================================== *
 *  Bar — vertical (default) or horizontal; single or grouped series
 * ========================================================================== */

export function BarChart({
  labels, series, money = true, horizontal = false, stacked = false, id,
}: { labels: string[]; series: Series[]; money?: boolean; horizontal?: boolean; stacked?: boolean; id?: string }) {
  const data = {
    labels,
    datasets: series.map((s) => ({
      label: s.label,
      data: s.values,
      backgroundColor: s.color,
      borderRadius: 6,
      maxBarThickness: horizontal ? 22 : 46,
    })),
  };
  const valueAxis = {
    grid: { color: GRID }, border: { display: false },
    ticks: { color: INK, callback: (v: string | number) => formatCompact(Number(v)) },
    stacked,
  };
  const catAxis = { grid: { display: false }, ticks: { color: INK }, stacked };
  const options: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: series.length > 1, position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 14 } },
      tooltip: money ? moneyTooltip() : numberTooltip,
    },
    scales: horizontal
      ? { x: valueAxis, y: catAxis }
      : { x: catAxis, y: valueAxis },
  };
  return <Bar data={data} options={options} id={id} />;
}

/** Per-bar coloring (one series, each bar its own color). */
export function ColoredBarChart({
  labels, values, colors, money = true, horizontal = false, id,
}: { labels: string[]; values: number[]; colors: string[]; money?: boolean; horizontal?: boolean; id?: string }) {
  const data = {
    labels,
    datasets: [{ data: values, backgroundColor: colors, borderRadius: 6, maxBarThickness: horizontal ? 24 : 50 }],
  };
  const valueAxis = {
    grid: { color: GRID }, border: { display: false },
    ticks: { color: INK, callback: (v: string | number) => formatCompact(Number(v)) },
  };
  const catAxis = { grid: { display: false }, ticks: { color: INK } };
  const options: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: money ? moneyTooltip() : numberTooltip },
    scales: horizontal ? { x: valueAxis, y: catAxis } : { x: catAxis, y: valueAxis },
  };
  return <Bar data={data} options={options} id={id} />;
}

/* ========================================================================== *
 *  Doughnut — composition
 * ========================================================================== */

export function DoughnutChart({
  labels, values, colors, money = true, id,
}: { labels: string[]; values: number[]; colors?: string[]; money?: boolean; id?: string }) {
  const palette = colors ?? labels.map((_, i) => seriesColor(i));
  const data = {
    labels,
    datasets: [{ data: values, backgroundColor: palette, borderColor: '#ffffff', borderWidth: 2, hoverOffset: 6 }],
  };
  const options: ChartOptions<'doughnut'> = {
    responsive: true, maintainAspectRatio: false, cutout: '62%',
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label} : ${money ? formatDA(ctx.parsed) : formatNumber(ctx.parsed)}`,
        },
      },
    },
  };
  return <Doughnut data={data} options={options} id={id} />;
}

/* ========================================================================== *
 *  Funnel — descending horizontal bars (Chart.js has no funnel type)
 * ========================================================================== */

export function FunnelChart({ stages, id }: { stages: Array<{ label: string; value: number; color: string }>; id?: string }) {
  const data = {
    labels: stages.map((s) => s.label),
    datasets: [{
      data: stages.map((s) => s.value),
      backgroundColor: stages.map((s) => s.color),
      borderRadius: 6,
      maxBarThickness: 30,
    }],
  };
  const top = stages[0]?.value || 1;
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.x ?? 0;
            return `${formatNumber(v)}  ·  ${((v / top) * 100).toFixed(1)} %`;
          },
        },
      },
    },
    scales: {
      x: { grid: { color: GRID }, border: { display: false }, ticks: { color: INK, callback: (v) => formatCompact(Number(v)) } },
      y: { grid: { display: false }, ticks: { color: '#15171f', font: { weight: 600 } } },
    },
  };
  return <Bar data={data} options={options} id={id} />;
}

export { formatCompactDA };
