<script setup lang="ts">
// Flexible label/value breakdown widget (dotted Overview v2): optional
// big-number headline, optional progress bar, rows that render as
// status chips / tone dots / alert text, warning chip, footer drilldown link.
import { computed, inject, unref } from 'vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import DtDottedBar from '../dotted/DtDottedBar.vue'
import { useBarGradients } from '../dotted/dottedChartMath'
import { CHART_PALETTE_OVERRIDE, useChartTheme, type ChartTheme } from '@/plugins/chartPalette'
import type { DashboardBreakdownData } from '@/stores/dashboards/types'

defineProps<{
  data: DashboardBreakdownData
}>()

const { theme } = useChartTheme()
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const resolvedTheme = computed<ChartTheme>(() => unref(themeOverride) ?? theme.value)
// Exploration options run the pill through their lead series (and their own
// positive green for the `green` tone); legacy themes keep the literal pair.
const { barGradient, barGradientGreen } = useBarGradients(resolvedTheme)

const emit = defineEmits<{
  drilldown: []
}>()
</script>

<template>
  <div class="breakdown-widget">
    <div v-if="data.headline" class="breakdown-widget__headline" :class="{ 'breakdown-widget__headline--split': data.progress }">
      <span class="breakdown-widget__headline-value" :class="{ 'breakdown-widget__headline-value--sm': data.progress }">{{ data.headline.value }}</span>
      <span v-if="data.headline.caption" class="breakdown-widget__headline-caption">{{ data.headline.caption }}</span>
    </div>
    <DtDottedBar
      v-if="data.progress"
      :pct="data.progress.pct"
      :gradient="data.progress.tone === 'green' ? barGradientGreen : barGradient"
      class="breakdown-widget__progress"
    />
    <div class="breakdown-widget__rows">
      <div v-for="row in data.rows" :key="row.label" class="breakdown-widget__row">
        <span
          v-if="row.tone === 'success' || row.tone === 'warning'"
          class="breakdown-widget__dot"
          :class="`breakdown-widget__dot--${row.tone}`"
          aria-hidden="true"
        />
        <MpStatusChip v-if="row.chip" :status="row.chip.status" :type="row.chip.type" />
        <div v-else class="breakdown-widget__text" :class="{ 'breakdown-widget__text--alert': row.tone === 'alert' }">
          <span class="breakdown-widget__label">{{ row.label }}</span>
          <span v-if="row.meta" class="breakdown-widget__meta">{{ row.meta }}</span>
        </div>
        <span class="breakdown-widget__spacer" />
        <span class="breakdown-widget__value" :class="{ 'breakdown-widget__value--alert': row.tone === 'alert' }">{{ row.value }}</span>
      </div>
    </div>
    <div v-if="data.warning" class="breakdown-widget__warning">
      <v-icon size="14" aria-hidden="true">shield-alert</v-icon>
      <span>{{ data.warning }}</span>
    </div>
    <a
      v-if="data.linkLabel"
      href="#"
      class="breakdown-widget__link"
      @click.prevent="emit('drilldown')"
    >{{ data.linkLabel }}</a>
  </div>
</template>

<style scoped>
.breakdown-widget {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-14);
  width: 100%;
  height: 100%;
  min-height: 0;
}

.breakdown-widget__headline {
  display: flex;
  align-items: baseline;
  gap: var(--mp-space-10);
}

.breakdown-widget__headline--split {
  justify-content: space-between;
}

.breakdown-widget__headline-value {
  font-size: var(--mp-fontSize-32);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.breakdown-widget__headline-value--sm {
  font-size: var(--mp-fontSize-24);
  letter-spacing: -0.025em;
}

.breakdown-widget__headline-caption {
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
}

.breakdown-widget__progress {
  margin-top: calc(var(--mp-space-6) * -1);
}

.breakdown-widget__rows {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
  /* Absorb the fixed grid row's spare height so the footer link/warning sit
     naturally instead of floating below a slab of dead space. */
  flex: 1 1 auto;
  justify-content: space-evenly;
}

.breakdown-widget__row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
  min-width: 0;
}

.breakdown-widget__dot {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 99px;
}

.breakdown-widget__dot--success {
  background: var(--pos);
}

.breakdown-widget__dot--warning {
  background: rgb(var(--v-theme-warning));
}

.breakdown-widget__text {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
  min-width: 0;
  font-size: var(--mp-fontSize-13);
}

.breakdown-widget__label {
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breakdown-widget__dot + .breakdown-widget__text .breakdown-widget__label {
  color: var(--text-primary);
  font-weight: var(--mp-fontWeight-semibold);
}

.breakdown-widget__text--alert .breakdown-widget__label {
  color: var(--neg);
  font-weight: var(--mp-fontWeight-semibold);
}

.breakdown-widget__meta {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breakdown-widget__spacer {
  flex: 1;
}

.breakdown-widget__value {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  flex: none;
}

.breakdown-widget__value--alert {
  color: var(--neg);
}

.breakdown-widget__warning {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  padding: var(--mp-space-10) var(--mp-space-12);
  border-radius: var(--mp-component-input-radius);
  background: var(--mp-color-light-warningContainer);
  color: var(--mp-color-light-onWarningContainer);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
}

.breakdown-widget__link {
  margin-top: auto;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--accent);
  text-decoration: none;
}

.breakdown-widget__warning + .breakdown-widget__link {
  margin-top: 0;
}
</style>
