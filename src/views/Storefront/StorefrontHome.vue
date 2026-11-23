<script setup lang="ts">
import { computed, inject, ref, watchEffect } from 'vue'
import type { ThemeBlock, ThemeSection } from '@/stores/themeBuilderData'
import { useCommerceStore } from '@/stores/useCommerce'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontProductCard from './StorefrontProductCard.vue'
import { STOREFRONT } from './storefrontContext'
import { inStock, storefrontProducts } from './storefrontCatalog'
import { BANNER_KINDS, sectionComponent } from './sections'

// The storefront home page: the current theme's home template, section by
// section. The header and footer belong to StorefrontLayout. Featured products
// come from the stand-in catalogue (storefrontCatalog); testimonials and
// newsletter sections aren't drawn. A banner, a collection card and an
// image-with-text section show the photograph named in their `image` setting;
// without one a banner or card keeps its drawn stand-in.
// A theme on the sections drawing (Northfold, Torqline) is drawn section by section
// through the components in ./sections (one per kind); the classic drawing below is
// every other theme's, unchanged.

const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()

function featured(section: ThemeSection) {
  const count = Number(section.settings.productCount) || 4
  return storefrontProducts(commerce.products, storefront.channel.value.id).filter(inStock).slice(0, count)
}

const sections = computed<ThemeSection[]>(() =>
  (storefront.theme.value?.templates.home ?? []).filter((s) => {
    if (s.hidden || s.kind === 'header' || s.kind === 'footer') return false
    // A store that shows its announcement above the header (StorefrontLayout) doesn't repeat it here.
    return !(s.kind === 'announcement-bar' && storefront.chrome.value.announcementAboveHeader)
  }),
)

function text(section: ThemeSection, key: string): string {
  const value = section.settings[key]
  return typeof value === 'string' ? value : ''
}

function blockText(block: ThemeBlock, key: string): string {
  const value = block.settings[key]
  return typeof value === 'string' ? value : ''
}

function blocksOf(section: ThemeSection, kind: string): ThemeBlock[] {
  return (section.blocks ?? []).filter((b) => b.kind === kind)
}

// ── Sections drawing ────────────────────────────────────────────────────
const sectionsDrawing = computed(() => storefront.sectionsDrawing.value)
/** The first banner with a headline names the page; without one, the store's name does, for screen readers. */
const titleSectionId = computed(() => sections.value.find((s) => BANNER_KINDS.includes(s.kind) && text(s, 'headline'))?.id)

// A kind the drawing has no component for draws nothing; a developer hears about it once.
const warned = new Set<string>()
if (import.meta.env.DEV) {
  watchEffect(() => {
    if (!sectionsDrawing.value) return
    for (const section of sections.value) {
      if (sectionComponent(section.kind) || warned.has(section.kind)) continue
      warned.add(section.kind)
      console.warn(`[storefront] The sections drawing has no component for "${section.kind}" sections; add one to src/views/Storefront/sections/index.ts.`)
    }
  })
}

/** Aurora's image-banner heights; its Medium banner measures 400px on Neelam-Store. */
const BANNER_HEIGHT: Record<string, string> = { Small: '280px', Medium: '400px', Large: '560px' }

// ── Featured Collections: a looping carousel ────────────────────────────
// One dot per card; a dot makes its card the first in view and the rest follow
// round the loop — three in view on desktop, one on a phone, as Aurora does.
const firstCard = ref<Record<string, number>>({})

function looped(section: ThemeSection): ThemeBlock[] {
  const cards = blocksOf(section, 'collection')
  const first = firstCard.value[section.id] ?? 0
  return [...cards.slice(first), ...cards.slice(0, first)]
}
</script>

<template>
  <div v-if="sectionsDrawing" class="sf-home sf-home--sections">
    <h1 v-if="!titleSectionId" class="sf-home__title">{{ storefront.chrome.value.wordmark }}</h1>
    <template v-for="section in sections" :key="section.id">
      <component
        :is="sectionComponent(section.kind)"
        v-if="sectionComponent(section.kind)"
        :section="section"
        v-bind="BANNER_KINDS.includes(section.kind) ? { headingLevel: section.id === titleSectionId ? 1 : 2 } : {}"
      />
    </template>
  </div>

  <div v-else class="sf-home">
    <template v-for="section in sections" :key="section.id">
      <section
        v-if="section.kind === 'image-banner'"
        class="sf-banner"
        :style="{ '--sf-banner-height': BANNER_HEIGHT[text(section, 'height')] ?? BANNER_HEIGHT.Medium }"
      >
        <div class="sf-banner__media" :class="{ 'sf-banner__media--photo': text(section, 'image') }" aria-hidden="true">
          <img v-if="text(section, 'image')" :src="text(section, 'image')" alt="">
        </div>
        <div class="sf-banner__content">
          <h1 v-if="text(section, 'headline')" class="sf-banner__headline">{{ text(section, 'headline') }}</h1>
          <p v-if="text(section, 'subheadline')" class="sf-banner__sub">{{ text(section, 'subheadline') }}</p>
          <template v-for="block in blocksOf(section, 'button')" :key="block.id">
            <StorefrontAnchor v-if="blockText(block, 'link')" :href="blockText(block, 'link')" class="sf-banner__button">
              {{ blockText(block, 'label') }}
            </StorefrontAnchor>
            <span v-else class="sf-banner__button">{{ blockText(block, 'label') }}</span>
          </template>
        </div>
      </section>

      <section v-else-if="section.kind === 'collection-grid' && blocksOf(section, 'collection').length" class="sf-collections">
        <h2 v-if="text(section, 'title')" class="sf-heading">{{ text(section, 'title') }}</h2>
        <div class="sf-collections__track" aria-live="polite">
          <StorefrontAnchor
            v-for="block in looped(section)"
            :key="block.id"
            :href="blockText(block, 'link') || '/collections/all'"
            class="sf-collection"
          >
            <img v-if="blockText(block, 'image')" :src="blockText(block, 'image')" alt="" class="sf-collection__photo" loading="lazy">
            <span class="sf-collection__label">{{ blockText(block, 'label') }}</span>
          </StorefrontAnchor>
        </div>
        <div class="sf-dots" role="group" :aria-label="`${text(section, 'title') || 'Collections'} slides`">
          <button
            v-for="(block, index) in blocksOf(section, 'collection')"
            :key="block.id"
            type="button"
            class="sf-dot"
            :class="{ 'sf-dot--active': (firstCard[section.id] ?? 0) === index }"
            :aria-label="`Show ${blockText(block, 'label')}`"
            :aria-current="(firstCard[section.id] ?? 0) === index ? 'true' : undefined"
            @click="firstCard[section.id] = index"
          />
        </div>
      </section>

      <section v-else-if="section.kind === 'rich-text'" class="sf-richtext" :class="{ 'sf-richtext--center': text(section, 'alignment') === 'Center' }">
        <h2 v-if="text(section, 'heading')" class="sf-heading">{{ text(section, 'heading') }}</h2>
        <p v-if="text(section, 'body')">{{ text(section, 'body') }}</p>
      </section>

      <section
        v-else-if="section.kind === 'image-with-text' && text(section, 'image')"
        class="sf-story"
        :class="{ 'sf-story--flip': text(section, 'imageSide') === 'Right' }"
      >
        <img :src="text(section, 'image')" alt="" class="sf-story__photo" loading="lazy">
        <div class="sf-story__copy">
          <h2 v-if="text(section, 'heading')" class="sf-story__heading">{{ text(section, 'heading') }}</h2>
          <p v-if="text(section, 'body')">{{ text(section, 'body') }}</p>
          <StorefrontAnchor v-if="text(section, 'buttonLabel') && text(section, 'buttonLink')" :href="text(section, 'buttonLink')" class="sf-button sf-story__button">
            {{ text(section, 'buttonLabel') }}
          </StorefrontAnchor>
        </div>
      </section>

      <section v-else-if="section.kind === 'hero'" class="sf-banner" :style="{ '--sf-banner-height': BANNER_HEIGHT.Medium }">
        <div class="sf-banner__media" :class="{ 'sf-banner__media--photo': text(section, 'image') }" aria-hidden="true">
          <img v-if="text(section, 'image')" :src="text(section, 'image')" alt="">
        </div>
        <div class="sf-banner__content">
          <h1 v-if="text(section, 'headline')" class="sf-banner__headline">{{ text(section, 'headline') }}</h1>
          <p v-if="text(section, 'subheadline')" class="sf-banner__sub">{{ text(section, 'subheadline') }}</p>
          <span v-if="text(section, 'ctaLabel')" class="sf-banner__button">{{ text(section, 'ctaLabel') }}</span>
        </div>
      </section>

      <section v-else-if="section.kind === 'featured-products'" class="sf-featured">
        <div class="sf-featured__head">
          <h2 class="sf-heading">{{ text(section, 'title') || 'Featured products' }}</h2>
          <StorefrontAnchor href="/collections/all" class="sf-featured__all">View all</StorefrontAnchor>
        </div>
        <div class="sf-featured__grid">
          <StorefrontProductCard v-for="product in featured(section)" :key="product.id" :product="product" />
        </div>
      </section>

      <div v-else-if="section.kind === 'announcement-bar'" class="sf-announcement">{{ storefront.campaignMessage.value || text(section, 'text') }}</div>
    </template>
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Sizes are Aurora's. */
.sf-banner {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--sf-banner-height);
  overflow: hidden;
  color: #ffffff;
}

/* Stands in for the banner photograph (Neelam-Store: a winding mountain road). */
.sf-banner__media {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(100deg, rgba(18, 16, 17, 0.72) 0%, rgba(18, 16, 17, 0.2) 70%),
    linear-gradient(160deg, #3b4a42 0%, #1c2420 55%, #121011 100%);
}

/* A photograph, under a shade strong enough to keep the white headline readable on a pale sky. */
.sf-banner__media--photo {
  background: #121011;
}

.sf-banner__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sf-banner__media--photo::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, rgba(18, 16, 17, 0.66) 0%, rgba(18, 16, 17, 0.38) 55%, rgba(18, 16, 17, 0.18) 100%);
}

.sf-banner__content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.sf-banner__headline {
  max-width: 820px;
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 61px;
  line-height: 1.1;
  font-weight: 700;
}

.sf-banner__sub {
  max-width: 560px;
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
}

.sf-banner__button {
  display: inline-flex;
  align-items: center;
  height: 46px;
  padding: 0 24px;
  border-radius: var(--sf-radius, 6px);
  background: #ffffff;
  color: #121011;
  font-size: 14px;
  font-weight: 500;
}

.sf-heading {
  margin: 0 0 24px;
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 25px;
  font-weight: 700;
}

.sf-collections {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 0;
}

.sf-collections__track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - 2 * 24px) / 3);
  column-gap: 24px;
  overflow: hidden;
}

.sf-collection {
  position: relative;
  display: flex;
  align-items: flex-end;
  aspect-ratio: 4 / 3;
  padding: 20px;
  border-radius: 8px;
  overflow: hidden;
  background:
    linear-gradient(0deg, rgba(18, 16, 17, 0.78) 0%, rgba(18, 16, 17, 0.1) 60%),
    linear-gradient(135deg, #4a4f57 0%, #23262b 100%);
  color: #ffffff;
}

.sf-collection:hover {
  text-decoration: none !important;
}

.sf-collection__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* The same shade the drawn card has, so the label reads on any photograph. */
.sf-collection__photo + .sf-collection__label::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(0deg, rgba(18, 16, 17, 0.78) 0%, rgba(18, 16, 17, 0.1) 60%);
}

.sf-collection__photo + .sf-collection__label {
  z-index: 1;
}

.sf-collection__label {
  font-size: 24px;
  line-height: 1.2;
  font-weight: 700;
}

.sf-dots {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

/* 24px target, 8px mark (WCAG 2.5.8 — W-12): the button is the hit area and the
   dot is drawn inside it, so adjacent targets never overlap. */
.sf-dot {
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

.sf-dot::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b6b6b6;
}

.sf-dot--active::before {
  background: var(--sf-text, #121011);
}

.sf-story {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 48px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 72px 24px 0;
}

.sf-story__photo {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--sf-radius, 8px);
  object-fit: cover;
}

.sf-story--flip .sf-story__photo {
  order: 2;
}

.sf-story__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  font-size: 17px;
  line-height: 1.6;
}

.sf-story__copy p {
  margin: 0;
}

.sf-story__heading {
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 36px;
  line-height: 1.15;
  font-weight: 700;
}

.sf-story__button:hover {
  text-decoration: none !important;
}

.sf-richtext {
  max-width: 820px;
  margin: 0 auto;
  padding: 48px 24px 0;
}

.sf-richtext--center {
  text-align: center;
}

.sf-featured {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 0;
}

.sf-featured__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.sf-featured__all {
  font-size: 14px;
  text-decoration: underline !important;
}

.sf-featured__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 32px 24px;
}

.sf-announcement {
  padding: 8px 24px;
  background: var(--sf-brand, #373842);
  color: var(--sf-bg, #ffffff);
  text-align: center;
  font-size: 14px;
}

/* The page's name for screen readers, when no banner gives it a headline. */
.sf-home__title {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 900px) {
  .sf-banner__headline {
    font-size: 36px;
  }

  .sf-collections__track {
    grid-auto-columns: 100%;
  }

  .sf-story {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    padding-top: 48px;
  }

  .sf-story--flip .sf-story__photo {
    order: 0;
  }

  .sf-story__heading {
    font-size: 26px;
  }

  .sf-featured__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 16px;
  }
}
</style>
