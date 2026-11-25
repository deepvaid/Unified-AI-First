import { ref } from 'vue'
import { defineStore } from 'pinia'
import { keepPerChannel } from '@/stores/demoKeep'
import { useCommerceStore } from '@/stores/useCommerce'
import type { Product } from '@/stores/useCommerce'
import { SEEDED_DEMO_CHANNELS, demoChannelRecord, demoSnapshotOf, replaceStoreRows } from '@/stores/useSalesChannels'
import { canApplyTheme } from '@/storefront/demoStores'
import type { InstallChannel } from '@/storefront/demoStores/install'
import { chartFor } from '@/storefront/sizeCharts'
import type { SizeChart, SizedProduct, SizeUnit } from '@/storefront/sizeCharts'

// Size charts (Products › Size charts): one table of measurements per kind of
// garment, which a product links by `detail.sizeChartId` and shows in the size
// guide on its page. A store that can take a theme gets the charts of the theme
// it runs (src/storefront/demoStores/; Northfold's five, none for Vitaheal) and
// keeps the merchant's changes in the browser, per store, under `size-charts.v1`.
// The rules (which chart a product shows, inches and centimetres) are pure, in
// src/storefront/sizeCharts.ts.

export type { SizeChart, SizeUnit }

/** Saved charts are only read back when they still look like charts. */
function isSizeChartList(value: unknown): value is SizeChart[] {
  const strings = (list: unknown): boolean => Array.isArray(list) && list.every((item) => typeof item === 'string')
  return Array.isArray(value) && value.every((chart: Partial<SizeChart> | null) =>
    !!chart && typeof chart.id === 'string' && typeof chart.channelId === 'string' && typeof chart.name === 'string'
    && (chart.unit === 'in' || chart.unit === 'cm') && strings(chart.columns)
    && Array.isArray(chart.rows) && chart.rows.every((row) => !!row && typeof row.size === 'string' && strings(row.values))
    && typeof chart.fitNote === 'string' && typeof chart.howToMeasure === 'string')
}

/** A store's charts as the theme it runs now seeds them; none for a store that started blank. */
const seededCharts = (channel: InstallChannel | undefined): SizeChart[] => demoSnapshotOf(channel)?.sizeCharts ?? []

let chartIdCounter = 0
function newChartId(): string {
  chartIdCounter += 1
  return `size-chart-${Date.now().toString(36)}-${chartIdCounter}`
}

/** A new chart's starting point: the five letter sizes and the two measurements most tops are sized by. */
export function emptySizeChart(channelId: string, unit: SizeUnit = 'in'): Omit<SizeChart, 'id'> {
  return {
    channelId,
    name: '',
    unit,
    columns: ['Chest', 'Waist'],
    rows: ['XS', 'S', 'M', 'L', 'XL'].map((size) => ({ size, values: ['', ''] })),
    fitNote: '',
    howToMeasure: '',
  }
}

/** A deep copy, so an edited chart never shares its arrays with the one it came from. */
const copyOf = <T extends Omit<SizeChart, 'id'>>(chart: T): T => ({
  ...chart,
  columns: [...chart.columns],
  rows: chart.rows.map((row) => ({ size: row.size, values: [...row.values] })),
})

/** What deleting a chart did: nothing while products use it and the delete was not confirmed. */
export interface SizeChartDeleteResult {
  deleted: boolean
  /** The products that showed the chart (and no longer do, once deleted). */
  usedBy: Pick<Product, 'id' | 'name'>[]
}

export const useSizeChartsStore = defineStore('sizeCharts', () => {
  const charts = ref<SizeChart[]>([])

  const setStoreCharts = (channelId: string, list: SizeChart[]): void => {
    charts.value = replaceStoreRows(charts.value, (chart) => chart.channelId === channelId, list.filter((chart) => chart.channelId === channelId))
  }
  const kept = keepPerChannel('size-charts', 1, isSizeChartList, {
    read: (channelId) => charts.value.filter((chart) => chart.channelId === channelId),
    take: (channelId, saved) => setStoreCharts(channelId, saved ?? seededCharts(demoChannelRecord(channelId))),
  })

  /** The stores whose charts are seeded and kept (attachStore): each only once. */
  const attached = new Set<string>()

  /** Seeds a store's charts as the theme it runs now has them, then keeps them: what this browser saved is read, never cleared. */
  function attachStore(channel: InstallChannel): void {
    if (attached.has(channel.id)) return
    attached.add(channel.id)
    setStoreCharts(channel.id, seededCharts(channel))
    kept.attach(channel.id)
  }
  // The demo stores' charts: saved ones if this browser has any, else the seed.
  for (const channel of SEEDED_DEMO_CHANNELS) attachStore(channel)

  // ── Reading ──────────────────────────────────────────────────────────────

  function chartsForChannel(channelId: string): SizeChart[] {
    return charts.value.filter((chart) => chart.channelId === channelId)
  }

  function getChart(id: string): SizeChart | undefined {
    return charts.value.find((chart) => chart.id === id)
  }

  /** The chart a product's size guide shows: the one it links, while it exists. */
  function chartForProduct(product: SizedProduct): SizeChart | undefined {
    return chartFor(product, charts.value)
  }

  /** The products that link the chart, in the catalogue's order. */
  function productsUsing(chartId: string): Product[] {
    return useCommerceStore().products.filter((product) => product.detail?.sizeChartId === chartId)
  }

  // ── Editing ──────────────────────────────────────────────────────────────

  /** Adds a chart to its store, after the store's other charts. */
  function createChart(input: Omit<SizeChart, 'id'>): SizeChart {
    const chart: SizeChart = { id: newChartId(), ...copyOf(input), name: input.name.trim() }
    charts.value = [...charts.value, chart]
    return chart
  }

  /** Changes a chart in place; its id and store stay. Undefined when there is no such chart. */
  function updateChart(id: string, changes: Partial<Omit<SizeChart, 'id' | 'channelId'>>): SizeChart | undefined {
    const index = charts.value.findIndex((chart) => chart.id === id)
    if (index < 0) return undefined
    const current = charts.value[index]!
    const next: SizeChart = { ...copyOf({ ...current, ...changes }), id, channelId: current.channelId }
    if (changes.name !== undefined) next.name = changes.name.trim()
    charts.value = charts.value.map((chart, i) => (i === index ? next : chart))
    return next
  }

  /** A copy of the chart, "Women's tops (copy)", right after it. No product links the copy. */
  function duplicateChart(id: string): SizeChart | undefined {
    const index = charts.value.findIndex((chart) => chart.id === id)
    if (index < 0) return undefined
    const source = charts.value[index]!
    const copy: SizeChart = { ...copyOf(source), id: newChartId(), name: `${source.name} (copy)` }
    charts.value = [...charts.value.slice(0, index + 1), copy, ...charts.value.slice(index + 1)]
    return copy
  }

  /**
   * Deletes a chart. While products link it, nothing happens unless `force`
   * (the merchant confirmed after being told which products lose their size
   * guide); then those products stop linking it. The result names them.
   */
  function deleteChart(id: string, options: { force?: boolean } = {}): SizeChartDeleteResult {
    const users = productsUsing(id)
    const usedBy = users.map((product) => ({ id: product.id, name: product.name }))
    if (!getChart(id) || (users.length && !options.force)) return { deleted: false, usedBy }
    for (const product of users) delete product.detail!.sizeChartId
    charts.value = charts.value.filter((chart) => chart.id !== id)
    return { deleted: true, usedBy }
  }

  // ── Demo stores (contract: src/stores/useDemoStores.ts) ──────────────────

  /**
   * Puts a store's charts back as the theme it runs now seeds them, on restore
   * and when a theme is applied. Other stores' charts stay. Does nothing for a
   * store that cannot take a theme.
   */
  function reseedDemo(channelId: string): void {
    const channel = demoChannelRecord(channelId)
    if (!channel || !canApplyTheme(channel)) return
    kept.clear(channelId)
    setStoreCharts(channelId, seededCharts(channel))
    kept.attach(channelId)
    kept.adopt(channelId)
    attached.add(channelId)
  }

  /**
   * Brings a store that can take a theme in with what this browser saved for it,
   * as the app starts (a store made from a theme). Nothing saved is cleared. Does
   * nothing a second time, or for a store that cannot take a theme.
   */
  function attachDemo(channelId: string): void {
    const channel = demoChannelRecord(channelId)
    if (channel && canApplyTheme(channel)) attachStore(channel)
  }

  return {
    charts, chartsForChannel, getChart, chartForProduct, productsUsing,
    createChart, updateChart, duplicateChart, deleteChart,
    attachDemo, reseedDemo,
  }
})
