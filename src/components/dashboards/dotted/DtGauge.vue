<script setup lang="ts">
// Goal gauge: round-capped progress arc over a soft track.
import { computed } from 'vue'

const props = defineProps<{
  /** 0–100 */
  pct: number
  centerValue: string
  centerCaption: string
}>()

const CIRC = 2 * Math.PI * 52
const dash = computed(() => {
  const on = (Math.min(100, Math.max(0, props.pct)) / 100) * CIRC
  return `${on.toFixed(1)} ${(CIRC - on).toFixed(1)}`
})
</script>

<template>
  <div class="dt-gauge">
    <svg viewBox="0 0 140 140" class="dt-gauge__svg" role="img" :aria-label="`${centerValue} ${centerCaption}`">
      <g transform="rotate(-90 70 70)" fill="none" stroke-width="15" stroke-linecap="round">
        <circle cx="70" cy="70" r="52" class="dt-gauge__track" />
        <circle cx="70" cy="70" r="52" stroke="#0092D4" :stroke-dasharray="dash" />
      </g>
    </svg>
    <div class="dt-gauge__center">
      <span class="dt-gauge__value">{{ centerValue }}</span>
      <span class="dt-gauge__caption">{{ centerCaption }}</span>
    </div>
  </div>
</template>

<style scoped>
.dt-gauge {
  position: relative;
  width: 172px;
  height: 172px;
}

.dt-gauge__svg {
  width: 172px;
  height: 172px;
  display: block;
}

.dt-gauge__track {
  stroke: var(--surface-secondary);
}

.dt-gauge__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.dt-gauge__value {
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.dt-gauge__caption {
  font-size: 11px;
  color: var(--muted);
}
</style>
