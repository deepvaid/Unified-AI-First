<script setup lang="ts">
// Thermometer pill tracks with a dot marker per column; the active column gets
// a filled pill, dark value bubble and highlighted label chip (reference:
// "Average Sales"). Generic: labels/values via props. Hover previews a column,
// click (or Enter/Space) selects it.
import { computed, ref } from 'vue'
import { tintHex } from '@/plugins/chartPalette'
import { C } from '../chartLabData'

const props = withDefaults(
  defineProps<{
    labels: string[]
    values: number[]
    /** Scale ceiling for dot positions. */
    max: number
    initialActive?: number
    formatValue?: (v: number) => string
    groupLabel: string
    /** Optional stat header block. */
    headline?: { value: string; deltaLabel: string; deltaPositive: boolean; caption: string }
  }>(),
  {
    initialActive: 0,
    formatValue: (v: number) => `$${Math.round(v).toLocaleString('en-US')}`,
    headline: undefined,
  },
)

const activeFill = `linear-gradient(180deg, ${tintHex(C.periwinkle, 0.42)}, ${tintHex(C.periwinkle, 0.12)})`

const active = ref(props.initialActive)
const hover = ref<number | null>(null)
const shown = computed(() => hover.value ?? active.value)
</script>

<template>
  <div class="thc">
    <template v-if="headline">
      <div class="thc__stat">
        <span class="thc__value">{{ headline.value }}</span>
        <span class="thc__pill" :class="headline.deltaPositive ? 'thc__pill--pos' : 'thc__pill--neg'">
          <v-icon size="12" aria-hidden="true">{{ headline.deltaPositive ? 'trending-up' : 'trending-down' }}</v-icon>
          {{ headline.deltaLabel }}
        </span>
      </div>
      <p class="thc__caption">{{ headline.caption }}</p>
    </template>
    <div
      class="thc__plot"
      role="group"
      :aria-label="groupLabel"
      :style="{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }"
    >
      <button
        v-for="(m, i) in labels"
        :key="m"
        type="button"
        class="thc__col"
        :class="{ 'thc__col--active': i === shown }"
        :aria-label="`${m}: ${formatValue(values[i] ?? 0)}`"
        :aria-pressed="i === active"
        @mouseenter="hover = i"
        @mouseleave="hover = null"
        @focus="hover = i"
        @blur="hover = null"
        @click="active = i"
      >
        <span v-if="i === shown" class="thc__bubble" aria-hidden="true">{{ formatValue(values[i] ?? 0) }}</span>
        <span class="thc__track" :style="i === shown ? { background: activeFill } : undefined">
          <span class="thc__dash" aria-hidden="true" />
          <span
            class="thc__dot"
            :style="{ bottom: `calc(${((values[i] ?? 0) / max) * 100}% - 6px)` }"
          />
        </span>
        <span class="thc__month" :class="{ 'thc__month--active': i === shown }" aria-hidden="true">{{ m }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.thc {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.thc__stat {
  display: flex;
  align-items: center;
  gap: 10px;
}

.thc__value {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.thc__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 999px;
}

.thc__pill--pos {
  color: var(--pos-ink);
  background: color-mix(in oklch, var(--pos) 14%, #ffffff);
}

.thc__pill--neg {
  color: var(--neg-ink);
  background: color-mix(in oklch, var(--neg) 14%, #ffffff);
}

.thc__caption {
  font-size: 12px;
  color: var(--text-muted);
  margin: 4px 0 16px;
}

.thc__plot {
  display: grid;
  gap: 14px;
  flex: 1;
  min-height: 200px;
  padding-top: 30px; /* headroom so the value bubble never covers the caption */
}

.thc__col {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 0;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.thc__col:focus-visible {
  outline: 2px solid var(--accent-default);
  outline-offset: 2px;
  border-radius: 14px;
}

.thc__bubble {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translate(-50%, -100%);
  background: #1f2430;
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  z-index: 6;
}

.thc__bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -4px;
  transform: translateX(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #1f2430;
}

.thc__track {
  position: relative;
  width: 100%;
  max-width: 52px;
  flex: 1;
  border-radius: 999px;
  background: var(--surface-secondary);
  transition: background 0.18s ease;
}

.thc__dash {
  position: absolute;
  inset: 14px 50% 14px;
  width: 1px;
  transform: translateX(-0.5px);
  background-image: linear-gradient(to bottom, var(--border-subtle) 55%, transparent 45%);
  background-size: 1px 7px;
}

.thc__dot {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: v-bind('C.periwinkleDeep');
  transition: width 0.18s ease, height 0.18s ease;
}

.thc__col--active .thc__dot {
  width: 30px;
  height: 30px;
  bottom: 6px !important;
}

.thc__month {
  font-size: 11.5px;
  color: var(--text-muted);
  padding: 3px 10px;
  border-radius: 999px;
  transition: background 0.18s ease, color 0.18s ease;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thc__month--active {
  background: v-bind('C.periwinkleDeep');
  color: #ffffff;
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .thc__track,
  .thc__dot,
  .thc__month {
    transition: none;
  }
}
</style>
