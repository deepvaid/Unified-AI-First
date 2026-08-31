<script setup lang="ts">
// The eRFM report's matrix, used twice: RFM group × engagement level (§B, where
// cells are selectable cohorts) and base-group → comparison-group movement (§D,
// read-only).
//
// Built in CSS grid over a real <table>, following the decision already recorded
// in DashboardHeatmapWidget.vue: ApexCharts' heatmap renderer has no cell-gap
// control and no per-cell labels, and this matrix needs both (two numbers per
// cell, and gaps between cells). Upstream renders the same thing as an ECharts
// canvas — no accessible name, no text alternative, no tab stops — so a table of
// buttons is also what makes the page's primary interaction reachable at all.
//
// GAP: this is the second CSS-grid matrix in the repo. The shared geometry wants
// extracting into an `MpMatrix` atom — logged in docs/rebuild/GAPS.md.
import { computed, ref } from 'vue'
import { readableInkOn, tintHex, useChartTheme } from '@/plugins/chartPalette'
import { mp_color_chart_light_series1 } from '@/design-tokens/generated/tokens'
import { formatCompactValue, formatFullValue, formatPercent, type NumericUnit } from '@/utils/formatNumber'

export interface ErfmMatrixCell {
  row: number
  /** Equals `colLabels.length` for the synthetic Total column. */
  col: number
}

const props = withDefaults(
  defineProps<{
    /** Corner cell text — names what the rows are ("Group", "From / To"). */
    cornerLabel: string
    rowLabels: string[]
    colLabels: string[]
    /** rows × cols primary values. */
    cells: number[][]
    /** rows × cols secondary values (percent change). Rendered under the primary. */
    secondary?: (number | null)[][] | null
    /** Adds a Total column (row sums) and a Total row (column sums). */
    showTotals?: boolean
    /** Makes data cells and Total-column cells selectable. The Total row never is. */
    selectable?: boolean
    selected?: ErfmMatrixCell | null
    unit?: NumericUnit
    /** Accessible name for the table. */
    caption: string
  }>(),
  { secondary: null, showTotals: false, selectable: false, selected: null, unit: 'count' }
)

const emit = defineEmits<{ select: [cell: ErfmMatrixCell] }>()

const { theme } = useChartTheme()
const anchor = computed(() => theme.value.series[0] ?? mp_color_chart_light_series1)

const totalColIndex = computed(() => props.colLabels.length)

const rowTotals = computed(() => props.cells.map((row) => row.reduce((sum, v) => sum + v, 0)))

const colTotals = computed(() =>
  props.colLabels.map((_, col) => props.cells.reduce((sum, row) => sum + (row[col] ?? 0), 0))
)

const grandTotal = computed(() => rowTotals.value.reduce((sum, v) => sum + v, 0))

/** Largest data cell — the ramp's ceiling. Totals are excluded so one roll-up
 *  doesn't flatten every real cell to the palest tint. */
const maxCell = computed(() => {
  let max = 0
  for (const row of props.cells) for (const v of row) if (v > max) max = v
  return max
})

function valueAt(row: number, col: number): number {
  if (col === totalColIndex.value) return rowTotals.value[row] ?? 0
  return props.cells[row]?.[col] ?? 0
}

function secondaryAt(row: number, col: number): number | null {
  if (!props.secondary) return null
  if (col === totalColIndex.value) return null
  return props.secondary[row]?.[col] ?? null
}

/**
 * Zero reads as an empty wash rather than a printed "0" — the reference matrix
 * has a lot of zeroes and they drown the signal. Ink comes from
 * `readableInkOn(fill)`, not the theme: `tintHex` mixes toward white in both
 * themes, so a theme-following ink renders light-on-light in dark mode (P5.5).
 */
function cellStyle(value: number) {
  if (value <= 0) return { background: 'var(--surface-secondary)' }
  const ratio = maxCell.value > 0 ? value / maxCell.value : 0
  // Perceptual easing — without it a single outlier flattens the whole matrix.
  const eased = Math.pow(ratio, 0.6)
  const background = tintHex(anchor.value, 1 - Math.max(0.12, eased))
  return { background, color: readableInkOn(background) }
}

const hover = ref<ErfmMatrixCell | null>(null)

const readout = computed(() => {
  const point = hover.value ?? props.selected
  if (!point) return null
  const col = point.col === totalColIndex.value ? 'Total' : props.colLabels[point.col]
  const value = valueAt(point.row, point.col)
  const delta = secondaryAt(point.row, point.col)
  return {
    label: `${props.rowLabels[point.row] ?? ''} · ${col ?? ''}`,
    value: formatFullValue(value, props.unit),
    share: grandTotal.value > 0 ? formatPercent((value / grandTotal.value) * 100, 1) : null,
    delta,
  }
})

function isSelected(row: number, col: number): boolean {
  return props.selected?.row === row && props.selected?.col === col
}

function cellName(row: number, col: number): string {
  const colLabel = col === totalColIndex.value ? 'Total' : props.colLabels[col]
  const value = formatFullValue(valueAt(row, col), props.unit)
  const delta = secondaryAt(row, col)
  const change = delta == null ? '' : `, ${delta >= 0 ? 'up' : 'down'} ${formatPercent(Math.abs(delta), 1)}`
  const action = props.selectable ? '. Select this cohort' : ''
  return `${props.rowLabels[row]}, ${colLabel}: ${value}${change}${action}`
}

/** Grid template: row-label track + one track per column (+ Total column). */
const gridColumns = computed(
  () => `minmax(104px, auto) repeat(${props.colLabels.length + (props.showTotals ? 1 : 0)}, minmax(0, 1fr))`
)

function deltaClass(delta: number | null): string {
  if (delta == null || delta === 0) return 'erfm-matrix__delta--flat'
  return delta > 0 ? 'erfm-matrix__delta--up' : 'erfm-matrix__delta--down'
}
</script>

<template>
  <div class="erfm-matrix">
    <div class="erfm-matrix__scroll">
      <table class="erfm-matrix__table" :style="{ gridTemplateColumns: gridColumns }">
        <caption class="erfm-matrix__caption">{{ caption }}</caption>
        <thead>
          <tr>
            <th scope="col" class="erfm-matrix__corner">{{ cornerLabel }}</th>
            <th v-for="col in colLabels" :key="`col-${col}`" scope="col" class="erfm-matrix__col-head">
              {{ col }}
            </th>
            <th v-if="showTotals" scope="col" class="erfm-matrix__col-head erfm-matrix__col-head--total">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(rowLabel, rowIndex) in rowLabels" :key="`row-${rowLabel}`">
            <th scope="row" class="erfm-matrix__row-head">{{ rowLabel }}</th>

            <td
              v-for="colIndex in colLabels.length + (showTotals ? 1 : 0)"
              :key="`cell-${rowIndex}-${colIndex}`"
              class="erfm-matrix__td"
            >
              <component
                :is="selectable ? 'button' : 'div'"
                :type="selectable ? 'button' : undefined"
                class="erfm-matrix__cell"
                :class="{
                  'erfm-matrix__cell--selected': isSelected(rowIndex, colIndex - 1),
                  'erfm-matrix__cell--total': showTotals && colIndex - 1 === totalColIndex,
                  'erfm-matrix__cell--static': !selectable,
                }"
                :style="cellStyle(valueAt(rowIndex, colIndex - 1))"
                :aria-label="selectable ? cellName(rowIndex, colIndex - 1) : undefined"
                :aria-pressed="selectable ? isSelected(rowIndex, colIndex - 1) : undefined"
                @click="selectable && emit('select', { row: rowIndex, col: colIndex - 1 })"
                @mouseenter="hover = { row: rowIndex, col: colIndex - 1 }"
                @mouseleave="hover = null"
                @focus="hover = { row: rowIndex, col: colIndex - 1 }"
                @blur="hover = null"
              >
                <span v-if="valueAt(rowIndex, colIndex - 1) > 0" class="erfm-matrix__value num">
                  {{ formatCompactValue(valueAt(rowIndex, colIndex - 1), unit) }}
                </span>
                <span v-else class="erfm-matrix__value erfm-matrix__value--zero num" aria-hidden="true">—</span>
                <span
                  v-if="secondaryAt(rowIndex, colIndex - 1) != null"
                  class="erfm-matrix__delta erfm-matrix__delta--on-cell num"
                >
                  {{ (secondaryAt(rowIndex, colIndex - 1) ?? 0) >= 0 ? '+' : '' }}{{ formatPercent(secondaryAt(rowIndex, colIndex - 1) ?? 0, 1) }}
                </span>
              </component>
            </td>
          </tr>

          <!-- Column roll-up. Not selectable: "all groups" is not one of the five
               RFM attributes the Create Segment form accepts, so a clickable
               Total row would offer a cohort that cannot be built. -->
          <tr v-if="showTotals" class="erfm-matrix__total-row">
            <th scope="row" class="erfm-matrix__row-head erfm-matrix__row-head--total">Total</th>
            <td v-for="(total, colIndex) in colTotals" :key="`total-${colIndex}`" class="erfm-matrix__td">
              <div class="erfm-matrix__cell erfm-matrix__cell--summary">
                <span class="erfm-matrix__value num">{{ formatCompactValue(total, unit) }}</span>
              </div>
            </td>
            <td class="erfm-matrix__td">
              <div class="erfm-matrix__cell erfm-matrix__cell--summary erfm-matrix__cell--grand">
                <span class="erfm-matrix__value num">{{ formatCompactValue(grandTotal, unit) }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Readout + the colour key upstream omits (its visualMap is `show: false`). -->
    <div class="erfm-matrix__foot">
      <div v-if="readout" class="erfm-matrix__readout">
        <span class="erfm-matrix__readout-label">{{ readout.label }}</span>
        <span class="erfm-matrix__readout-value num">{{ readout.value }}</span>
        <span v-if="readout.share" class="erfm-matrix__readout-share num">{{ readout.share }} of total</span>
        <span
          v-if="readout.delta != null"
          class="erfm-matrix__delta num"
          :class="deltaClass(readout.delta)"
        >{{ readout.delta >= 0 ? '+' : '' }}{{ formatPercent(readout.delta, 1) }}</span>
      </div>
      <div v-else class="erfm-matrix__hint">
        {{ selectable ? 'Hover or focus a cell for its exact figures.' : 'Hover a cell for its exact figures.' }}
      </div>

      <div class="erfm-matrix__scale" aria-hidden="true">
        <span class="erfm-matrix__scale-cap">Fewer</span>
        <span
          v-for="step in 5"
          :key="`step-${step}`"
          class="erfm-matrix__scale-swatch"
          :style="{ background: tintHex(anchor, 1 - Math.max(0.12, Math.pow(step / 5, 0.6))) }"
        />
        <span class="erfm-matrix__scale-cap">More</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.erfm-matrix {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
  width: 100%;
  container-type: inline-size;
}

.erfm-matrix__scroll {
  overflow-x: auto;
}

/* The table keeps the row/column-header semantics screen readers need; grid
   gives the cell gaps and equal tracks the design needs. */
.erfm-matrix__table {
  display: grid;
  gap: var(--mp-space-4);
  min-width: 640px;
  border-collapse: separate;
}

.erfm-matrix__caption {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.erfm-matrix__table thead,
.erfm-matrix__table tbody,
.erfm-matrix__table tr {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  gap: var(--mp-space-4);
}

.erfm-matrix__corner {
  display: flex;
  align-items: flex-end;
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: start;
}

.erfm-matrix__col-head {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: var(--mp-space-2);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
  text-align: center;
  line-height: 1.3;
}

.erfm-matrix__col-head--total,
.erfm-matrix__row-head--total {
  color: var(--text-primary);
  font-weight: var(--mp-fontWeight-semibold);
}

.erfm-matrix__row-head {
  display: flex;
  align-items: center;
  padding-right: var(--mp-space-8);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--text-primary);
  text-align: start;
  line-height: 1.3;
}

.erfm-matrix__td {
  display: flex;
  min-width: 0;
}

.erfm-matrix__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-2);
  flex: 1 1 auto;
  min-width: 0;
  /* Two stacked lines (value + delta) on the shared row baseline. */
  min-height: calc(var(--mp-component-listItem-minHeight) + var(--mp-space-12));
  padding: var(--mp-space-6) var(--mp-space-4);
  border: 0;
  border-radius: var(--mp-component-chip-radius);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.erfm-matrix__cell--static,
.erfm-matrix__cell--summary {
  cursor: default;
}

button.erfm-matrix__cell {
  cursor: pointer;
}

/* Ring geometry mirrors DashboardHeatmapWidget's exactly, so the two matrices
   read as the same control. The 3px outer offset has no token of its own. */
button.erfm-matrix__cell:hover {
  box-shadow: 0 0 0 var(--mp-space-2) var(--surface-primary), 0 0 0 3px var(--border-default);
}

.erfm-matrix__cell--selected {
  box-shadow: 0 0 0 var(--mp-space-2) var(--surface-primary), 0 0 0 3px var(--accent);
  transform: scale(1.02);
}

.erfm-matrix__cell:focus-visible {
  outline: var(--mp-space-2) solid var(--accent);
  outline-offset: var(--mp-space-2);
}

.erfm-matrix__cell--summary {
  background: var(--surface-secondary) !important;
  color: var(--text-primary) !important;
}

.erfm-matrix__cell--grand {
  background: var(--surface-tertiary) !important;
}

.erfm-matrix__cell--total {
  font-weight: var(--mp-fontWeight-semibold);
}

.erfm-matrix__value {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.erfm-matrix__value--zero {
  color: var(--muted);
  font-weight: var(--mp-fontWeight-medium);
}

.erfm-matrix__delta {
  font-size: var(--mp-fontSize-10);
  font-weight: var(--mp-fontWeight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

/* Only correct on the card surface (the readout), where the semantic inks track
   the theme as intended. */
.erfm-matrix__delta--up { color: var(--pos-ink); }
.erfm-matrix__delta--down { color: var(--neg-ink); }
.erfm-matrix__delta--flat { color: var(--muted); }

/* Inside a cell the delta inherits the cell's `readableInkOn` colour instead.
   `tintHex` mixes toward white in BOTH themes, so the fill is light regardless of
   theme — a theme-following pos/neg ink renders pale-on-pale in dark mode, which
   measured about 1.2:1 (P5.5, the same trap the cell ink already avoids). Hue is
   not the carrier here: the printed +/- sign is. */
.erfm-matrix__delta--on-cell {
  color: inherit;
  opacity: 0.72;
}

/* Narrow containers drop the in-cell delta, then the value — colour still
   carries the read and the readout gives exact figures. */
@container (max-width: 560px) {
  .erfm-matrix__delta { display: none; }
}

.erfm-matrix__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
  flex-wrap: wrap;
  padding-top: var(--mp-space-10);
  border-top: 1px solid var(--border-subtle);
  min-height: calc(var(--mp-component-control-height) - var(--mp-space-6));
}

.erfm-matrix__readout {
  display: inline-flex;
  align-items: baseline;
  gap: var(--mp-space-8);
  flex-wrap: wrap;
  min-width: 0;
}

.erfm-matrix__readout-label {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.erfm-matrix__readout-value {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.erfm-matrix__readout-share,
.erfm-matrix__hint {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
}

.erfm-matrix__scale {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  flex-shrink: 0;
}

.erfm-matrix__scale-cap {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
}

.erfm-matrix__scale-swatch {
  width: var(--mp-space-14);
  height: var(--mp-space-8);
  border-radius: var(--mp-radius-4);
}
</style>
