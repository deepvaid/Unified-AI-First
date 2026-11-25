<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { chartForAudience } from '@/storefront/audience'
import type { Audience } from '@/storefront/audience'
import { chartInUnit, hasMeasurements } from '@/storefront/sizeCharts'
import type { SizeChart, SizeUnit } from '@/storefront/sizeCharts'

// What the size guide drawer shows for a product: how the style fits, its size
// chart in inches or centimetres (the shopper's chosen size picked out), what to
// do between sizes, and how to measure. The chart is written in one unit and
// converted (src/storefront/sizeCharts.ts); the toggle starts on the chart's own.
//
// A chart's fit note may end with its "Between sizes?" advice (Northfold's do):
// that part is shown under its own heading, the rest under the table.
//
// A chart shared by women's and men's pieces (Northfold's Outerwear) shows a piece
// only its own audience's columns, without "Women's" or "Men's", and only the "How
// to measure" lines for them (src/storefront/audience.ts, which the chat reads too).

const props = withDefaults(defineProps<{
  chart: SizeChart
  /** The size the shopper has chosen, picked out in the table. */
  size?: string
  /** How this style fits: "Relaxed fit. Model is 6'1" and wears M." */
  fitNote?: string
  /** What to do between sizes, when the chart's fit note does not say. */
  betweenSizes?: string
  /** Who the piece is for; a chart's "Women's …" and "Men's …" columns are shown to that audience only. */
  audience?: Audience | null
}>(), {
  size: undefined,
  fitNote: undefined,
  betweenSizes: undefined,
  audience: null,
})

/** The unit shown; starts on the chart's own. */
const unit = defineModel<SizeUnit>('unit')
const shownUnit = computed<SizeUnit>(() => unit.value ?? props.chart.unit)
const UNITS: readonly SizeUnit[] = ['in', 'cm']
const UNIT_WORDS: Record<SizeUnit, string> = { in: 'inches', cm: 'centimeters' }

const uid = useId()
/** The chart as this piece reads it: its audience's columns only. */
const ownChart = computed(() => chartForAudience(props.chart, props.audience))
const shown = computed(() => chartInUnit(ownChart.value, shownUnit.value))
const measured = computed(() => hasMeasurements(ownChart.value))

// A table wider than the panel scrolls sideways; only then is its scroll area a Tab stop.
const scroller = ref<HTMLElement | null>(null)
const scrollable = ref(false)
const measure = (): void => {
  const el = scroller.value
  scrollable.value = !!el && el.scrollWidth > el.clientWidth + 1
}
let observer: ResizeObserver | undefined
onMounted(() => {
  measure()
  if (typeof ResizeObserver === 'undefined' || !scroller.value) return
  observer = new ResizeObserver(measure)
  observer.observe(scroller.value)
})
onBeforeUnmount(() => observer?.disconnect())
watch(shown, () => void nextTick(measure))

/** "32-33" reads "32–33". */
const range = (value: string): string => value.replace(/(\d)\s*-\s*(\d)/g, '$1–$2')

const isMine = (rowSize: string): boolean => !!props.size && rowSize.trim().toLowerCase() === props.size.trim().toLowerCase()

const BETWEEN = /Between sizes\?\s*([^.!?]*[.!?]?)/i

/** The chart's fit note without its "Between sizes?" sentence. */
const chartNote = computed(() => props.chart.fitNote.replace(BETWEEN, '').replace(/\s{2,}/g, ' ').trim())

/** What to do between sizes: this product's word, else the chart's. */
const advice = computed(() => {
  const own = props.betweenSizes?.replace(/^\s*Between sizes\?\s*/i, '').trim()
  return own || BETWEEN.exec(props.chart.fitNote)?.[1]?.trim() || ''
})

/** "Bust: around the fullest part…" lines as a measurement and how; other lines as they are. */
const measures = computed(() => ownChart.value.howToMeasure
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const match = /^([^:]{1,40}):\s*(.+)$/.exec(line)
    if (!match) return { label: '', text: line }
    const text = match[2]!
    return { label: match[1]!.trim(), text: text.charAt(0).toUpperCase() + text.slice(1) }
  }))
</script>

<template>
  <div class="sf-sg">
    <p v-if="fitNote" class="sf-sg__fit">
      <span class="sf-sg__fit-label">Fit</span>
      <span>{{ fitNote }}</span>
    </p>

    <div class="sf-sg__bar">
      <p class="sf-sg__chart">
        <span class="sf-sg__chart-name">{{ chart.name }}</span>
        <span v-if="measured" class="sf-sg__chart-unit">In {{ UNIT_WORDS[shownUnit] }}</span>
      </p>
      <!-- A chart of sizes only (socks by shoe size) has nothing to show in the other unit. -->
      <fieldset v-if="measured" class="sf-sg__units" aria-label="Show measurements in">
        <label v-for="option in UNITS" :key="option" class="sf-sg__unit" :class="{ 'is-selected': shownUnit === option }">
          <input
            type="radio"
            class="sf-sg__unit-input"
            :name="`${uid}-unit`"
            :value="option"
            :checked="shownUnit === option"
            @change="unit = option"
          >
          <span class="sf-sg__unit-face">{{ option }}</span>
        </label>
      </fieldset>
    </div>

    <div ref="scroller" class="sf-sg__scroll" role="region" :aria-labelledby="`${uid}-caption`" :tabindex="scrollable ? 0 : undefined">
      <table class="sf-sg__table">
        <caption :id="`${uid}-caption`" class="sf-sg__sr">{{ chart.name }} sizes{{ measured ? `, in ${UNIT_WORDS[shownUnit]}` : '' }}</caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th v-for="column in shown.columns" :key="column" scope="col">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in shown.rows" :key="row.size" :class="{ 'is-mine': isMine(row.size) }" :aria-current="isMine(row.size) ? 'true' : undefined">
            <!-- The chosen size reads as one text ("M, your size"): a hidden span beside it would be read after a space. -->
            <th scope="row">
              <template v-if="isMine(row.size)">
                <span aria-hidden="true">{{ row.size }}</span><span class="sf-sg__sr">{{ row.size }}, your size</span>
              </template>
              <template v-else>{{ row.size }}</template>
            </th>
            <td v-for="(value, index) in row.values" :key="index">{{ range(value) || '–' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="chartNote" class="sf-sg__note">{{ chartNote }}</p>

    <section v-if="advice" class="sf-sg__section" :aria-labelledby="`${uid}-between`">
      <h3 :id="`${uid}-between`" class="sf-sg__heading">Between sizes?</h3>
      <p class="sf-sg__text">{{ advice }}</p>
    </section>

    <section v-if="measures.length" class="sf-sg__section" :aria-labelledby="`${uid}-measure`">
      <h3 :id="`${uid}-measure`" class="sf-sg__heading">How to measure</h3>
      <dl class="sf-sg__measures">
        <template v-for="(item, index) in measures" :key="index">
          <div class="sf-sg__measure">
            <dt v-if="item.label">{{ item.label }}</dt>
            <dd>{{ item.text }}</dd>
          </div>
        </template>
      </dl>
    </section>
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Colours, fonts and
 * corners come from the store's theme (--sf-*). */
.sf-sg {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-size: 15px;
  line-height: 22px;
}

.sf-sg__sr {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.sf-sg__fit {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 14px 16px;
  border-radius: var(--sf-radius, 6px);
  background: var(--sf-surface, #f5f5f5);
  color: var(--sf-text, #121011);
}

.sf-sg__fit-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sf-muted, #5f5f5f);
}

.sf-sg__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sf-sg__chart {
  display: flex;
  flex-direction: column;
  margin: 0;
  min-width: 0;
}

.sf-sg__chart-name {
  font-weight: 600;
}

.sf-sg__chart-unit {
  font-size: 13px;
  line-height: 18px;
  color: var(--sf-muted, #5f5f5f);
}

/* in | cm: two radios drawn as one switch. */
.sf-sg__units {
  position: relative;
  display: inline-flex;
  margin: 0;
  padding: 3px;
  border: 1px solid color-mix(in srgb, var(--sf-text, #121011) 20%, transparent);
  border-radius: var(--sf-radius, 999px);
}

.sf-sg__unit {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}

.sf-sg__unit-input {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.sf-sg__unit-face {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 36px;
  padding: 0 12px;
  border-radius: var(--sf-radius, 999px);
  font-size: 14px;
  font-weight: 500;
  color: var(--sf-text, #121011);
}

.sf-sg__unit.is-selected .sf-sg__unit-face {
  background: var(--sf-text, #121011);
  color: var(--sf-bg, #ffffff);
}

.sf-sg__unit-input:focus-visible + .sf-sg__unit-face {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-sg__scroll {
  overflow-x: auto;
  margin-inline: calc(-1 * var(--sf-drawer-pad, 0px));
  padding-inline: var(--sf-drawer-pad, 0px);
  overscroll-behavior-x: contain;
}

.sf-sg__scroll:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: -2px;
}

.sf-sg__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.sf-sg__table th,
.sf-sg__table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--sf-divider, #e5e5e5);
  text-align: start;
}

.sf-sg__table thead th {
  font-size: 13px;
  font-weight: 600;
  color: var(--sf-muted, #5f5f5f);
  white-space: normal;
  vertical-align: bottom;
}

.sf-sg__table tr {
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
}

/* The size column stays put while the measurements scroll. */
.sf-sg__table th:first-child {
  position: sticky;
  left: 0;
  z-index: 1;
  padding-inline-start: 12px;
  background: inherit;
}

/* A hairline at the column's edge, so measurements scrolling under it read as scrolling. */
.sf-sg__scroll[tabindex] .sf-sg__table th:first-child {
  box-shadow: inset -1px 0 0 var(--sf-divider, #e5e5e5);
}

.sf-sg__table tbody th {
  font-weight: 600;
}

.sf-sg__table tr.is-mine {
  background: var(--sf-surface, #f3f3f3);
}

.sf-sg__table tr.is-mine th {
  box-shadow: inset 3px 0 0 var(--sf-text, #121011);
}

.sf-sg__scroll[tabindex] .sf-sg__table tr.is-mine th {
  box-shadow: inset 3px 0 0 var(--sf-text, #121011), inset -1px 0 0 var(--sf-divider, #e5e5e5);
}

.sf-sg__note {
  margin: -8px 0 0;
  font-size: 13px;
  line-height: 19px;
  color: var(--sf-muted, #5f5f5f);
}

.sf-sg__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid var(--sf-divider, #e5e5e5);
}

.sf-sg__heading {
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 21px;
  font-weight: var(--sf-heading-weight, 400);
  line-height: 1.25;
  text-transform: var(--sf-heading-case, none);
}

.sf-sg__text {
  margin: 0;
}

.sf-sg__measures {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
}

.sf-sg__measure dt {
  font-weight: 600;
}

.sf-sg__measure dd {
  margin: 0;
  color: var(--sf-text, #121011);
}

@media (max-width: 600px) {
  .sf-sg__unit-face {
    height: 44px;
  }
}
</style>
