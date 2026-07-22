<script setup lang="ts">
import { computed, inject, unref } from 'vue'
import { activeChartTheme, CHART_PALETTE_OVERRIDE, type ChartTheme } from '@/plugins/chartPalette'

withDefaults(defineProps<{
  stat: string
  headline: string
  body?: string
}>(), {
  body: '',
})

const override = inject(CHART_PALETTE_OVERRIDE, undefined)
const theme = computed<ChartTheme>(() => unref(override) ?? activeChartTheme.value)

// Full-bleed gradient built from the theme's colour axis (deep → bright).
const gradient = computed(() => {
  const axis = theme.value.axis
  const mid = axis[Math.floor(axis.length / 2)]
  const last = axis[axis.length - 1]
  return `linear-gradient(135deg, ${axis[0]}, ${mid}, ${last})`
})
</script>

<template>
  <div class="insight-card" :style="{ background: gradient }">
    <div class="insight-card__overlay" aria-hidden="true" />
    <div class="insight-card__inner">
      <span class="insight-card__chip">
        <v-icon size="12">sparkles</v-icon>
        Da Vinci insight
      </span>
      <div class="insight-card__stat">{{ stat }}</div>
      <div class="insight-card__headline">{{ headline }}</div>
      <p v-if="body" class="insight-card__body">{{ body }}</p>
    </div>
  </div>
</template>

<style scoped>
.insight-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  padding: 24px;
  min-height: 200px;
  color: #fff;
}

.insight-card__overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 60%);
  pointer-events: none;
}

.insight-card__inner {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.insight-card__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(4px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.insight-card__chip :deep(.v-icon) {
  color: #fff;
}

.insight-card__stat {
  margin-top: 16px;
  font-size: 40px;
  font-weight: 800;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}

.insight-card__headline {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.3;
}

.insight-card__body {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
}
</style>
