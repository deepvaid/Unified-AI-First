<script setup lang="ts">
// Progress rank list — name, gradient rounded fill on a soft track, value at
// the right, optional pill (reference: "Active Projects"). Generic: rows come
// in via props so any ranked metric can reuse it.
import { tintHex } from '@/plugins/chartPalette'

export interface RankProgressRow {
  key: string
  name: string
  color: string
  /** Fill width, 0–100. */
  pct: number
  valueLabel: string
  pill?: string
  aria: string
}

defineProps<{
  rows: RankProgressRow[]
  listLabel: string
}>()
</script>

<template>
  <ol class="rpl" :aria-label="listLabel">
    <li v-for="(r, i) in rows" :key="r.key" class="rpl__item" :aria-label="`${i + 1}. ${r.aria}`">
      <span class="rpl__rank" aria-hidden="true">{{ i + 1 }}</span>
      <div class="rpl__main" aria-hidden="true">
        <div class="rpl__top">
          <span class="rpl__name">{{ r.name }}</span>
          <span class="rpl__value">{{ r.valueLabel }}</span>
        </div>
        <div class="rpl__track">
          <span
            class="rpl__fill"
            :style="{
              width: `${r.pct}%`,
              background: `linear-gradient(90deg, ${r.color}, ${tintHex(r.color, 0.3)})`,
            }"
          />
        </div>
      </div>
      <span v-if="r.pill" class="rpl__pill" aria-hidden="true">{{ r.pill }}</span>
    </li>
  </ol>
</template>

<style scoped>
.rpl {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  justify-content: center;
}

.rpl__item {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.rpl__rank {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.rpl__main {
  min-width: 0;
}

.rpl__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 5px;
}

.rpl__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rpl__value {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.rpl__track {
  height: 9px;
  border-radius: 999px;
  background: var(--surface-secondary);
  overflow: hidden;
}

.rpl__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  min-width: 8px;
}

.rpl__pill {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--surface-secondary);
  border-radius: 999px;
  padding: 4px 9px;
  font-variant-numeric: tabular-nums;
}
</style>
