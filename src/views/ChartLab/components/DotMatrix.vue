<script setup lang="ts">
// Audience quality — dot-matrix waffle columns with a headline score
// (reference: "Performance Quality"). Dot count encodes the percentage; the
// % label above each column carries the exact value.
import { AUDIENCE_QUALITY } from '../chartLabData'

const ROWS = 10
const COLS = 5 // dots per group column row → 50 dots max per group

function dotsFor(pct: number): number {
  return Math.round((pct / 100) * ROWS * COLS)
}
</script>

<template>
  <div class="dmx">
    <div class="dmx__score" :aria-label="`Audience quality score ${AUDIENCE_QUALITY.score} out of ${AUDIENCE_QUALITY.outOf}`">
      <span class="dmx__score-value">{{ AUDIENCE_QUALITY.score }}</span>
      <span class="dmx__score-out">/ {{ AUDIENCE_QUALITY.outOf }}</span>
    </div>
    <div class="dmx__legend" aria-hidden="true">
      <span v-for="g in AUDIENCE_QUALITY.groups" :key="g.name" class="dmx__legend-item">
        <span class="dmx__dot" :style="{ background: g.color }" />
        {{ g.name }}
      </span>
    </div>
    <div class="dmx__grid">
      <div
        v-for="g in AUDIENCE_QUALITY.groups"
        :key="g.name"
        class="dmx__col"
        :aria-label="`${g.name}: ${g.pct}%`"
      >
        <span class="dmx__pct" aria-hidden="true">{{ g.pct }}<span class="dmx__pct-sign">%</span></span>
        <div class="dmx__matrix" aria-hidden="true">
          <span
            v-for="d in ROWS * COLS"
            :key="d"
            class="dmx__cell"
            :style="{ background: d <= dotsFor(g.pct) ? g.color : 'var(--surface-secondary)' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dmx {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.dmx__score {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.dmx__score-value {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.dmx__score-out {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-muted);
}

.dmx__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: 8px 0 16px;
}

.dmx__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.dmx__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.dmx__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  flex: 1;
}

.dmx__col {
  min-width: 0;
}

.dmx__pct {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.dmx__pct-sign {
  color: var(--text-muted);
  font-weight: 600;
}

.dmx__matrix {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  justify-items: center;
}

.dmx__cell {
  width: 6px;
  height: 6px;
  border-radius: 999px;
}
</style>
