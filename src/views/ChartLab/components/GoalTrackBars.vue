<script setup lang="ts">
// Monthly revenue vs goal — rounded gradient columns on hatched full-height
// tracks, stat header with goal progress (reference: "Total Revenue" bars).
// Interactive: hover/focus a month for a card tooltip with value + goal %.
import { computed } from 'vue'
import { tintHex } from '@/plugins/chartPalette'
import { C, GOAL_BARS, formatCurrencyFull } from '../chartLabData'

const goalPct = computed(() => Math.round(((GOAL_BARS.values[GOAL_BARS.values.length - 1] ?? 0) / GOAL_BARS.goal) * 100))
const maxValue = GOAL_BARS.goal

const fill = `linear-gradient(180deg, ${tintHex(C.periwinkle, 0.28)}, ${C.periwinkleDeep})`

const months = computed(() =>
  GOAL_BARS.months.map((label, i) => {
    const value = GOAL_BARS.values[i] ?? 0
    return { label, value, pct: Math.round((value / GOAL_BARS.goal) * 100) }
  }),
)
</script>

<template>
  <div class="gtb">
    <div class="gtb__stat">
      <span class="gtb__value">{{ GOAL_BARS.headline }}</span>
      <span class="gtb__pill">
        <v-icon size="12" aria-hidden="true">trending-up</v-icon>
        {{ GOAL_BARS.deltaLabel }}
      </span>
    </div>
    <p class="gtb__caption">{{ goalPct }}% of {{ formatCurrencyFull(GOAL_BARS.goal) }} monthly goal met · {{ GOAL_BARS.caption }}</p>
    <div class="gtb__plot" role="group" :aria-label="`Monthly revenue against a ${formatCurrencyFull(GOAL_BARS.goal)} goal.`">
      <button
        v-for="m in months"
        :key="m.label"
        type="button"
        class="gtb__col"
        :aria-label="`${m.label}: ${formatCurrencyFull(m.value)}, ${m.pct}% of goal`"
      >
        <span class="lab-tip gtb__tip" aria-hidden="true">
          <span class="lab-tip__title">{{ m.label }}</span>
          <span class="lab-tip__row">
            <span class="lab-tip__dot" :style="{ background: C.periwinkleDeep }" />
            <span class="lab-tip__label">{{ formatCurrencyFull(m.value) }}</span>
            <span class="lab-tip__value">{{ m.pct }}% of goal</span>
          </span>
        </span>
        <span class="gtb__track">
          <span class="gtb__bar" :style="{ height: `${(m.value / maxValue) * 100}%`, background: fill }" />
        </span>
        <span class="gtb__month" aria-hidden="true">{{ m.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.gtb {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.gtb__stat {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gtb__value {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.gtb__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 999px;
  color: var(--pos-ink);
  background: color-mix(in oklch, var(--pos) 14%, #ffffff);
}

.gtb__caption {
  font-size: 12px;
  color: var(--text-muted);
  margin: 4px 0 16px;
}

.gtb__plot {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  flex: 1;
  min-height: 190px;
}

.gtb__col {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.gtb__col:focus-visible {
  outline: 2px solid var(--accent-default);
  outline-offset: 2px;
  border-radius: 12px;
}

.gtb__track {
  position: relative;
  display: flex;
  align-items: flex-end;
  width: 100%;
  flex: 1;
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--surface-secondary) 55%, transparent);
  background-image: repeating-linear-gradient(
    45deg,
    rgba(15, 23, 42, 0.045) 0 2px,
    transparent 2px 6px
  );
  overflow: hidden;
}

.gtb__bar {
  display: block;
  width: 100%;
  border-radius: 12px;
  min-height: 14px;
  transition: filter 0.15s ease;
}

.gtb__col:hover .gtb__bar,
.gtb__col:focus-visible .gtb__bar {
  filter: brightness(1.08);
}

.gtb__tip {
  position: absolute;
  bottom: calc(100% + 6px);
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

.gtb__col:hover .gtb__tip,
.gtb__col:focus-visible .gtb__tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.gtb__month {
  font-size: 11.5px;
  color: var(--text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .gtb__bar,
  .gtb__tip {
    transition: none;
  }
}
</style>
