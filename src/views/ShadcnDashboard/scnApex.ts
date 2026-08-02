/**
 * shadcn-style ApexCharts chrome for the shadcn dashboard lab.
 *
 * Palette and chart chrome measured live from ui.shadcn.com/charts:
 * Tailwind v4 blue ramp (--chart-1..5), horizontal-only faint solid grid,
 * no axis lines/ticks, 12px muted axis labels, hidden y-axis labels.
 */
import type { ApexOptions } from 'apexcharts'
import { computed, onMounted, ref, type ComputedRef, type Ref } from 'vue'
import { useTheme } from 'vuetify'
import { prefersReducedMotion } from '../ChartLab/chartLabApex'

/** --chart-1..5 as measured on ui.shadcn.com (blue-300/500/700/800/900). */
export const SCN_CHART = ['#8EC5FF', '#2B7FFF', '#1447E6', '#193CB8', '#1C398E'] as const

export interface ScnChrome {
  grid: string
  axis: string
  fg: string
  muted: string
  cardBg: string
}

/** Theme-reactive chrome colors (Apex options can't read CSS vars). */
export function useScnChrome(): ComputedRef<ScnChrome> {
  const theme = useTheme()
  return computed(() =>
    theme.current.value.dark
      ? { grid: '#262626', axis: '#A1A1A1', fg: '#FAFAFA', muted: '#A1A1A1', cardBg: '#171717' }
      : { grid: '#E8E8E8', axis: '#737373', fg: '#0A0A0A', muted: '#737373', cardBg: '#FFFFFF' },
  )
}

/**
 * Defer chart mounting until just after first layout — Apex measures its
 * container once on mount, and the app-shell grid isn't final on the very
 * first paint (charts otherwise render at a collapsed width). setTimeout
 * (not rAF) so charts still mount while the tab is hidden.
 */
export function useDeferredMount(): Ref<boolean> {
  const ready = ref(false)
  onMounted(() => {
    setTimeout(() => (ready.value = true), 150)
  })
  return ready
}

/** Base options every scn Apex chart spreads first. */
export function scnBaseOptions(chrome: ScnChrome): ApexOptions {
  return {
    chart: {
      fontFamily: 'Inter, system-ui, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false },
      parentHeightOffset: 0,
      animations: { enabled: !prefersReducedMotion(), speed: 300 },
    },
    grid: {
      borderColor: chrome.grid,
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 8, right: 8 },
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: chrome.axis, fontSize: '12px' },
        offsetY: 2,
        rotate: 0,
        rotateAlways: false,
        hideOverlappingLabels: true,
      },
      crosshairs: { show: true, width: 1, stroke: { color: chrome.grid, width: 1, dashArray: 0 } },
    },
    yaxis: { labels: { show: false } },
    tooltip: { theme: 'light' },
    dataLabels: { enabled: false },
    legend: { show: false },
  }
}
