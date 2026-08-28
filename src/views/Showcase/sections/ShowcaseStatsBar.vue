<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCountUp, useRevealOnce } from '../reveal'

const rootEl = ref<HTMLElement | null>(null)
const revealed = useRevealOnce(rootEl)

const STATS = [
  { to: 89, label: 'Live components' },
  { to: 84, label: 'Storybook stories' },
  { to: 171, label: 'Product screens' },
  { to: 297, label: 'Design tokens' },
  { to: 2, label: 'Themes, one flip' },
  { to: 1, label: 'Source of truth' },
] as const

const counters = STATS.map(s => useCountUp(s.to))

watch(revealed, isIn => {
  if (!isIn) return
  counters.forEach((c, i) => c.start(i * 120))
})
</script>

<template>
  <section ref="rootEl" class="stats">
    <div class="stats__grid">
      <div v-for="(stat, i) in STATS" :key="stat.label" class="stats__tile">
        <div class="mp-display-sm stats__value">{{ counters[i]!.value.value }}</div>
        <div class="mp-eyebrow mt-1">{{ stat.label }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats {
  border-top: 1px solid var(--mp-border-subtle);
  border-bottom: 1px solid var(--mp-border-subtle);
  background: rgb(var(--v-theme-surface));
  padding: var(--mp-space-40) var(--mp-space-24);
}

.stats__grid {
  max-width: var(--mp-layout-contentMaxWidth);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--mp-space-24);
  text-align: center;
}

.stats__value {
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-on-surface));
}

@media (max-width: 1100px) {
  .stats__grid {
    grid-template-columns: repeat(3, 1fr);
    row-gap: var(--mp-space-32);
  }
}

@media (max-width: 600px) {
  .stats__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
