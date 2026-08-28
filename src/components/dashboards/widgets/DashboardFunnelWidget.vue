<script setup lang="ts">
// Campaign-to-purchase funnel (dotted Overview v2): 6-column stat header,
// gradient funnel SVG, footer stats + biggest-drop-off warning chip.
import { computed, inject, unref } from 'vue'
import { FUNNEL_GRADIENT_STOPS, deriveFunnelStops, funnelPath, type GradientStop } from '../dotted/dottedChartMath'
import { CHART_PALETTE_OVERRIDE, useChartTheme, type ChartTheme } from '@/plugins/chartPalette'
import type { DashboardFunnelData } from '@/stores/dashboards/types'

const props = defineProps<{
  data: DashboardFunnelData
}>()

const { theme } = useChartTheme()
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const resolvedTheme = computed<ChartTheme>(() => unref(themeOverride) ?? theme.value)
// Exploration options run the funnel through their own axis ramp; legacy themes
// keep the literal indigo -> cyan stops.
const gradientStops = computed<readonly GradientStop[]>(() => {
  const t = resolvedTheme.value.treatment
  if (!t) return FUNNEL_GRADIENT_STOPS
  return t.ramps?.funnelStops ?? deriveFunnelStops(resolvedTheme.value.axis)
})

const path = computed(() => funnelPath(props.data.stages.map((stage) => stage.pct)))
const dividers = computed(() =>
  props.data.stages.slice(1).map((_stage, index) => ((index + 1) * 1200) / props.data.stages.length),
)
</script>

<template>
  <div class="funnel-widget">
    <div class="funnel-widget__stages" :style="{ gridTemplateColumns: `repeat(${data.stages.length}, 1fr)` }">
      <div v-for="stage in data.stages" :key="stage.label" class="funnel-widget__stage">
        <span class="funnel-widget__stage-label">{{ stage.label }}</span>
        <span class="funnel-widget__stage-value">{{ stage.formattedValue }}</span>
        <span class="funnel-widget__stage-share" :class="{ 'funnel-widget__stage-share--accent': stage.accent }">{{ stage.share }}</span>
      </div>
    </div>

    <svg viewBox="0 0 1200 260" preserveAspectRatio="none" class="funnel-widget__svg" role="img" aria-label="Funnel chart across the stages above">
      <defs>
        <linearGradient id="dtFunnelFill" x1="0" y1="0" x2="1" y2="0">
          <stop v-for="stop in gradientStops" :key="stop.offset" :offset="stop.offset" :stop-color="stop.color" />
        </linearGradient>
      </defs>
      <path :d="path" fill="url(#dtFunnelFill)" />
      <line v-for="x in dividers" :key="x" :x1="x" y1="0" :x2="x" y2="260" class="funnel-widget__divider" vector-effect="non-scaling-stroke" />
    </svg>

    <div v-if="data.footerStats.length || data.warning" class="funnel-widget__footer">
      <div v-for="stat in data.footerStats" :key="stat.label" class="funnel-widget__stat">
        <span class="funnel-widget__stat-label">{{ stat.label }}</span>
        <span class="funnel-widget__stat-value">{{ stat.value }}</span>
      </div>
      <span class="funnel-widget__spacer" />
      <div v-if="data.warning" class="funnel-widget__warning">
        <v-icon size="14" aria-hidden="true">trending-down</v-icon>
        <span>{{ data.warning }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.funnel-widget {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-16);
  width: 100%;
  height: 100%;
  min-height: 0;
  container-type: inline-size;
}

.funnel-widget__stages {
  display: grid;
  flex: none;
}

.funnel-widget__stage {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  padding: 0 var(--mp-space-12) var(--mp-space-4) var(--mp-space-16);
  border-left: 1px solid var(--border-subtle);
  min-width: 0;
}

.funnel-widget__stage:first-child {
  padding-left: 0;
  border-left: 0;
}

.funnel-widget__stage-label {
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.funnel-widget__stage-value {
  font-size: var(--mp-fontSize-28);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: -0.028em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.funnel-widget__stage-share {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--muted);
}

.funnel-widget__stage-share--accent {
  color: var(--accent);
}

.funnel-widget__svg {
  width: 100%;
  flex: 1;
  min-height: 120px;
  display: block;
}

.funnel-widget__divider {
  stroke: var(--border-subtle);
  stroke-width: 1;
}

.funnel-widget__footer {
  display: flex;
  align-items: center;
  gap: var(--mp-space-24);
  padding-top: var(--mp-space-14);
  border-top: 1px solid var(--border-subtle);
  flex: none;
  flex-wrap: wrap;
  row-gap: var(--mp-space-12);
}

.funnel-widget__stat {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}

.funnel-widget__stat-label {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  white-space: nowrap;
}

.funnel-widget__stat-value {
  font-size: 17px;
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.funnel-widget__spacer {
  flex: 1;
}

.funnel-widget__warning {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  padding: var(--mp-space-8) var(--mp-space-12);
  border-radius: var(--mp-component-input-radius);
  background: var(--mp-color-light-warningContainer);
  color: var(--mp-color-light-onWarningContainer);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
}

@container (max-width: 720px) {
  .funnel-widget__stages {
    grid-template-columns: repeat(3, 1fr) !important;
    row-gap: var(--mp-space-12);
  }

  .funnel-widget__stage:nth-child(4) {
    padding-left: 0;
    border-left: 0;
  }

  .funnel-widget__warning {
    display: none;
  }
}
</style>
