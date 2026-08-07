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
  gap: 16px;
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
  gap: 6px;
  padding: 0 12px 4px 16px;
  border-left: 1px solid var(--border-subtle);
  min-width: 0;
}

.funnel-widget__stage:first-child {
  padding-left: 0;
  border-left: 0;
}

.funnel-widget__stage-label {
  font-size: 12.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.funnel-widget__stage-value {
  font-size: 26px;
  font-weight: 650;
  letter-spacing: -0.028em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.funnel-widget__stage-share {
  font-size: 12px;
  font-weight: 600;
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
  gap: 24px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  flex: none;
  flex-wrap: wrap;
  row-gap: 12px;
}

.funnel-widget__stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.funnel-widget__stat-label {
  font-size: 11.5px;
  color: var(--muted);
  white-space: nowrap;
}

.funnel-widget__stat-value {
  font-size: 17px;
  font-weight: 600;
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
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--mp-color-light-warningContainer);
  color: var(--mp-color-light-onWarningContainer);
  font-size: 12.5px;
  font-weight: 600;
}

@container (max-width: 720px) {
  .funnel-widget__stages {
    grid-template-columns: repeat(3, 1fr) !important;
    row-gap: 12px;
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
