<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { ThemeBlock, ThemeSection } from '@/stores/themeBuilderData'
import StorefrontAnchor from './StorefrontAnchor.vue'
import { STOREFRONT } from './storefrontContext'

// The storefront home page: the current theme's home template, section by
// section. The header and footer belong to StorefrontLayout. Section kinds that
// need products (featured products, testimonials) aren't drawn until the store's
// catalogue is crawled.

const storefront = inject(STOREFRONT)!

const sections = computed<ThemeSection[]>(() =>
  (storefront.theme.value?.templates.home ?? []).filter((s) => !s.hidden && s.kind !== 'header' && s.kind !== 'footer'),
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
  <div class="sf-home">
    <template v-for="section in sections" :key="section.id">
      <section
        v-if="section.kind === 'image-banner'"
        class="sf-banner"
        :style="{ '--sf-banner-height': BANNER_HEIGHT[text(section, 'height')] ?? BANNER_HEIGHT.Medium }"
      >
        <div class="sf-banner__media" aria-hidden="true" />
        <div class="sf-banner__content">
          <h1 v-if="text(section, 'headline')" class="sf-banner__headline">{{ text(section, 'headline') }}</h1>
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

      <section v-else-if="section.kind === 'hero'" class="sf-banner" :style="{ '--sf-banner-height': BANNER_HEIGHT.Medium }">
        <div class="sf-banner__media" aria-hidden="true" />
        <div class="sf-banner__content">
          <h1 v-if="text(section, 'headline')" class="sf-banner__headline">{{ text(section, 'headline') }}</h1>
          <p v-if="text(section, 'subheadline')" class="sf-banner__sub">{{ text(section, 'subheadline') }}</p>
          <span v-if="text(section, 'ctaLabel')" class="sf-banner__button">{{ text(section, 'ctaLabel') }}</span>
        </div>
      </section>

      <div v-else-if="section.kind === 'announcement-bar'" class="sf-announcement">{{ text(section, 'text') }}</div>
    </template>
  </div>
</template>

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
  margin: 0;
  font-size: 18px;
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

.sf-collection__label {
  font-size: 24px;
  line-height: 1.2;
  font-weight: 700;
}

.sf-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.sf-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #b6b6b6;
  cursor: pointer;
}

.sf-dot--active {
  background: var(--sf-text, #121011);
}

.sf-richtext {
  max-width: 820px;
  margin: 0 auto;
  padding: 48px 24px 0;
}

.sf-richtext--center {
  text-align: center;
}

.sf-announcement {
  padding: 8px 24px;
  background: var(--sf-brand, #373842);
  color: var(--sf-bg, #ffffff);
  text-align: center;
  font-size: 14px;
}

@media (max-width: 900px) {
  .sf-banner__headline {
    font-size: 36px;
  }

  .sf-collections__track {
    grid-auto-columns: 100%;
  }
}
</style>
