<script setup lang="ts">
import { computed, ref } from 'vue'
import { accentParts } from '@/storefront/themeSections'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import SectionHead from './SectionHead.vue'
import { blocksOf, num, text } from './sectionSettings'

// Category tiles: the `collection` blocks of a `collection-grid` section, each a
// photograph over the collection's name, linking to it. The section sets the
// columns (2 to 4; 2 on a phone) and the tiles' shape (Portrait 3:4, Square,
// Landscape 4:3). A tile without a photo is a quiet panel with its name.
//
// `layout: 'Carousel'` draws the tiles as a looping row with one dot per tile, as
// the classic drawing's Featured Collections does (StorefrontHome.vue): the columns
// are the tiles in view (two on a tablet, one on a phone), a dot makes its tile the
// first in view and the rest follow round the loop, and a swipe moves one tile. Its
// tiles are landscape unless the section names a shape. `tileStyle: 'Label over
// photo'` puts the name on the photo, white over a shade; `background: 'Tint'`
// draws the section on the theme's tint; the title and each tile's name may give
// words to the accent colour (`accentWords`, a tile's `accent`).

const props = defineProps<{ section: ThemeSection }>()

const settings = computed(() => props.section.settings)
const title = computed(() => text(settings.value, 'title'))
const columns = computed(() => Math.min(4, Math.max(2, num(settings.value, 'columns', 3))))
const carousel = computed(() => text(settings.value, 'layout') === 'Carousel')
const ratio = computed(() => ({ Portrait: '3 / 4', Square: '1 / 1', Landscape: '4 / 3' } as Record<string, string>)[text(settings.value, 'tileRatio')]
  ?? (carousel.value ? '4 / 3' : '3 / 4'))
const over = computed(() => text(settings.value, 'tileStyle') === 'Label over photo')
const tint = computed(() => text(settings.value, 'background') === 'Tint')
const tiles = computed(() => blocksOf(props.section, 'collection').map((block) => {
  const label = text(block.settings, 'label', 'Collection')
  return {
    id: block.id,
    label,
    parts: accentParts(label, text(block.settings, 'accent')),
    link: text(block.settings, 'link', '/collections/all'),
    image: text(block.settings, 'image'),
  }
}))

// ── The carousel: a looping row ──────────────────────────────────────────
const first = ref(0)
/** The tiles from the one in front, round the loop. */
const looped = computed(() => {
  const start = first.value % Math.max(1, tiles.value.length)
  return [...tiles.value.slice(start), ...tiles.value.slice(0, start)]
})
const shown = computed(() => (carousel.value ? looped.value : tiles.value))

function show(index: number): void {
  const count = tiles.value.length
  first.value = ((index % count) + count) % count
}

// A swipe on a touch screen moves the loop one tile; the tap that ends it opens nothing.
let touchX: number | null = null
let swiped = false
function onTouchStart(event: TouchEvent): void {
  touchX = event.touches[0]?.clientX ?? null
  swiped = false
}
function onTouchEnd(event: TouchEvent): void {
  const endX = event.changedTouches[0]?.clientX
  if (touchX === null || endX === undefined) return
  const distance = endX - touchX
  touchX = null
  if (Math.abs(distance) < 40) return
  swiped = true
  show(first.value + (distance < 0 ? 1 : -1))
}
function onClickCapture(event: MouseEvent): void {
  if (!swiped) return
  swiped = false
  event.preventDefault()
  event.stopPropagation()
}
</script>

<template>
  <section
    v-if="tiles.length"
    class="sfs sfc"
    :class="[{ 'sfs--tint': tint, 'sfc--over': over, 'sfc--carousel': carousel }, carousel ? `sfc--view-${columns}` : '']"
    :aria-labelledby="title ? `${section.id}-title` : undefined"
  >
    <SectionHead v-if="title" :title="title" :title-id="`${section.id}-title`" :accent-words="text(settings, 'accentWords')" />
    <ul
      class="sfc__grid"
      :style="{ '--sfc-columns': columns, '--sfc-ratio': ratio }"
      :aria-live="carousel ? 'polite' : undefined"
      @touchstart.passive="carousel ? onTouchStart($event) : undefined"
      @touchend="carousel ? onTouchEnd($event) : undefined"
      @click.capture="onClickCapture"
    >
      <li v-for="tile in shown" :key="tile.id" class="sfc__item">
        <StorefrontAnchor :href="tile.link" class="sfc__tile">
          <span class="sfc__media" aria-hidden="true">
            <img v-if="tile.image" :src="tile.image" alt="" loading="lazy">
          </span>
          <span class="sfc__label">
            <span class="sfc__name"><template v-for="(part, index) in tile.parts" :key="index"><span v-if="part.accent" class="sfc__accent">{{ part.text }}</span><template v-else>{{ part.text }}</template></template></span>
            <v-icon size="20" class="sfc__arrow" aria-hidden="true">arrow-right</v-icon>
          </span>
        </StorefrontAnchor>
      </li>
    </ul>
    <!-- One dot per tile: it brings that tile to the front. 24px targets around an 8px mark (WCAG 2.5.8). -->
    <div v-if="carousel && tiles.length > 1" class="sfc__dots" role="group" :aria-label="`${title || 'Collections'}: choose the tile shown first`">
      <button
        v-for="(tile, index) in tiles"
        :key="tile.id"
        type="button"
        class="sfc__dot"
        :class="{ 'sfc__dot--active': first === index }"
        :aria-label="`Show ${tile.label}`"
        :aria-current="first === index ? 'true' : undefined"
        @click="show(index)"
      />
    </div>
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

.sfc__accent {
  color: var(--sf-accent, currentColor);
}

.sfc__arrow {
  flex-shrink: 0;
  transition: transform 200ms ease-out;
}

.sfc__tile:hover .sfc__arrow {
  transform: translateX(4px);
}

/* ── The name on the photo: white, over a shade that rises from the foot ── */
.sfc--over .sfc__tile {
  position: relative;
  overflow: hidden;
  /* A theme's tile corners and shadow (tileRadius / tileShadow), else its card's. */
  border-radius: var(--sf-tile-radius, var(--sf-card-radius, var(--sf-radius, 0)));
  box-shadow: var(--sf-tile-shadow, var(--sf-card-shadow, none));
  isolation: isolate;
}

.sfc--over .sfc__media {
  border-radius: 0;
}

.sfc--over .sfc__media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(12, 12, 14, 0.8) 0%, rgba(12, 12, 14, 0.55) 35%, rgba(12, 12, 14, 0) 66%);
}

.sfc--over .sfc__label {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  align-items: flex-end;
  justify-content: space-between;
  padding: 24px;
  color: #ffffff;
  font-size: 24px;
  line-height: 1.25;
  text-transform: none;
}

/* Accent words on the shade: a lighter mix of the accent, so the 24px name (large text) keeps
   3:1 where the shade is thinnest. At 900px and narrower the name is 20px, which needs 4.5:1:
   a lighter mix still (below). */
.sfc--over .sfc__accent {
  color: color-mix(in srgb, var(--sf-accent, #ffffff) 40%, #ffffff);
}

.sfc--over .sfc__arrow {
  margin-bottom: 4px;
}

.sfc--over .sfc__tile:focus-visible {
  outline-offset: 3px;
}

/* ── The carousel: the columns in view, the rest round the loop ─────────── */
.sfc--carousel .sfc__grid {
  grid-template-columns: none;
  grid-auto-columns: calc((100% - (var(--sfc-columns, 3) - 1) * 20px) / var(--sfc-columns, 3));
  grid-auto-flow: column;
  column-gap: 20px;
  overflow: hidden;
  touch-action: pan-y;
}

/* A focused tile's ring needs room inside the row's clip. */
.sfc--carousel .sfc__grid {
  margin: -6px;
  padding: 6px;
}

/* Tiles past the view are out of sight, so out of the tab order and the reading too. */
.sfc--view-2 .sfc__item:nth-child(n + 3),
.sfc--view-3 .sfc__item:nth-child(n + 4),
.sfc--view-4 .sfc__item:nth-child(n + 5) {
  visibility: hidden;
}

.sfc__dots {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.sfc__dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

/* The mark: a dot at 3:1 on the page or the tint (WCAG 1.4.11); the current tile's is a longer accent pill. */
.sfc__dot::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--sf-text, #121011) 55%, transparent);
  transition: width 200ms ease-out;
}

.sfc__dot--active::before {
  width: 20px;
  background: var(--sf-accent, var(--sf-text, #121011));
}

.sfc__dot:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 0;
  border-radius: 999px;
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

  .sfc--over .sfc__label {
    padding: 18px;
    font-size: 20px;
  }

  /* 20px at the theme's heading weight is not large text, so the accent words keep 4.5:1 on the shade. */
  .sfc--over .sfc__accent {
    color: color-mix(in srgb, var(--sf-accent, #ffffff) 25%, #ffffff);
  }

  /* Two in view on a tablet. */
  .sfc--carousel .sfc__grid {
    grid-template-columns: none;
    grid-auto-columns: calc((100% - 12px) / 2);
    column-gap: 12px;
  }

  .sfc--carousel .sfc__item:nth-child(n + 3) {
    visibility: hidden;
  }
}

/* One in view on a phone. */
@media (max-width: 600px) {
  .sfc--carousel .sfc__grid {
    grid-auto-columns: 100%;
  }

  .sfc--carousel .sfc__item:nth-child(n + 2) {
    visibility: hidden;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sfc__media img,
  .sfc__arrow,
  .sfc__dot::before {
    transition: none;
  }
}
</style>
