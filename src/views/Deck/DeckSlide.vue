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
      <div v-if="eyebrow" class="mp-eyebrow mb-3">{{ eyebrow }}</div>
      <h2 v-if="title" class="mp-display-lg deck-slide__title" :class="centered ? 'mb-6' : 'mb-10'">
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
  padding: var(--mp-spacing-16) var(--mp-spacing-12) var(--mp-spacing-12);
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
    var(--mp-typography-display-sm-fontSize),
    4.5vw,
    var(--mp-typography-display-lg-fontSize)
  );
}

@media (max-width: 900px) {
  .deck-slide {
    padding: var(--mp-spacing-10) var(--mp-spacing-6);
  }
}
</style>
