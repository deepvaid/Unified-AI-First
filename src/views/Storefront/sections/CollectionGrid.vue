<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import { blocksOf, num, text } from './sectionSettings'

// Category tiles: the `collection` blocks of a `collection-grid` section, each a
// photograph over the collection's name, linking to it. The section sets the
// columns (2 to 4; 2 on a phone) and the tiles' shape (Portrait 3:4, Square,
// Landscape 4:3). A tile without a photo is a quiet panel with its name.

const props = defineProps<{ section: ThemeSection }>()

const title = computed(() => text(props.section.settings, 'title'))
const columns = computed(() => Math.min(4, Math.max(2, num(props.section.settings, 'columns', 3))))
const ratio = computed(() => ({ Square: '1 / 1', Landscape: '4 / 3' } as Record<string, string>)[text(props.section.settings, 'tileRatio')] ?? '3 / 4')
const tiles = computed(() => blocksOf(props.section, 'collection').map((block) => ({
  id: block.id,
  label: text(block.settings, 'label', 'Collection'),
  link: text(block.settings, 'link', '/collections/all'),
  image: text(block.settings, 'image'),
})))
</script>

<template>
  <section v-if="tiles.length" class="sfs sfc">
    <div v-if="title" class="sfs__head">
      <h2 class="sfs__title">{{ title }}</h2>
    </div>
    <ul class="sfc__grid" :style="{ '--sfc-columns': columns, '--sfc-ratio': ratio }">
      <li v-for="tile in tiles" :key="tile.id">
        <StorefrontAnchor :href="tile.link" class="sfc__tile">
          <span class="sfc__media" aria-hidden="true">
            <img v-if="tile.image" :src="tile.image" alt="" loading="lazy">
          </span>
          <span class="sfc__label">
            {{ tile.label }}
            <v-icon size="20" class="sfc__arrow" aria-hidden="true">arrow-right</v-icon>
          </span>
        </StorefrontAnchor>
      </li>
    </ul>
  </section>
</template>

<style scoped src="./sections.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sfc__grid {
  display: grid;
  grid-template-columns: repeat(var(--sfc-columns, 3), minmax(0, 1fr));
  gap: 32px 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sfc__tile {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sfc__media {
  display: block;
  aspect-ratio: var(--sfc-ratio, 3 / 4);
  overflow: hidden;
  border-radius: var(--sf-radius, 0);
  background: var(--sf-surface, #f1f1f1);
}

.sfc__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.sfc__tile:hover .sfc__media img,
.sfc__tile:focus-visible .sfc__media img {
  transform: scale(1.035);
}

.sfc__label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 26px;
  font-weight: var(--sf-heading-weight, 700);
  line-height: 1.15;
  text-transform: var(--sf-heading-case, none);
}

.sfc__arrow {
  transition: transform 200ms ease-out;
}

.sfc__tile:hover .sfc__arrow {
  transform: translateX(4px);
}

@media (max-width: 900px) {
  .sfc__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 12px;
  }

  .sfc__tile {
    gap: 10px;
  }

  .sfc__label {
    font-size: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sfc__media img,
  .sfc__arrow {
    transition: none;
  }
}
</style>
