<script setup lang="ts">
// Main metric chart card: dotted-texture area fill, gradient stroke, dashed
// previous-period compare line. Paths are computed by the parent on the fixed
// 720×200 design canvas (see dottedDemoData.linePath).
defineProps<{
  metricLabel: string
  vsLabelLong: string
  areaPath: string
  prevPath: string
  strokePath: string
  yLabels: [string, string, string]
  xLabels: string[]
}>()

const compare = defineModel<boolean>('compare', { required: true })
</script>

<template>
  <section class="dt-chart-card">
    <div class="dt-chart-card__head">
      <div class="dt-chart-card__heading">
        <h2 class="dt-chart-card__title">{{ metricLabel }}</h2>
        <p class="dt-chart-card__sub">Select a metric above · {{ vsLabelLong }}</p>
      </div>
      <button type="button" class="dt-chart-card__compare" :aria-pressed="compare" @click="compare = !compare">
        <span class="dt-chart-card__compare-dash" :style="{ opacity: compare ? 1 : 0.25 }" aria-hidden="true" />Compare
      </button>
    </div>
    <div class="dt-chart-card__body">
      <div class="dt-chart-card__yaxis">
        <span>{{ yLabels[0] }}</span>
        <span>{{ yLabels[1] }}</span>
        <span>{{ yLabels[2] }}</span>
      </div>
      <div class="dt-chart-card__plot">
        <svg viewBox="0 0 720 200" preserveAspectRatio="none" class="dt-chart-card__svg" role="img" :aria-label="`${metricLabel} trend chart`">
          <defs>
            <linearGradient id="dtRevFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0092D4" stop-opacity="0.18" />
              <stop offset="60%" stop-color="#3FB4E6" stop-opacity="0.07" />
              <stop offset="100%" stop-color="#63CDEF" stop-opacity="0" />
            </linearGradient>
            <pattern id="dtRevDots" width="9" height="9" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.15" fill="#0092D4" fill-opacity="0.30" />
            </pattern>
            <linearGradient id="dtRevStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#0092D4" />
              <stop offset="60%" stop-color="#3FB4E6" />
              <stop offset="100%" stop-color="#63CDEF" />
            </linearGradient>
          </defs>
          <line x1="0" y1="0" x2="720" y2="0" class="dt-chart-card__grid" stroke-dasharray="2 5" vector-effect="non-scaling-stroke" />
          <line x1="0" y1="100" x2="720" y2="100" class="dt-chart-card__grid" stroke-dasharray="2 5" vector-effect="non-scaling-stroke" />
          <line x1="0" y1="200" x2="720" y2="200" class="dt-chart-card__grid" stroke-dasharray="2 5" vector-effect="non-scaling-stroke" />
          <path :d="areaPath" fill="url(#dtRevFill)" />
          <path :d="areaPath" fill="url(#dtRevDots)" />
          <path v-if="prevPath" :d="prevPath" fill="none" class="dt-chart-card__prev" stroke-width="1.5" stroke-dasharray="5 5" vector-effect="non-scaling-stroke" />
          <path :d="strokePath" fill="none" stroke="url(#dtRevStroke)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
        </svg>
        <div class="dt-chart-card__xaxis">
          <span v-for="label in xLabels" :key="label">{{ label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dt-chart-card {
  border: 1px solid var(--scn-border);
  border-radius: var(--scn-radius);
  background: var(--scn-card);
  padding: 22px 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
  height: 100%;
}

.dt-chart-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dt-chart-card__heading {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dt-chart-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.012em;
  color: var(--scn-fg);
}

.dt-chart-card__sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-chart-card__compare {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--scn-border);
  border-radius: 999px;
  background: var(--scn-card);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--scn-fg);
  cursor: pointer;
}

.dt-chart-card__compare-dash {
  width: 14px;
  height: 2px;
  border-radius: 2px;
  background: var(--scn-muted);
}

.dt-chart-card__body {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 220px;
}

.dt-chart-card__yaxis {
  width: 44px;
  flex: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 26px;
  font-size: 11px;
  color: var(--scn-muted);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.dt-chart-card__plot {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dt-chart-card__svg {
  width: 100%;
  flex: 1;
  min-height: 200px;
  display: block;
  overflow: visible;
}

.dt-chart-card__grid {
  stroke: var(--scn-border);
  stroke-width: 1;
}

.dt-chart-card__prev {
  stroke: var(--scn-muted);
  opacity: 0.55;
}

.dt-chart-card__xaxis {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--scn-muted);
}
</style>
