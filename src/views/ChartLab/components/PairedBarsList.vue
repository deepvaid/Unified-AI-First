<script setup lang="ts">
// Paired horizontal bars per item — two related measures with values at the
// bar ends (reference: "Popular Product"). Generic: legend + rows via props.
export interface PairedBarsRow {
  key: string
  name: string
  /** Fill widths, 0–100. */
  aPct: number
  aLabel: string
  bPct: number
  bLabel: string
  aria: string
}

withDefaults(
  defineProps<{
    rows: PairedBarsRow[]
    legendA: string
    legendB: string
    /** CSS backgrounds for the two bars (gradients welcome). */
    fillA: string
    fillB: string
    /** Legend dot colors. */
    colorA: string
    colorB: string
    listLabel: string
    /** Tighter spacing for longer lists. */
    dense?: boolean
  }>(),
  { dense: false },
)
</script>

<template>
  <div class="pbl" :class="{ 'pbl--dense': dense }">
    <div class="pbl__legend" aria-hidden="true">
      <span class="pbl__legend-item"><span class="pbl__dot" :style="{ background: colorA }" /> {{ legendA }}</span>
      <span class="pbl__legend-item"><span class="pbl__dot" :style="{ background: colorB }" /> {{ legendB }}</span>
    </div>
    <ol class="pbl__list" :aria-label="listLabel">
      <li v-for="r in rows" :key="r.key" class="pbl__item" :aria-label="r.aria">
        <span class="pbl__name" aria-hidden="true">{{ r.name }}</span>
        <div class="pbl__pair" aria-hidden="true">
          <div class="pbl__row">
            <span class="pbl__bar pbl__bar--a" :style="{ width: `${r.aPct}%`, background: fillA }" />
            <span class="pbl__value">{{ r.aLabel }}</span>
          </div>
          <div class="pbl__row">
            <span class="pbl__bar pbl__bar--b" :style="{ width: `${r.bPct}%`, background: fillB }" />
            <span class="pbl__value">{{ r.bLabel }}</span>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.pbl {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.pbl__legend {
  display: flex;
  gap: 16px;
  margin-bottom: 14px;
}

.pbl__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.pbl__dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.pbl__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pbl--dense .pbl__list {
  gap: 11px;
}

.pbl__name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pbl--dense .pbl__name {
  font-size: 12.5px;
  margin-bottom: 4px;
}

.pbl__pair {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.pbl--dense .pbl__pair {
  gap: 4px;
}

.pbl__row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.pbl__bar {
  display: block;
  border-radius: 999px;
  flex-shrink: 0;
  min-width: 6px;
}

.pbl__bar--a {
  height: 12px;
}

.pbl__bar--b {
  height: 9px;
  opacity: 0.85;
}

.pbl--dense .pbl__bar--a {
  height: 10px;
}

.pbl--dense .pbl__bar--b {
  height: 8px;
}

.pbl__value {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
