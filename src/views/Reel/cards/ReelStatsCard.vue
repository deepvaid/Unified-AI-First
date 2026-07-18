<script setup lang="ts">
import { onMounted } from 'vue'
import { useCountUp } from '@/views/Showcase/reveal'

const STATS = [
  { to: 89, label: 'Live components' },
  { to: 84, label: 'Storybook stories' },
  { to: 171, label: 'Product screens' },
  { to: 297, label: 'Design tokens' },
  { to: 2, label: 'Themes, one flip' },
  { to: 1, label: 'Source of truth' },
] as const

const counters = STATS.map(s => useCountUp(s.to, 1100))

onMounted(() => {
  counters.forEach((c, i) => c.start(300 + i * 150))
})
</script>

<template>
  <div class="stat-card">
    <div class="stat-card__grid">
      <div v-for="(stat, i) in STATS" :key="stat.label" class="stat-card__tile">
        <div class="stat-card__value mp-display-lg">{{ counters[i]!.value.value }}</div>
        <div class="mp-eyebrow stat-card__label" :style="{ '--i': i }">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6%;
}

.stat-card__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: var(--mp-spacing-10) var(--mp-spacing-12);
  text-align: center;
}

.stat-card__value {
  font-variant-numeric: tabular-nums;
  font-size: clamp(
    var(--mp-typography-display-sm-fontSize),
    5.5vw,
    var(--mp-typography-display-lg-fontSize)
  );
}

.stat-card__label {
  margin-top: var(--mp-spacing-2);
  animation: stat-label-in 400ms var(--mp-motion-easing-standard) both;
  animation-delay: calc(700ms + var(--i) * 150ms);
}

@keyframes stat-label-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stat-card__label {
    animation: none;
  }
}
</style>
