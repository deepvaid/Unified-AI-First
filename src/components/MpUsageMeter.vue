<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  used: number
  /** -1 = unlimited */
  limit: number
  icon?: string
  hint?: string
  dense?: boolean
}>(), {
  dense: false,
})

const isUnlimited = computed(() => props.limit === -1)

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

const pct = computed(() => {
  if (isUnlimited.value) return 8
  if (props.limit <= 0) return 0
  return Math.min(100, (props.used / props.limit) * 100)
})

const color = computed(() => {
  if (isUnlimited.value) return 'primary'
  if (pct.value >= 95) return 'error'
  if (pct.value >= 80) return 'warning'
  return 'primary'
})

const rightText = computed(() => {
  const usedText = compact.format(props.used)
  return isUnlimited.value ? `${usedText} · Unlimited` : `${usedText} / ${compact.format(props.limit)}`
})
</script>

<template>
  <div class="mp-usage-meter" :class="{ 'mp-usage-meter--dense': dense }">
    <div class="d-flex align-center justify-space-between mb-1 ga-2">
      <div class="d-flex align-center ga-2 min-width-0">
        <v-icon v-if="icon" size="16" class="text-medium-emphasis flex-shrink-0">{{ icon }}</v-icon>
        <span class="mp-usage-meter__label text-medium-emphasis">{{ label }}</span>
      </div>
      <span class="mp-usage-meter__value text-medium-emphasis flex-shrink-0">{{ rightText }}</span>
    </div>

    <v-progress-linear
      :model-value="pct"
      :color="color"
      :height="dense ? 4 : 6"
      rounded
      bg-color="rgba(var(--v-theme-on-surface), 0.08)"
    />

    <div v-if="hint" class="mp-usage-meter__hint text-caption text-medium-emphasis mt-1">{{ hint }}</div>
  </div>
</template>

<style scoped>
.mp-usage-meter__label {
  font-size: 0.8125rem;
  font-weight: 600;
}

.mp-usage-meter__value {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

.mp-usage-meter--dense .mp-usage-meter__label,
.mp-usage-meter--dense .mp-usage-meter__value {
  font-size: 0.75rem;
}

.mp-usage-meter__hint {
  line-height: 1.4;
}
</style>
