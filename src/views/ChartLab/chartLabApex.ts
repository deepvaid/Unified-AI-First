/**
 * Shared ApexCharts chrome for the Chart Lab prototype.
 *
 * Reuses the token-backed light chart chrome from the design system (via
 * CHART_THEMES) without touching the module-global palette state — the lab
 * never calls applyChartPalette().
 */
import type { ApexOptions } from 'apexcharts'
import { CHART_THEMES } from '@/plugins/chartPalette'

export const LAB_CHROME = CHART_THEMES.grayBlue.light.chrome

export const LAB_FONT = 'Inter, system-ui, sans-serif'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
}

/** Base options every lab Apex chart spreads first — dotted horizontal grid only. */
export function labBaseOptions(): ApexOptions {
  return {
    chart: {
      fontFamily: LAB_FONT,
      toolbar: { show: false },
      zoom: { enabled: false },
      parentHeightOffset: 0,
      animations: { enabled: !prefersReducedMotion(), speed: 300 },
    },
    grid: {
      borderColor: LAB_CHROME.grid,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 8, right: 16 },
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: LAB_CHROME.axisLabel, fontSize: '11px' } },
      crosshairs: {
        show: true,
        width: 1,
        stroke: { color: LAB_CHROME.axisLabel, width: 1, dashArray: 4 },
      },
    },
    yaxis: {
      labels: { style: { colors: LAB_CHROME.axisLabel, fontSize: '11px' } },
    },
    tooltip: { theme: LAB_CHROME.tooltipTheme },
    dataLabels: { enabled: false },
    legend: { show: false },
  }
}

export interface TooltipRow {
  color: string
  label: string
  value: string
}

/**
 * Card-style rich tooltip (title + colored-dot rows) via Apex's tooltip.custom.
 * The returned node renders inside the chart root, so consumers style it with
 * scoped :deep(.lab-tip) rules; a shared skin also lives in ChartLabView.
 */
export function cardTooltip(build: (dataPointIndex: number) => { title: string; rows: TooltipRow[] }) {
  return ({ dataPointIndex }: { dataPointIndex: number }) => {
    const { title, rows } = build(dataPointIndex)
    const items = rows
      .map(
        (r) =>
          `<div class="lab-tip__row"><span class="lab-tip__dot" style="background:${r.color}"></span><span class="lab-tip__label">${r.label}</span><span class="lab-tip__value">${r.value}</span></div>`,
      )
      .join('')
    return `<div class="lab-tip"><div class="lab-tip__title">${title}</div>${items}</div>`
  }
}
