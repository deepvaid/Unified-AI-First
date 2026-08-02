<script setup lang="ts">
// evilcharts-style "Peak Week" segmented bar chart: two rounded pill segments
// (organic on top, paid below) per week column, bottom-aligned, with the
// peak week called out in solid purple/teal + glow. Pure CSS/flex, no SVG
// needed since every segment is an axis-aligned rounded rect.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    items: { week: string; organic: number; paid: number }[]
    peakIndex: number
    chartLabel: string
    height?: number
  }>(),
  {
    height: 300,
  },
)

/** Gap between the organic/paid segments within a column, in px. */
const GAP = 6

const maxTotal = computed(() => Math.max(0, ...props.items.map((item) => item.organic + item.paid)))

/** px-per-unit so the tallest column (organic + paid + gap) fills `height`. */
const scale = computed(() => {
  const available = Math.max(props.height - GAP, 0)
  return maxTotal.value > 0 ? available / maxTotal.value : 0
})

const columns = computed(() =>
  props.items.map((item, i) => ({
    week: item.week,
    topPx: item.organic * scale.value,
    bottomPx: item.paid * scale.value,
    isPeak: i === props.peakIndex,
  })),
)
</script>

<template>
  <div class="ev-peak-bars" role="img" :aria-label="chartLabel">
    <div class="ev-peak-bars__row" :style="{ height: `${height}px` }">
      <div v-for="col in columns" :key="col.week" class="ev-peak-bars__col">
        <div
          class="ev-peak-bars__seg ev-peak-bars__seg--top"
          :class="{ 'ev-peak-bars__seg--peak-top': col.isPeak }"
          :style="{ height: `${col.topPx}px` }"
        />
        <div
          class="ev-peak-bars__seg ev-peak-bars__seg--bottom"
          :class="{ 'ev-peak-bars__seg--peak-bottom': col.isPeak }"
          :style="{ height: `${col.bottomPx}px` }"
        />
      </div>
    </div>
    <div class="ev-peak-bars__labels">
      <span v-for="col in columns" :key="col.week" class="ev-peak-bars__label">{{ col.week }}</span>
    </div>
  </div>
</template>

<style scoped>
.ev-peak-bars {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ev-peak-bars__row {
  display: flex;
  gap: 12px;
}

.ev-peak-bars__col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 6px;
}

.ev-peak-bars__seg {
  width: min(100%, 64px);
  margin: 0 auto;
  border-radius: 10px;
  background: var(--scn-track);
}

.ev-peak-bars__seg--peak-top {
  background: #7c3aed;
  box-shadow: 0 0 24px 2px rgba(124, 58, 237, 0.45);
}

.ev-peak-bars__seg--peak-bottom {
  background: #387c99;
  box-shadow: 0 0 20px 2px rgba(56, 124, 153, 0.4);
}

.ev-peak-bars__labels {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.ev-peak-bars__label {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: 13px;
  color: var(--scn-muted);
}
</style>
