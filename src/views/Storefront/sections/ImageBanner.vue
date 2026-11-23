<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import { blocksOf, num, text } from './sectionSettings'

// A full-width photograph with a headline, a line and buttons: the `image-banner`
// section (its buttons are `button` blocks) and the older `hero` section (one
// button, from ctaLabel and ctaLink). Its height and, for a hero, the text's
// alignment and the shade over the photo come from the section. The words sit at
// the bottom of the photo under a shade that keeps white text readable.

const props = withDefaults(defineProps<{
  section: ThemeSection
  /** The page's first banner names the page (h1); the others are h2. */
  headingLevel?: 1 | 2
}>(), { headingLevel: 2 })

const settings = computed(() => props.section.settings)
const image = computed(() => text(settings.value, 'image'))
const headline = computed(() => text(settings.value, 'headline'))
const subheadline = computed(() => text(settings.value, 'subheadline'))
const centered = computed(() => text(settings.value, 'alignment') === 'Center')
const height = computed(() => {
  const value = text(settings.value, 'height', 'Medium')
  return ['Small', 'Medium', 'Large'].includes(value) ? value.toLowerCase() : 'medium'
})
/** A hero's own shade (0-60%); a banner's is the standard one. */
const shade = computed(() => (props.section.kind === 'hero' ? Math.min(60, Math.max(0, num(settings.value, 'overlay', 15))) : undefined))

const buttons = computed(() => {
  if (props.section.kind === 'hero') {
    const label = text(settings.value, 'ctaLabel')
    return label ? [{ id: `${props.section.id}-cta`, label, link: text(settings.value, 'ctaLink', '/collections/all') }] : []
  }
  return blocksOf(props.section, 'button')
    .map((block) => ({ id: block.id, label: text(block.settings, 'label'), link: text(block.settings, 'link') }))
    .filter((button) => button.label)
})
</script>

<template>
  <section
    class="sfb"
    :class="[`sfb--${height}`, { 'sfb--center': centered, 'sfb--photo': image }]"
    :style="shade !== undefined ? { '--sfb-shade': shade / 100 } : undefined"
  >
    <img v-if="image" :src="image" alt="" class="sfb__photo" fetchpriority="high">
    <div class="sfb__content">
      <component :is="`h${headingLevel}`" v-if="headline" class="sfb__headline">{{ headline }}</component>
      <p v-if="subheadline" class="sfb__sub">{{ subheadline }}</p>
      <div v-if="buttons.length" class="sfb__actions">
        <template v-for="(button, index) in buttons" :key="button.id">
          <StorefrontAnchor v-if="button.link" :href="button.link" class="sfb__button" :class="{ 'sfb__button--quiet': index > 0 }">
            {{ button.label }}
          </StorefrontAnchor>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sfb {
  --sfb-height: 600px;
  --sfb-shade: 0.5;
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: var(--sfb-height);
  overflow: hidden;
  isolation: isolate;
  background: var(--sf-surface, #f1f1f1);
  color: var(--sf-text, #121011);
}

.sfb--small { --sfb-height: 420px; }
.sfb--medium { --sfb-height: 560px; }
.sfb--large { --sfb-height: min(760px, calc(100vh - 120px)); }

/* Over a photograph the words are white, under a shade that rises from the bottom. */
.sfb--photo {
  background: #1a1a1a;
  color: #ffffff;
}

.sfb__photo {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sfb--photo::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(0deg, rgba(10, 10, 10, calc(var(--sfb-shade) + 0.2)) 0%, rgba(10, 10, 10, calc(var(--sfb-shade) * 0.5)) 45%, rgba(10, 10, 10, 0.05) 80%);
}

.sfb__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  box-sizing: border-box;
  width: 100%;
  max-width: var(--sf-measure, 1200px);
  margin: 0 auto;
  padding: 96px var(--sf-gutter, 24px) 72px;
}

.sfb--center .sfb__content {
  align-items: center;
  text-align: center;
}

.sfb__headline {
  max-width: 14ch;
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: clamp(48px, 7vw, 88px);
  font-weight: var(--sf-heading-weight, 700);
  line-height: 0.98;
  letter-spacing: -0.02em;
  text-transform: var(--sf-heading-case, none);
  text-wrap: balance;
}

.sfb__sub {
  max-width: 46ch;
  margin: 0;
  font-size: 18px;
  line-height: 1.55;
}

.sfb__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

/* On the photo the first button is white with the page's ink, the others are outlined in white. */
.sfb__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  height: 52px;
  padding: 0 28px;
  box-sizing: border-box;
  border: 1px solid currentColor;
  border-radius: var(--sf-button-radius, var(--sf-radius, 6px));
  background: var(--sf-text, #121011);
  color: var(--sf-bg, #ffffff) !important;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-decoration: none !important;
  transition: background-color 160ms ease, color 160ms ease;
}

.sfb--photo .sfb__button {
  border-color: #ffffff;
  background: #ffffff;
  color: #141414 !important;
}

.sfb__button--quiet,
.sfb--photo .sfb__button--quiet {
  background: transparent;
  color: inherit !important;
}

.sfb--photo .sfb__button--quiet {
  color: #ffffff !important;
}

.sfb__button:hover {
  background: transparent;
  color: inherit !important;
}

.sfb--photo .sfb__button:hover {
  background: transparent;
  color: #ffffff !important;
}

.sfb--photo .sfb__button--quiet:hover {
  background: #ffffff;
  color: #141414 !important;
}

.sfb__button:focus-visible {
  outline: 2px solid var(--sf-text, #121011);
  outline-offset: 3px;
}

.sfb--photo .sfb__button:focus-visible {
  outline-color: #ffffff;
}

@media (max-width: 900px) {
  .sfb--small { --sfb-height: 380px; }
  .sfb--medium { --sfb-height: 460px; }
  .sfb--large { --sfb-height: 560px; }

  .sfb__content {
    gap: 16px;
    padding-bottom: 40px;
  }

  .sfb__sub {
    font-size: 16px;
  }

  .sfb__actions {
    align-self: stretch;
  }

  .sfb__button {
    flex: 1 1 140px;
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sfb__button {
    transition: none;
  }
}
</style>
