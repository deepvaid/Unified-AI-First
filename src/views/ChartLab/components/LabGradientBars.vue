<script setup lang="ts">
// Vertical rounded gradient bars on soft tracks with floating value labels and
// hover/focus card tooltips (references: "Total Revenue", "My Campaigns").
import { computed } from 'vue'
import { tintHex } from '@/plugins/chartPalette'

export interface GradientBarItem {
  key: string
  name: string
  value: number
  color: string
}

const props = withDefaults(
  defineProps<{
    items: GradientBarItem[]
    formatValue?: (v: number) => string
    groupLabel: string
    /** Show each bar's share of the total in its tooltip. */
    showShare?: boolean
  }>(),
  {
    formatValue: (v: number) => `$${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`,
    showShare: true,
  },
)

const max = computed(() => Math.max(...props.items.map((i) => i.value)))
const total = computed(() => props.items.reduce((a, i) => a + i.value, 0))
</script>

<template>
  <div
    class="lgb"
    role="group"
    :aria-label="groupLabel"
    :style="{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }"
  >
    <button
      v-for="it in items"
      :key="it.key"
      type="button"
      class="lgb__col"
      :aria-label="`${it.name}: ${formatValue(it.value)}${showShare ? `, ${Math.round((it.value / total) * 100)}% of total` : ''}`"
    >
      <span class="lab-tip lgb__tip" aria-hidden="true">
        <span class="lab-tip__title">{{ it.name }}</span>
        <span class="lab-tip__row">
          <span class="lab-tip__dot" :style="{ background: it.color }" />
          <span class="lab-tip__label">{{ formatValue(it.value) }}</span>
          <span v-if="showShare" class="lab-tip__value">{{ Math.round((it.value / total) * 100) }}%</span>
        </span>
      </span>
      <span class="lgb__value" aria-hidden="true">{{ formatValue(it.value) }}</span>
      <span class="lgb__track" aria-hidden="true">
        <span
          class="lgb__bar"
          :style="{
            height: `${(it.value / max) * 100}%`,
            background: `linear-gradient(180deg, ${tintHex(it.color, 0.26)}, ${it.color})`,
          }"
        />
      </span>
      <span class="lgb__name" aria-hidden="true">{{ it.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.lgb {
  display: grid;
  gap: 14px;
  flex: 1;
  min-height: 220px;
}

.lgb__col {
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

.lgb__col:focus-visible {
  outline: 2px solid var(--accent-default);
  outline-offset: 2px;
  border-radius: 12px;
}

.lgb__value {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.lgb__track {
  position: relative;
  display: flex;
  align-items: flex-end;
  width: 100%;
  max-width: 72px;
  flex: 1;
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-secondary) 65%, transparent);
  overflow: hidden;
}

.lgb__bar {
  display: block;
  width: 100%;
  border-radius: 12px;
  min-height: 14px;
  transition: filter 0.15s ease;
}

.lgb__col:hover .lgb__bar,
.lgb__col:focus-visible .lgb__bar {
  filter: brightness(1.07);
}

.lgb__tip {
  position: absolute;
  top: -6px;
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

.lgb__col:hover .lgb__tip,
.lgb__col:focus-visible .lgb__tip {
  opacity: 1;
  transform: translateX(-50%) translateY(-100%);
}

.lgb__name {
  font-size: 11.5px;
  color: var(--text-muted);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .lgb__bar,
  .lgb__tip {
    transition: none;
  }
}
</style>
