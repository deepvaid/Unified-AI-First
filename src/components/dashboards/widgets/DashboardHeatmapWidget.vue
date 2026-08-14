<script setup lang="ts">
// Matrix widget: rows × columns, cell colour carries the value. Built in CSS
// grid rather than ApexCharts' heatmap because that renderer has no cell-gap
// control and no per-cell labels — both of which this design needs.
import { computed, inject, ref, unref } from 'vue'
import { CHART_PALETTE_OVERRIDE, tintHex, useChartTheme, type ChartTheme } from '@/plugins/chartPalette'
import type { DashboardHeatmapData } from '@/stores/dashboards/types'
import { formatCompactValue, formatFullValue, formatPercent } from '@/utils/formatNumber'

const props = defineProps<{
  data: DashboardHeatmapData
}>()

const { theme } = useChartTheme()
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const resolvedTheme = computed<ChartTheme>(() => unref(themeOverride) ?? theme.value)

/** Anchor colour for the ramp: the theme's lead series colour. */
const anchor = computed(() => resolvedTheme.value.series[0] ?? '#0092D4')

const maxCell = computed(() => {
  let max = 0
  for (const row of props.data.cells) {
    for (const value of row) if (value > max) max = value
  }
  return max
})

const totalValue = computed(() => {
  if (props.data.total != null) return props.data.total
  return props.data.cells.reduce((sum, row) => sum + row.reduce((rowSum, v) => rowSum + v, 0), 0)
})

/**
 * Zero reads as an empty cell (a faint wash), never as a printed "0" — the
 * reference matrix drowned in zeroes. Everything else ramps from a light tint
 * to the full anchor colour; the top of the ramp flips its text to white.
 */
function cellStyle(value: number) {
  if (value <= 0) {
    return { background: 'var(--surface-secondary, rgba(26, 24, 20, 0.03))', color: 'transparent' }
  }
  const ratio = maxCell.value > 0 ? value / maxCell.value : 0
  // Perceptual easing: without it, one outlier flattens the whole matrix.
  const eased = Math.pow(ratio, 0.6)
  const background = tintHex(anchor.value, 1 - Math.max(0.12, eased))
  return {
    background,
    color: eased > 0.62 ? '#ffffff' : 'var(--text-primary)',
  }
}

const hover = ref<{ row: number; column: number } | null>(null)

const hoverDetail = computed(() => {
  const point = hover.value
  if (!point) return null
  const value = props.data.cells[point.row]?.[point.column] ?? 0
  const share = totalValue.value > 0 ? (value / totalValue.value) * 100 : 0
  return {
    row: props.data.rows[point.row] ?? '',
    column: props.data.columns[point.column] ?? '',
    value: formatFullValue(value, props.data.unit),
    share: formatPercent(share, 1),
  }
})

function isHovered(row: number, column: number): boolean {
  return hover.value?.row === row && hover.value?.column === column
}

const ariaLabel = computed(() => {
  const { rows, columns } = props.data
  return `Heatmap, ${rows.length} rows by ${columns.length} columns, values from 0 to ${formatFullValue(maxCell.value, props.data.unit)}.`
})
</script>

<template>
  <div class="heatmap-widget" role="img" :aria-label="ariaLabel">
    <div class="heatmap-widget__scroll">
      <div
        class="heatmap-widget__grid"
        :style="{ gridTemplateColumns: `minmax(64px, auto) repeat(${data.columns.length}, minmax(0, 1fr))` }"
      >
        <!-- Column header row -->
        <span class="heatmap-widget__corner" aria-hidden="true" />
        <span
          v-for="column in data.columns"
          :key="`col-${column}`"
          class="heatmap-widget__col-label mp-meta-label"
        >{{ column }}</span>

        <!-- One label + cell run per row -->
        <template v-for="(row, rowIndex) in data.rows" :key="`row-${row}`">
          <span class="heatmap-widget__row-label">{{ row }}</span>
          <button
            v-for="(column, columnIndex) in data.columns"
            :key="`cell-${row}-${column}`"
            type="button"
            class="heatmap-widget__cell"
            :class="{ 'heatmap-widget__cell--active': isHovered(rowIndex, columnIndex) }"
            :style="cellStyle(data.cells[rowIndex]?.[columnIndex] ?? 0)"
            :aria-label="`${row}, ${column}: ${formatFullValue(data.cells[rowIndex]?.[columnIndex] ?? 0, data.unit)}`"
            @mouseenter="hover = { row: rowIndex, column: columnIndex }"
            @mouseleave="hover = null"
            @focus="hover = { row: rowIndex, column: columnIndex }"
            @blur="hover = null"
          >
            <span v-if="(data.cells[rowIndex]?.[columnIndex] ?? 0) > 0" class="heatmap-widget__cell-value num">
              {{ formatCompactValue(data.cells[rowIndex]?.[columnIndex] ?? 0, data.unit) }}
            </span>
          </button>
        </template>
      </div>
    </div>

    <!-- Readout + scale legend -->
    <div class="heatmap-widget__foot">
      <div v-if="hoverDetail" class="heatmap-widget__readout">
        <span class="heatmap-widget__readout-label">{{ hoverDetail.row }} · {{ hoverDetail.column }}</span>
        <span class="heatmap-widget__readout-value num">{{ hoverDetail.value }}</span>
        <span class="heatmap-widget__readout-share num">{{ hoverDetail.share }}</span>
      </div>
      <div v-else class="heatmap-widget__hint">
        <span v-if="data.rowAxisLabel">{{ data.rowAxisLabel }}</span>
        <span v-if="data.rowAxisLabel && data.columnAxisLabel" aria-hidden="true">·</span>
        <span v-if="data.columnAxisLabel">{{ data.columnAxisLabel }}</span>
      </div>
      <div class="heatmap-widget__scale" aria-hidden="true">
        <span class="heatmap-widget__scale-cap">Low</span>
        <span
          v-for="step in 5"
          :key="`step-${step}`"
          class="heatmap-widget__scale-swatch"
          :style="{ background: tintHex(anchor, 1 - Math.max(0.12, Math.pow(step / 5, 0.6))) }"
        />
        <span class="heatmap-widget__scale-cap">High</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heatmap-widget {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.heatmap-widget__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.heatmap-widget__grid {
  display: grid;
  gap: 4px;
  align-content: start;
  min-height: 0;
  height: 100%;
}

.heatmap-widget__corner {
  /* Spacer above the row labels. */
}

.heatmap-widget__col-label {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 2px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.heatmap-widget__row-label {
  display: flex;
  align-items: center;
  padding-right: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.heatmap-widget__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 4px;
  border: 0;
  border-radius: 6px;
  cursor: default;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.heatmap-widget__cell--active {
  box-shadow: 0 0 0 2px var(--surface-primary), 0 0 0 3px var(--accent);
  transform: scale(1.02);
}

.heatmap-widget__cell:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.heatmap-widget__cell-value {
  font-size: 11.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Narrow cards drop the in-cell numbers — the colour still carries the read,
   and the hover readout gives the exact figure. */
@container (max-width: 420px) {
  .heatmap-widget__cell-value {
    display: none;
  }
}

.heatmap-widget__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
  min-height: 34px;
}

.heatmap-widget__readout {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.heatmap-widget__readout-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.heatmap-widget__readout-value {
  font-size: 13px;
  font-weight: 650;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.heatmap-widget__readout-share {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.heatmap-widget__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--muted);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.heatmap-widget__scale {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.heatmap-widget__scale-cap {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--muted);
}

.heatmap-widget__scale-swatch {
  width: 14px;
  height: 8px;
  border-radius: 2px;
}
</style>
