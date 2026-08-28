<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title?: string
  /** Center body content (title slides, interstitials). */
  centered?: boolean
}>()
</script>

<template>
  <section class="deck-slide">
    <div class="deck-slide__body" :class="{ 'deck-slide__body--centered': centered }">
      <div v-if="eyebrow" class="mp-eyebrow mb-3 cine" :style="{ '--ci': 0 }">{{ eyebrow }}</div>
      <h2
        v-if="title"
        class="mp-display-lg deck-slide__title cine"
        :class="centered ? 'mb-6' : 'mb-10'"
        :style="{ '--ci': 0.5 }"
      >
        {{ title }}
      </h2>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.deck-slide {
  height: 100dvh;
  display: flex;
  overflow-y: auto;
  padding: var(--mp-space-64) var(--mp-space-48) var(--mp-space-48);
}

.deck-slide__body {
  width: 100%;
  max-width: 1200px;
  margin: auto;
}

.deck-slide__body--centered {
  text-align: center;
}

.deck-slide__title {
  font-size: clamp(
    var(--mp-display-sm-fontSize),
    4.5vw,
    var(--mp-display-lg-fontSize)
  );
}

@media (max-width: 900px) {
  .deck-slide {
    padding: var(--mp-space-40) var(--mp-space-24);
  }
}
</style>
