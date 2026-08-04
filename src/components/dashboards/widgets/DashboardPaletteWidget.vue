<script setup lang="ts">
// Palette-review widget (dotted Overview v2): one segmented bar per chart
// family showing every shade in ramp order, with hex labels — lets
// stakeholders review the dashboard's chart colors in one card.
import type { DashboardPaletteData } from '@/stores/dashboards/types'

defineProps<{
  data: DashboardPaletteData
}>()
</script>

<template>
  <div class="palette-widget">
    <div v-for="group in data.groups" :key="group.title" class="palette-widget__group">
      <div class="palette-widget__head">
        <span class="palette-widget__title">{{ group.title }}</span>
        <span class="palette-widget__count">{{ group.shades.length }} shades</span>
      </div>
      <div class="palette-widget__bar" role="img" :aria-label="`${group.title}: ${group.shades.join(', ')}`">
        <span
          v-for="shade in group.shades"
          :key="shade"
          class="palette-widget__segment"
          :style="{ background: shade }"
        />
      </div>
      <div class="palette-widget__hexes" aria-hidden="true">
        <span v-for="shade in group.shades" :key="shade" class="palette-widget__hex">{{ shade }}</span>
      </div>
      <span class="palette-widget__caption">{{ group.caption }}</span>
    </div>
    <span v-if="data.footnote" class="palette-widget__footnote">{{ data.footnote }}</span>
  </div>
</template>

<style scoped>
.palette-widget {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
  min-height: 0;
  justify-content: space-evenly;
  /* Cramped layouts scroll instead of clipping the last ramp. */
  overflow-y: auto;
}

.palette-widget__group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.palette-widget__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.palette-widget__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.palette-widget__count {
  font-size: 11.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  flex: none;
}

.palette-widget__bar {
  display: flex;
  height: 20px;
  border-radius: 6px;
  overflow: hidden;
  gap: 2px;
}

.palette-widget__segment {
  flex: 1 1 0;
  min-width: 0;
}

.palette-widget__hexes {
  display: flex;
  gap: 2px;
}

.palette-widget__hex {
  flex: 1 1 0;
  min-width: 0;
  font-size: 9.5px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: var(--muted);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.palette-widget__caption {
  font-size: 11.5px;
  color: var(--muted);
}

.palette-widget__footnote {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
