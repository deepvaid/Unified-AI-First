<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import SectionHead from './SectionHead.vue'
import { blocksOf, text } from './sectionSettings'

// A row of short promises, each an icon over a title and a line: the `icon-row`
// section (a trust strip), from its `feature` blocks. A feature with a link makes
// its title the link. Up to four sit side by side; on a phone they stack.
//
// Its head may have a line above the heading in the accent colour (`eyebrow`) and
// one under it (`subtitle`), on the left or centred (`alignment`). `tileStyle:
// 'Card'` puts each promise on its own card, its icon in the accent colour in a
// tinted circle (Lumos); the plain row sits between two hairlines.

const props = defineProps<{ section: ThemeSection }>()

const settings = computed(() => props.section.settings)
const title = computed(() => text(settings.value, 'title'))
const eyebrow = computed(() => text(settings.value, 'eyebrow'))
const subtitle = computed(() => text(settings.value, 'subtitle'))
const alignment = computed(() => text(settings.value, 'alignment'))
const cards = computed(() => text(settings.value, 'tileStyle') === 'Card')
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
  <section
    v-if="features.length"
    class="sfs sfi"
    :class="{ 'sfi--cards': cards, 'sfi--left': alignment === 'Left', 'sfi--center': alignment === 'Center' }"
    :aria-labelledby="title ? `${section.id}-title` : undefined"
  >
    <SectionHead
      v-if="title || eyebrow || subtitle"
      :title="title"
      :title-id="`${section.id}-title`"
      :eyebrow="eyebrow"
      :subtitle="subtitle"
      :alignment="alignment"
    />
    <ul class="sfi__list" :style="{ '--sfi-columns': Math.min(4, features.length) }">
      <li v-for="feature in features" :key="feature.id" class="sfi__item">
        <span v-if="cards" class="sfi__chip" aria-hidden="true">
          <v-icon size="26" class="sfi__icon">{{ feature.icon }}</v-icon>
        </span>
        <v-icon v-else size="28" class="sfi__icon" aria-hidden="true">{{ feature.icon }}</v-icon>
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

/* Aligned to the left: each promise reads from its icon's edge. */
.sfi--left .sfi__item {
  align-items: flex-start;
  text-align: left;
}

/* ── Cards: each promise on a card, its icon in a tinted circle ─────────── */
.sfi--cards .sfi__list {
  gap: 20px;
  border-block: 0;
}

.sfi--cards .sfi__item {
  gap: 20px;
  padding: 36px 24px;
  border: 1px solid var(--sf-divider, #e5e5e5);
  border-radius: var(--sf-card-radius, var(--sf-radius, 0));
  background: var(--sf-card, var(--sf-bg, #ffffff));
  color: var(--sf-text, #121011);
}

.sfi--cards .sfi__item + .sfi__item {
  border-left: 1px solid var(--sf-divider, #e5e5e5);
}

.sfi__chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: var(--sf-tint, var(--sf-surface, #f4f4f4));
}

.sfi__chip .sfi__icon {
  color: var(--sf-accent, var(--sf-text, #121011));
}

.sfi--cards .sfi__copy {
  gap: 8px;
}

.sfi--cards .sfi__title {
  font-size: 18px;
  line-height: 26px;
}

.sfi--cards .sfi__text {
  font-size: 14px;
  line-height: 21px;
}

@media (max-width: 900px) {
  .sfi__list {
    grid-template-columns: minmax(0, 1fr);
  }

  /* Cards: two to a row on a tablet, one on a phone, each still a card. */
  .sfi--cards .sfi__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .sfi--cards .sfi__item,
  .sfi--cards .sfi__item + .sfi__item {
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 28px 20px;
    border: 1px solid var(--sf-divider, #e5e5e5);
    text-align: center;
  }

  .sfi--cards.sfi--left .sfi__item {
    align-items: flex-start;
    text-align: left;
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

  .sfi__chip .sfi__icon {
    margin-top: 0;
  }
}

/* A phone: one card to a row, its icon beside the words, so four promises stay short. */
@media (max-width: 600px) {
  .sfi--cards .sfi__list {
    grid-template-columns: minmax(0, 1fr);
  }

  .sfi--cards .sfi__item,
  .sfi--cards .sfi__item + .sfi__item,
  .sfi--cards.sfi--left .sfi__item {
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    text-align: left;
  }

  .sfi--cards .sfi__chip {
    width: 48px;
    height: 48px;
  }

  .sfi--cards .sfi__copy {
    gap: 4px;
  }

  .sfi--cards .sfi__title {
    font-size: 17px;
    line-height: 24px;
  }
}
</style>
