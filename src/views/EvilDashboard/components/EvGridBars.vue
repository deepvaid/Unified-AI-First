<script setup lang="ts">
// evilcharts-style "Grid Bar Chart" dot-matrix: 24 hourly columns, each a
// column-reverse flex stack of square cells so the fill grows from the
// bottom, terminal/mono aesthetic. Pure CSS grid + flex, no SVG.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    values: number[]
    labels: string[]
    chartLabel: string
    rows?: number
  }>(),
  {
    rows: 16,
  },
)

const maxValue = computed(() => Math.max(0, ...props.values))

const columns = computed(() =>
  props.values.map((value, i) => {
    const filled = maxValue.value > 0 ? Math.round((value / maxValue.value) * props.rows) : 0
    return {
      key: i,
      label: props.labels[i] ?? '',
      showLabel: i % 2 === 0,
      // cells[0] renders at the bottom of the column (flex column-reverse),
      // so the first `filled` entries are the ones below the fill line.
      cells: Array.from({ length: props.rows }, (_, cellIndex) => cellIndex < filled),
    }
  }),
)
</script>

<template>
  <div class="ev-grid-bars" role="img" :aria-label="chartLabel">
    <div class="ev-grid-bars__matrix">
      <div v-for="col in columns" :key="col.key" class="ev-grid-bars__col">
        <div
          v-for="(filled, ci) in col.cells"
          :key="ci"
          class="ev-grid-bars__cell"
          :class="{ 'ev-grid-bars__cell--filled': filled }"
        />
      </div>
    </div>
    <div class="ev-grid-bars__labels">
      <span v-for="col in columns" :key="col.key" class="ev-grid-bars__label">{{ col.showLabel ? col.label : '' }}</span>
    </div>
  </div>
</template>

<style scoped>
.ev-grid-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  --ev-cell-fill: #171717;
}

.v-theme--maropostDark .ev-grid-bars {
  --ev-cell-fill: #e5e5e5;
}

.ev-grid-bars__matrix {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 4px;
}

.ev-grid-bars__col {
  display: flex;
  flex-direction: column-reverse;
  gap: 4px;
  min-width: 0;
}

.ev-grid-bars__cell {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 2px;
  background: var(--scn-track);
}

.ev-grid-bars__cell--filled {
  background: var(--ev-cell-fill);
}

.ev-grid-bars__labels {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
}

.ev-grid-bars__label {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--scn-muted);
  text-align: center;
  white-space: nowrap;
  overflow: visible;
}
</style>
