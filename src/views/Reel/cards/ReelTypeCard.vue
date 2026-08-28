<script setup lang="ts">
defineProps<{
  lines: { text: string; strong?: boolean }[]
}>()
</script>

<template>
  <div class="type-card">
    <div
      v-for="(line, i) in lines"
      :key="line.text"
      class="type-card__line mp-display-xl"
      :class="{ 'type-card__line--strong': line.strong }"
      :style="{ '--i': i }"
    >
      {{ line.text }}
    </div>
  </div>
</template>

<style scoped>
.type-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-12);
  padding: 6%;
  text-align: center;
}

.type-card__line {
  font-size: clamp(
    var(--mp-display-sm-fontSize),
    7.5vw,
    var(--mp-display-xl-fontSize)
  );
  animation: type-rise 500ms var(--mp-motion-easing-standard) both;
  animation-delay: calc(400ms + var(--i) * 450ms);
}

.type-card__line--strong {
  color: rgb(var(--v-theme-primary));
}

@keyframes type-rise {
  from {
    opacity: 0;
    transform: translateY(0.5em);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .type-card__line {
    animation: none;
  }
}
</style>
