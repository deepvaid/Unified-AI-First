<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import SectionHead from './SectionHead.vue'
import { blocksOf, text } from './sectionSettings'

// Brand logos in a row: the `logo-strip` section, from its `logo` blocks. Six sit
// side by side on a desktop and three to a row on a phone, each on a card with a
// hairline, its picture no taller than 40px, linking to the brand's products. The
// brand's name is the picture's text alternative; a logo without a picture shows
// the name instead. `background: 'Tint'` draws the strip on the theme's tint.

const props = defineProps<{ section: ThemeSection }>()

const settings = computed(() => props.section.settings)
const title = computed(() => text(settings.value, 'title'))
const tint = computed(() => text(settings.value, 'background') === 'Tint')
const logos = computed(() => blocksOf(props.section, 'logo')
  .map((block) => ({
    id: block.id,
    name: text(block.settings, 'name'),
    image: text(block.settings, 'image'),
    link: text(block.settings, 'link'),
  }))
  .filter((logo) => logo.name || logo.image))
</script>

<template>
  <section
    v-if="logos.length"
    class="sfs sfl"
    :class="{ 'sfs--tint': tint }"
    :aria-labelledby="title ? `${section.id}-title` : undefined"
    :aria-label="title ? undefined : 'Brands'"
  >
    <SectionHead
      v-if="title || text(settings, 'eyebrow')"
      :title="title"
      :title-id="`${section.id}-title`"
      :eyebrow="text(settings, 'eyebrow')"
    />
    <ul class="sfl__list">
      <li v-for="logo in logos" :key="logo.id" class="sfl__item">
        <component :is="logo.link ? StorefrontAnchor : 'span'" :href="logo.link || undefined" class="sfl__tile">
          <img v-if="logo.image" :src="logo.image" :alt="logo.name" class="sfl__image" loading="lazy">
          <span v-else class="sfl__name">{{ logo.name }}</span>
        </component>
      </li>
    </ul>
  </section>
</template>

<style scoped src="./sections.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sfl__list {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sfl__tile {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 112px;
  padding: 20px 16px;
  border: 1px solid var(--sf-divider, #e5e5e5);
  border-radius: var(--sf-card-radius, var(--sf-radius, 0));
  background: var(--sf-card, var(--sf-bg, #ffffff));
  box-shadow: var(--sf-card-shadow, none);
  color: var(--sf-text, #121011);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

a.sfl__tile:hover {
  border-color: var(--sf-accent, var(--sf-text, #121011));
}

.sfl__image {
  display: block;
  max-width: 100%;
  max-height: 40px;
  object-fit: contain;
}

.sfl__name {
  min-width: 0;
  font-family: var(--sf-heading-font, system-ui), sans-serif;
  font-size: 16px;
  font-weight: var(--sf-heading-weight, 700);
  line-height: 1.3;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
  overflow-wrap: break-word;
}

@media (max-width: 900px) {
  .sfl__list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .sfl__tile {
    height: 88px;
    padding: 12px 8px;
  }

  .sfl__image {
    max-height: 32px;
  }

  .sfl__name {
    font-size: 11px;
    letter-spacing: 0.02em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sfl__tile {
    transition: none;
  }
}
</style>
