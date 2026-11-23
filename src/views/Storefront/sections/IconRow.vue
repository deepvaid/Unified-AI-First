<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import { blocksOf, text } from './sectionSettings'

// A row of short promises, each an icon over a title and a line: the `icon-row`
// section (a trust strip), from its `feature` blocks. A feature with a link makes
// its title the link. Up to four sit side by side; on a phone they stack.

const props = defineProps<{ section: ThemeSection }>()

const title = computed(() => text(props.section.settings, 'title'))
const features = computed(() => blocksOf(props.section, 'feature')
  .map((block) => ({
    id: block.id,
    icon: text(block.settings, 'icon', 'badge-check'),
    title: text(block.settings, 'title'),
    text: text(block.settings, 'text'),
    link: text(block.settings, 'link'),
  }))
  .filter((feature) => feature.title || feature.text))
</script>

<template>
  <section v-if="features.length" class="sfs sfi">
    <div v-if="title" class="sfs__head">
      <h2 class="sfs__title">{{ title }}</h2>
    </div>
    <ul class="sfi__list" :style="{ '--sfi-columns': Math.min(4, features.length) }">
      <li v-for="feature in features" :key="feature.id" class="sfi__item">
        <v-icon size="28" class="sfi__icon" aria-hidden="true">{{ feature.icon }}</v-icon>
        <div class="sfi__copy">
          <!-- Under the row's own heading the titles are its subheadings; without one they are plain lines. -->
          <component :is="title ? 'h3' : 'p'" class="sfi__title">
            <StorefrontAnchor v-if="feature.link" :href="feature.link" class="sfi__link">
              {{ feature.title }}
              <v-icon size="16" aria-hidden="true">arrow-right</v-icon>
            </StorefrontAnchor>
            <template v-else>{{ feature.title }}</template>
          </component>
          <p v-if="feature.text" class="sfi__text">{{ feature.text }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped src="./sections.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sfi__list {
  display: grid;
  grid-template-columns: repeat(var(--sfi-columns, 3), minmax(0, 1fr));
  margin: 0;
  padding: 0;
  border-block: 1px solid var(--sf-divider, #e5e5e5);
  list-style: none;
}

.sfi__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 32px;
  text-align: center;
}

.sfi__item + .sfi__item {
  border-left: 1px solid var(--sf-divider, #e5e5e5);
}

.sfi__icon {
  color: var(--sf-text, #121011);
}

.sfi__copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sfi__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 24px;
}

.sfi__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  text-decoration: underline !important;
  text-underline-offset: 4px;
}

.sfi__text {
  max-width: 30ch;
  margin: 0;
  color: var(--sf-muted, #5f5f5f);
  font-size: 15px;
  line-height: 22px;
}

@media (max-width: 900px) {
  .sfi__list {
    grid-template-columns: minmax(0, 1fr);
  }

  .sfi__item {
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
    padding: 24px 0;
    text-align: left;
  }

  .sfi__item + .sfi__item {
    border-left: 0;
    border-top: 1px solid var(--sf-divider, #e5e5e5);
  }

  .sfi__icon {
    flex-shrink: 0;
    margin-top: -2px;
  }
}
</style>
