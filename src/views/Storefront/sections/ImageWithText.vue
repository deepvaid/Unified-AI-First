<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import { text } from './sectionSettings'

// A photograph beside a short story and one button: the `image-with-text` section.
// The photo goes on the left or the right (on a phone it always leads). Without a
// photo the story stands alone, centred, so the section never leaves a hole.

const props = defineProps<{ section: ThemeSection }>()

const settings = computed(() => props.section.settings)
const image = computed(() => text(settings.value, 'image'))
const heading = computed(() => text(settings.value, 'heading'))
const body = computed(() => text(settings.value, 'body'))
const buttonLabel = computed(() => text(settings.value, 'buttonLabel'))
const buttonLink = computed(() => text(settings.value, 'buttonLink'))
const flip = computed(() => text(settings.value, 'imageSide') === 'Right')
</script>

<template>
  <section v-if="heading || body || image" class="sfs sfw" :class="{ 'sfw--flip': flip, 'sfw--text-only': !image }">
    <div v-if="image" class="sfw__media">
      <img :src="image" alt="" loading="lazy">
    </div>
    <div class="sfw__copy">
      <h2 v-if="heading" class="sfs__title sfw__heading">{{ heading }}</h2>
      <p v-if="body" class="sfw__body">{{ body }}</p>
      <StorefrontAnchor v-if="buttonLabel && buttonLink" :href="buttonLink" class="sf-button sfw__button">
        {{ buttonLabel }}
      </StorefrontAnchor>
    </div>
  </section>
</template>

<style scoped src="../storefront-controls.css"></style>
<style scoped src="./sections.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sfw {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  align-items: center;
  gap: 80px;
}

.sfw--flip {
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
}

.sfw--flip .sfw__media {
  order: 2;
}

.sfw--text-only {
  grid-template-columns: minmax(0, 1fr);
  max-width: 820px;
  text-align: center;
}

.sfw__media {
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: var(--sf-radius, 0);
  background: var(--sf-surface, #f1f1f1);
}

.sfw__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sfw__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  max-width: 460px;
}

.sfw--text-only .sfw__copy {
  align-items: center;
  max-width: none;
}

.sfw__body {
  margin: 0;
  font-size: 18px;
  line-height: 1.65;
}

.sfw__button {
  margin-top: 8px;
}

.sfw__button:hover {
  background: transparent;
  color: var(--sf-button-bg, var(--sf-text, #121011)) !important;
}

@media (max-width: 900px) {
  .sfw,
  .sfw--flip {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
  }

  .sfw--flip .sfw__media {
    order: 0;
  }

  .sfw__copy {
    gap: 18px;
  }

  .sfw__body {
    font-size: 16px;
  }
}
</style>
