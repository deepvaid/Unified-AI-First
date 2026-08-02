<script setup lang="ts">
// Mini gradient columns — per-category headline over a small rounded gradient
// bar with a footer value (reference: "Total Visitors" device split). Generic:
// items via props; hover/focus shows a card tooltip.
import { tintHex } from '@/plugins/chartPalette'

export interface MiniColumnItem {
  key: string
  name: string
  /** Big figure above the bar ("28%", "9"). */
  headline: string
  /** Bar height, 0–100 relative to the tallest item. */
  barPct: number
  color: string
  /** Small figure under the bar ("3,494"). */
  footer?: string
  /** Trend arrow next to the footer. */
  deltaPct?: number
  tipLabel: string
  tipValue: string
  aria: string
}

defineProps<{
  items: MiniColumnItem[]
  groupLabel: string
}>()
</script>

<template>
  <div
    class="dmc"
    role="group"
    :aria-label="groupLabel"
    :style="{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }"
  >
    <button v-for="d in items" :key="d.key" type="button" class="dmc__col" :aria-label="d.aria">
      <span class="lab-tip dmc__tip" aria-hidden="true">
        <span class="lab-tip__title">{{ d.name }}</span>
        <span class="lab-tip__row">
          <span class="lab-tip__dot" :style="{ background: d.color }" />
          <span class="lab-tip__label">{{ d.tipLabel }}</span>
          <span class="lab-tip__value">{{ d.tipValue }}</span>
        </span>
      </span>
      <span class="dmc__name" aria-hidden="true">{{ d.name }}</span>
      <span class="dmc__pct" aria-hidden="true">{{ d.headline }}</span>
      <span class="dmc__track" aria-hidden="true">
        <span
          class="dmc__bar"
          :style="{
            height: `${d.barPct}%`,
            background: `linear-gradient(180deg, ${tintHex(d.color, 0.32)}, ${d.color})`,
          }"
        />
      </span>
      <span v-if="d.footer" class="dmc__count" aria-hidden="true">
        {{ d.footer }}
        <v-icon
          v-if="d.deltaPct !== undefined"
          size="12"
          :class="d.deltaPct >= 0 ? 'dmc__arrow--pos' : 'dmc__arrow--neg'"
        >
          {{ d.deltaPct >= 0 ? 'arrow-up-right' : 'arrow-down-right' }}
        </v-icon>
      </span>
    </button>
  </div>
</template>

<style scoped>
.dmc {
  display: grid;
  flex: 1;
}

.dmc__col {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 14px;
  min-width: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.dmc__col + .dmc__col {
  border-left: 1px dashed var(--border-subtle);
}

.dmc__col:focus-visible {
  outline: 2px solid var(--accent-default);
  outline-offset: 2px;
  border-radius: 12px;
}

.dmc__tip {
  position: absolute;
  top: -8px;
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

.dmc__col:hover .dmc__tip,
.dmc__col:focus-visible .dmc__tip {
  opacity: 1;
  transform: translateX(-50%) translateY(-100%);
}

.dmc__name {
  font-size: 12px;
  color: var(--text-muted);
}

.dmc__pct {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  margin: 2px 0 10px;
}

.dmc__track {
  display: flex;
  align-items: flex-end;
  width: 100%;
  max-width: 76px;
  flex: 1;
  min-height: 110px;
}

.dmc__bar {
  display: block;
  width: 100%;
  border-radius: 12px;
  min-height: 18px;
  transition: filter 0.15s ease;
}

.dmc__col:hover .dmc__bar,
.dmc__col:focus-visible .dmc__bar {
  filter: brightness(1.06);
}

.dmc__count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.dmc__arrow--pos {
  color: var(--pos-ink);
}

.dmc__arrow--neg {
  color: var(--neg-ink);
}

@media (prefers-reduced-motion: reduce) {
  .dmc__tip,
  .dmc__bar {
    transition: none;
  }
}
</style>
