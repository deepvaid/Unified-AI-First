<script setup lang="ts">
// Revenue by channel as stacked pill columns: every segment is an individually
// rounded pill with gaps, month totals float above, and soft ribbon connectors
// link the channels across columns (reference: "Sales Overview" stacked bars).
// Interactive: hovering/focusing a segment (or legend chip) highlights that
// channel across all columns and shows a card tooltip with value + share.
import { computed, ref } from 'vue'
import { tintHex } from '@/plugins/chartPalette'
import { CHANNELS, STACK_MONTHS, formatCurrencyFull, formatCurrencyShort, type Channel } from '../chartLabData'

const maxTotal = Math.max(...STACK_MONTHS.map((m) => m.total))

const hoveredChannel = ref<string | null>(null)

interface Segment {
  channel: Channel
  value: number
  pct: number
}

// Display columns: segments reversed so the first channel sits at the bottom.
const columns = computed(() =>
  STACK_MONTHS.map((m) => ({
    label: m.label,
    total: m.total,
    segs: m.values
      .map((v, ci): Segment => ({
        channel: CHANNELS[ci] as Channel,
        value: v,
        pct: Math.round((v / m.total) * 100),
      }))
      .reverse(),
  })),
)

// Percent-of-max cumulative bounds per month per channel (bottom-up).
const bounds = computed(() =>
  STACK_MONTHS.map((m) => {
    let acc = 0
    return m.values.map((v) => {
      const bottom = (acc / maxTotal) * 100
      acc += v
      const top = (acc / maxTotal) * 100
      return { bottom, top }
    })
  }),
)

// Ribbon polygons in a 0–100 viewBox (y flipped). Columns sit at fixed centers.
const COL_CENTERS = [16.7, 50, 83.3]
const COL_HALF = 9 // half of the 18%-wide column

const ribbons = computed(() => {
  const out: Array<{ key: string; channelKey: string; points: string; color: string }> = []
  for (let ci = 0; ci < CHANNELS.length; ci++) {
    for (let mi = 0; mi < STACK_MONTHS.length - 1; mi++) {
      const a = bounds.value[mi]?.[ci]
      const b = bounds.value[mi + 1]?.[ci]
      const x1 = (COL_CENTERS[mi] ?? 0) + COL_HALF
      const x2 = (COL_CENTERS[mi + 1] ?? 0) - COL_HALF
      if (!a || !b) continue
      const points = [
        `${x1},${100 - a.top}`,
        `${x2},${100 - b.top}`,
        `${x2},${100 - b.bottom}`,
        `${x1},${100 - a.bottom}`,
      ].join(' ')
      out.push({
        key: `${CHANNELS[ci]?.key}-${mi}`,
        channelKey: CHANNELS[ci]?.key ?? '',
        points,
        color: CHANNELS[ci]?.color ?? '#000',
      })
    }
  }
  return out
})

function ribbonOpacity(channelKey: string): number {
  if (!hoveredChannel.value) return 0.07
  return hoveredChannel.value === channelKey ? 0.2 : 0.025
}

function segmentStyle(seg: Segment) {
  return {
    height: `${(seg.value / maxTotal) * 100}%`,
    background: `linear-gradient(180deg, ${tintHex(seg.channel.color, 0.24)}, ${seg.channel.color})`,
  }
}
</script>

<template>
  <div class="spc">
    <div
      class="spc__plot"
      role="group"
      :aria-label="`Revenue by channel, monthly: ${STACK_MONTHS.map((m) => `${m.label} ${formatCurrencyFull(m.total)}`).join(', ')}.`"
    >
      <svg class="spc__ribbons" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon
          v-for="r in ribbons"
          :key="r.key"
          :points="r.points"
          :fill="r.color"
          :opacity="ribbonOpacity(r.channelKey)"
          class="spc__ribbon"
        />
      </svg>
      <div v-for="col in columns" :key="col.label" class="spc__col">
        <span class="spc__total" aria-hidden="true">{{ formatCurrencyShort(col.total) }}</span>
        <div class="spc__stack" :style="{ height: `calc((100% - 50px) * ${(col.total / maxTotal).toFixed(4)})` }">
          <button
            v-for="seg in col.segs"
            :key="seg.channel.key"
            type="button"
            class="spc__seg"
            :class="{ 'spc__seg--dim': hoveredChannel && hoveredChannel !== seg.channel.key }"
            :style="segmentStyle(seg)"
            :aria-label="`${col.label}, ${seg.channel.name}: ${formatCurrencyFull(seg.value)}, ${seg.pct}% of the month`"
            @mouseenter="hoveredChannel = seg.channel.key"
            @mouseleave="hoveredChannel = null"
            @focus="hoveredChannel = seg.channel.key"
            @blur="hoveredChannel = null"
          >
            <span class="lab-tip spc__tip" aria-hidden="true">
              <span class="lab-tip__title">{{ col.label }} · {{ seg.channel.name }}</span>
              <span class="lab-tip__row">
                <span class="lab-tip__dot" :style="{ background: seg.channel.color }" />
                <span class="lab-tip__label">{{ formatCurrencyFull(seg.value) }}</span>
                <span class="lab-tip__value">{{ seg.pct }}%</span>
              </span>
            </span>
          </button>
        </div>
        <span class="spc__month" aria-hidden="true">{{ col.label }}</span>
      </div>
    </div>
    <div class="spc__legend">
      <button
        v-for="c in CHANNELS"
        :key="c.key"
        type="button"
        class="spc__legend-item"
        :class="{ 'spc__legend-item--dim': hoveredChannel && hoveredChannel !== c.key }"
        :aria-label="`Highlight ${c.name} across all months`"
        @mouseenter="hoveredChannel = c.key"
        @mouseleave="hoveredChannel = null"
        @focus="hoveredChannel = c.key"
        @blur="hoveredChannel = null"
      >
        <span class="spc__dot" :style="{ background: c.color }" aria-hidden="true" />
        {{ c.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.spc {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.spc__plot {
  position: relative;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  flex: 1;
  min-height: 250px;
  padding-top: 26px;
}

.spc__ribbons {
  position: absolute;
  inset: 26px 0 22px;
  width: 100%;
  height: calc(100% - 48px);
}

.spc__ribbon {
  transition: opacity 0.18s ease;
}

.spc__col {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 18%;
  height: 100%;
}

.spc__stack {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  width: 100%;
  margin-bottom: 22px;
}

.spc__seg {
  position: relative;
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  border-radius: 10px;
  min-height: 8px;
  cursor: pointer;
  transition: opacity 0.18s ease, filter 0.18s ease;
  font: inherit;
}

.spc__seg:hover {
  filter: brightness(1.05);
}

.spc__seg:focus-visible {
  outline: 2px solid var(--accent-default);
  outline-offset: 1px;
}

.spc__seg--dim {
  opacity: 0.3;
}

.spc__tip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(3px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  white-space: nowrap;
  z-index: 6;
  display: block;
  text-align: left;
}

.spc__seg:hover .spc__tip,
.spc__seg:focus-visible .spc__tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.spc__total {
  position: absolute;
  top: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.spc__month {
  position: absolute;
  bottom: 0;
  font-size: 11.5px;
  color: var(--text-muted);
}

.spc__legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 6px;
  margin-top: 12px;
}

.spc__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  border: 0;
  border-radius: 999px;
  padding: 4px 8px;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.18s ease, background 0.18s ease;
}

.spc__legend-item:hover {
  background: var(--surface-secondary);
}

.spc__legend-item:focus-visible {
  outline: 2px solid var(--accent-default);
  outline-offset: 1px;
}

.spc__legend-item--dim {
  opacity: 0.45;
}

.spc__dot {
  width: 8px;
  height: 8px;
  border-radius: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .spc__ribbon,
  .spc__seg,
  .spc__tip,
  .spc__legend-item {
    transition: none;
  }
}
</style>
