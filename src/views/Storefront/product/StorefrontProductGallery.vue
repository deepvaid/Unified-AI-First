<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { galleryAlt } from '@/storefront/productPage'

// The product's photos on a product page of the sections drawing. The page gives it
// the photos of the chosen colour (src/storefront/productPage.ts `galleryFor`), so
// the gallery follows the colour and starts again at the first photo.
//
// Desktop, `Stacked` (Northfold): the photos large, one under the other; every photo
//   is already in view as the page scrolls, so there are no thumbnails.
// Desktop, `Thumbnails`: one large photo and a row of thumbnails that switch it.
// Phone and tablet (900px and narrower), either layout: a swipe carousel that snaps
//   photo by photo, with the next one peeking in and a "1 / 2" count. The carousel
//   takes focus, and the arrow keys move it a photo at a time.
//
// The thumbnails are buttons named "Show picture 2 of 4", the current one marked
// with aria-current. Each photo's alt text names the colour that photo shows
// (`colors`), never the gallery's colour for a photo of another. A photo that fails
// to load is replaced by a drawn shirt.

const props = withDefaults(defineProps<{
  /** The photos, in order. */
  images: string[]
  /** The product's name, for the alt text. */
  name: string
  /** The colour the gallery is of, for its label ("Pictures of Linen Overshirt in Sand"). */
  color?: string
  /** The colour each photo shows, by index, for its alt text ("Linen Overshirt in Sand"); '' names none. */
  colors?: string[]
  /** A line under the photos: "Shown in Ivory". */
  note?: string
  layout?: 'Stacked' | 'Thumbnails'
  ratio?: 'Portrait' | 'Square' | 'Landscape'
}>(), {
  color: '',
  colors: () => [],
  note: '',
  layout: 'Stacked',
  ratio: 'Portrait',
})

const RATIOS = { Portrait: '3 / 4', Square: '1 / 1', Landscape: '4 / 3' } as const

const count = computed(() => props.images.length)
const current = ref(0)
const failed = ref<Set<string>>(new Set())
const alt = (index: number) => galleryAlt(props.name, props.colors[index] ?? '', index, count.value)
const label = computed(() => `Pictures of ${props.color ? `${props.name} in ${props.color}` : props.name}`)

// ── Narrow screens: the carousel ─────────────────────────────────────────────
const NARROW = '(max-width: 900px)'
const narrow = ref(false)
let query: MediaQueryList | undefined
const onMedia = () => { narrow.value = !!query?.matches }

const track = ref<HTMLElement | null>(null)
/** The slides by index (a ref array inside v-for does not keep the order). */
const slides = ref<HTMLElement[]>([])
function setSlide(el: unknown, index: number): void {
  if (el instanceof HTMLElement) slides.value[index] = el
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** On the carousel: the photo whose left edge is nearest the track's. */
function onScroll(): void {
  const el = track.value
  if (!narrow.value || !el) return
  const start = el.getBoundingClientRect().left + Number.parseFloat(getComputedStyle(el).scrollPaddingLeft || '0')
  let best = 0
  let distance = Number.POSITIVE_INFINITY
  slides.value.forEach((slide, index) => {
    const d = Math.abs(slide.getBoundingClientRect().left - start)
    if (d < distance) {
      distance = d
      best = index
    }
  })
  current.value = best
}

function scrollCarouselTo(index: number): void {
  const el = track.value
  const slide = slides.value[index]
  if (!el || !slide) return
  const padding = Number.parseFloat(getComputedStyle(el).scrollPaddingLeft || '0')
  el.scrollTo({ left: slide.offsetLeft - padding, behavior: reducedMotion() ? 'auto' : 'smooth' })
}

/** Arrow keys on the focused carousel move it a whole photo, as a swipe does. */
function onTrackKeydown(event: KeyboardEvent): void {
  if (!narrow.value || count.value < 2) return
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!step && event.key !== 'Home' && event.key !== 'End') return
  event.preventDefault()
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? count.value - 1 : Math.min(count.value - 1, Math.max(0, current.value + step))
  current.value = next
  scrollCarouselTo(next)
}

// ── Desktop, `Thumbnails`: the row under the photo ──────────────────────────
function show(index: number): void {
  current.value = index
  if (narrow.value) scrollCarouselTo(index)
}

onMounted(() => {
  query = window.matchMedia(NARROW)
  onMedia()
  query.addEventListener('change', onMedia)
})

onBeforeUnmount(() => {
  query?.removeEventListener('change', onMedia)
})

// A new colour: back to its first photo.
watch(() => props.images.join('|'), () => {
  current.value = 0
  slides.value = []
  failed.value = new Set()
  void nextTick(() => track.value?.scrollTo({ left: 0 }))
})

function onError(url: string): void {
  failed.value = new Set([...failed.value, url])
}
</script>

<template>
  <div
    class="sf-gal"
    :class="[`sf-gal--${layout.toLowerCase()}`, { 'sf-gal--single': count < 2 }]"
    :style="{ '--sf-gal-ratio': RATIOS[ratio] }"
  >
    <ul v-if="count > 1 && layout === 'Thumbnails'" class="sf-gal__thumbs" :aria-label="`${label}: thumbnails`">
      <li v-for="(url, index) in images" :key="url">
        <button
          type="button"
          class="sf-gal__thumb"
          :class="{ 'is-current': current === index }"
          :aria-label="`Show picture ${index + 1} of ${count}`"
          :aria-current="current === index ? 'true' : undefined"
          @click="show(index)"
        >
          <img v-if="!failed.has(url)" :src="url" alt="" loading="lazy" @error="onError(url)">
        </button>
      </li>
    </ul>

    <div class="sf-gal__stage">
      <ul
        ref="track"
        class="sf-gal__track"
        :aria-label="label"
        :tabindex="narrow && count > 1 ? 0 : undefined"
        @scroll.passive="onScroll"
        @keydown="onTrackKeydown"
      >
        <li
          v-for="(url, index) in images"
          :key="url"
          :ref="(el) => setSlide(el, index)"
          class="sf-gal__slide"
          :class="{ 'is-current': current === index }"
        >
          <img
            v-if="!failed.has(url)"
            :src="url"
            :alt="alt(index)"
            class="sf-gal__image"
            :loading="index === 0 ? 'eager' : 'lazy'"
            @error="onError(url)"
          >
          <span v-else class="sf-gal__missing" role="img" :aria-label="alt(index)">
            <v-icon size="56" aria-hidden="true">shirt</v-icon>
          </span>
        </li>
        <li v-if="!count" class="sf-gal__slide is-current">
          <span class="sf-gal__missing" role="img" :aria-label="name">
            <v-icon size="56" aria-hidden="true">shirt</v-icon>
          </span>
        </li>
      </ul>
      <p v-if="note" class="sf-gal__note">{{ note }}</p>
      <p v-if="count > 1" class="sf-gal__count" aria-hidden="true">{{ current + 1 }} / {{ count }}</p>
    </div>
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. The store's theme
 * (--sf-*) gives the colours and corners; the photo frame is its surface colour. */
.sf-gal {
  --sf-gal-thumb: 64px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'stage';
  gap: 16px;
  min-width: 0;
}

.sf-gal__stage {
  position: relative;
  grid-area: stage;
  min-width: 0;
}

.sf-gal__track {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-gal__slide {
  position: relative;
  aspect-ratio: var(--sf-gal-ratio, 3 / 4);
  overflow: hidden;
  border-radius: var(--sf-radius, 0);
  background: var(--sf-surface, color-mix(in srgb, var(--sf-text, #121011) 6%, var(--sf-bg, #ffffff)));
}

.sf-gal__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sf-gal__missing {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--sf-muted, #66625c);
}

/* `Thumbnails`: a row under the photo. */
.sf-gal__thumbs {
  grid-area: thumbs;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-gal__thumb {
  display: block;
  box-sizing: border-box;
  width: var(--sf-gal-thumb);
  aspect-ratio: var(--sf-gal-ratio, 3 / 4);
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--sf-radius, 0);
  background: var(--sf-surface, color-mix(in srgb, var(--sf-text, #121011) 6%, var(--sf-bg, #ffffff)));
  overflow: hidden;
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 120ms ease, border-color 120ms ease;
}

.sf-gal__thumb:hover {
  opacity: 1;
}

.sf-gal__thumb.is-current {
  border-color: var(--sf-text, #121011);
  opacity: 1;
}

.sf-gal__thumb:focus-visible,
.sf-gal__track:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}

.sf-gal__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sf-gal__count {
  display: none;
}

/* "Shown in Ivory": on the first photo, so it is seen with the colour that was chosen. */
.sf-gal__note {
  position: absolute;
  top: 12px;
  left: 12px;
  margin: 0;
  padding: 3px 10px;
  border-radius: var(--sf-radius, 999px);
  background: color-mix(in srgb, var(--sf-bg, #ffffff) 90%, transparent);
  color: var(--sf-text, #121011);
  font-size: 13px;
  line-height: 18px;
  pointer-events: none;
}

/* One large photo, the thumbnails in a row under it. */
.sf-gal--thumbnails:not(.sf-gal--single) {
  grid-template-areas:
    'stage'
    'thumbs';
  gap: 12px;
}

.sf-gal--thumbnails .sf-gal__slide:not(.is-current) {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-gal__thumb {
    transition: none;
  }
}

/* Phone and tablet: a swipe carousel, edge to edge, the next photo peeking in. */
@media (max-width: 900px) {
  .sf-gal,
  .sf-gal--thumbnails:not(.sf-gal--single) {
    grid-template-areas: 'stage';
    gap: 0;
  }

  .sf-gal__thumbs {
    display: none;
  }

  .sf-gal__stage {
    margin-inline: calc(-1 * var(--sf-gutter, 24px));
  }

  .sf-gal__track {
    flex-direction: row;
    gap: 8px;
    padding-inline: var(--sf-gutter, 24px);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: var(--sf-gutter, 24px);
    scrollbar-width: none;
  }

  .sf-gal__track::-webkit-scrollbar {
    display: none;
  }

  .sf-gal__track:focus-visible {
    outline-offset: -2px;
  }

  .sf-gal__slide,
  .sf-gal--thumbnails .sf-gal__slide:not(.is-current) {
    display: block;
    flex: 0 0 80%;
    scroll-snap-align: start;
  }

  .sf-gal--single .sf-gal__slide {
    flex-basis: 100%;
  }

  .sf-gal__count {
    position: absolute;
    left: calc(var(--sf-gutter, 24px) + 10px);
    bottom: 10px;
    display: block;
    margin: 0;
    padding: 2px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--sf-bg, #ffffff) 88%, transparent);
    color: var(--sf-text, #121011);
    font-size: 12px;
    line-height: 20px;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }

  .sf-gal__note {
    left: calc(var(--sf-gutter, 24px) + 10px);
  }
}

@media (min-width: 600px) and (max-width: 900px) {
  .sf-gal__slide,
  .sf-gal--thumbnails .sf-gal__slide:not(.is-current) {
    flex-basis: 56%;
  }
}
</style>
