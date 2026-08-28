<script setup lang="ts">
import DvOrbitOrb from '@/components/copilot/voice/DvOrbitOrb.vue'

withDefaults(defineProps<{
  name?: string
  byline?: string
  tag?: string
}>(), {
  name: 'MAROPOST',
  byline: '',
  tag: 'One system. Every screen.',
})
</script>

<template>
  <div class="wordmark">
    <div class="wordmark__orb">
      <DvOrbitOrb :size="96" inverse />
    </div>
    <div class="wordmark__name">{{ name }}</div>
    <div v-if="byline" class="wordmark__byline">{{ byline }}</div>
    <div class="wordmark__tag">{{ tag }}</div>
    <div class="wordmark__url">ai-first-maropost.vercel.app/showcase</div>
  </div>
</template>

<style scoped>
.wordmark {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-16);
  padding: 6%;
  text-align: center;
}

.wordmark__orb {
  animation: wm-pop 400ms var(--mp-motion-easing-standard) both;
}

.wordmark__name {
  font-size: clamp(var(--mp-fontSize-32), 5vw, var(--mp-fontSize-40));
  font-weight: var(--mp-fontWeight-heavy);
  letter-spacing: 0.18em;
  color: rgb(var(--v-theme-on-surface));
  animation: wm-rise 500ms var(--mp-motion-easing-standard) 300ms both;
}

.wordmark__byline {
  margin-top: calc(-1 * var(--mp-space-8));
  font-size: var(--mp-fontSize-12);
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  animation: wm-rise 500ms var(--mp-motion-easing-standard) 500ms both;
}

.wordmark__tag {
  font-size: var(--mp-fontSize-18);
  color: rgb(var(--v-theme-on-surface-variant));
  animation: wm-rise 500ms var(--mp-motion-easing-standard) 650ms both;
}

.wordmark__url {
  margin-top: var(--mp-space-16);
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-primary));
  animation: wm-rise 500ms var(--mp-motion-easing-standard) 1000ms both;
}

@keyframes wm-pop {
  from {
    opacity: 0;
    transform: scale(0.82);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes wm-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wordmark__orb,
  .wordmark__name,
  .wordmark__tag,
  .wordmark__url {
    animation: none;
  }
}
</style>
