<script setup lang="ts">
// Flexible label/value breakdown widget (dotted Overview v2): optional
// big-number headline, optional dotted progress bar, rows that render as
// status chips / tone dots / alert text, warning chip, footer drilldown link.
import MpStatusChip from '@/components/MpStatusChip.vue'
import DtDottedBar from '../dotted/DtDottedBar.vue'
import { BAR_GRADIENT, BAR_GRADIENT_GREEN } from '../dotted/dottedChartMath'
import type { DashboardBreakdownData } from '@/stores/dashboards/types'

defineProps<{
  data: DashboardBreakdownData
}>()

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
      :gradient="data.progress.tone === 'green' ? BAR_GRADIENT_GREEN : BAR_GRADIENT"
      :dot-alpha="0.55"
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
  gap: 14px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.breakdown-widget__headline {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.breakdown-widget__headline--split {
  justify-content: space-between;
}

.breakdown-widget__headline-value {
  font-size: 32px;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.breakdown-widget__headline-value--sm {
  font-size: 22px;
  letter-spacing: -0.025em;
}

.breakdown-widget__headline-caption {
  font-size: 12.5px;
  color: var(--muted);
}

.breakdown-widget__progress {
  margin-top: -6px;
}

.breakdown-widget__rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* Absorb the fixed grid row's spare height so the footer link/warning sit
     naturally instead of floating below a slab of dead space. */
  flex: 1 1 auto;
  justify-content: space-evenly;
}

.breakdown-widget__row {
  display: flex;
  align-items: center;
  gap: 12px;
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
  gap: 2px;
  min-width: 0;
  font-size: 13px;
}

.breakdown-widget__label {
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breakdown-widget__dot + .breakdown-widget__text .breakdown-widget__label {
  color: var(--text-primary);
  font-weight: 600;
}

.breakdown-widget__text--alert .breakdown-widget__label {
  color: var(--neg);
  font-weight: 600;
}

.breakdown-widget__meta {
  font-size: 11.5px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breakdown-widget__spacer {
  flex: 1;
}

.breakdown-widget__value {
  font-size: 14px;
  font-weight: 600;
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
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--mp-color-light-warningContainer);
  color: var(--mp-color-light-onWarningContainer);
  font-size: 12.5px;
  font-weight: 600;
}

.breakdown-widget__link {
  margin-top: auto;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.breakdown-widget__warning + .breakdown-widget__link {
  margin-top: 0;
}
</style>
