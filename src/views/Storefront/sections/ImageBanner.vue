<script setup lang="ts">
import { computed } from 'vue'
import { accentParts } from '@/storefront/themeSections'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import { blocksOf, num, text } from './sectionSettings'

// A full-width photograph with a headline, a line and buttons: the `image-banner`
// section (its buttons are `button` blocks) and the older `hero` section (one
// button, from ctaLabel and ctaLink). Its height and, for a hero, the text's
// alignment and the shade over the photo come from the section. The words sit at
// the bottom of the photo under a shade that keeps white text readable.
//
// An image banner may also have a badge (a pill above the headline), words of the
// headline in the accent colour, and up to three `stat` blocks (a white strip of
// figures under the buttons). With `contentPosition: 'Center left'` the words sit
// left of centre in the page's own colours, on a wash of the page colour that fades
// out across the photo (Lumos): the first button is the theme's button and the
// second its outline. With `contentPosition: 'Middle left'` the words are white and
// centred at the left, over a dark shade that runs across the photo from the left
// (Aurora's full-bleed hero): the first button is white with the page's ink.

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
/** The words left of centre in the page's colours, rather than white at the photo's foot. */
const left = computed(() => props.section.kind === 'image-banner' && text(settings.value, 'contentPosition') === 'Center left')
/** The words white and centred at the left, over a dark shade across the photo. */
const shadeLeft = computed(() => props.section.kind === 'image-banner' && text(settings.value, 'contentPosition') === 'Middle left')
const badge = computed(() => (props.section.kind === 'image-banner' ? text(settings.value, 'badge') : ''))
const headlineParts = computed(() => accentParts(headline.value, text(settings.value, 'accentWords')))
/** The figures under the buttons: three at most. */
const stats = computed(() => blocksOf(props.section, 'stat')
  .map((block) => ({ id: block.id, value: text(block.settings, 'value'), label: text(block.settings, 'label') }))
  .filter((stat) => stat.value)
  .slice(0, 3))
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
    :class="[`sfb--${height}`, { 'sfb--center': centered && !left, 'sfb--photo': image, 'sfb--left': left, 'sfb--shade-left': shadeLeft }]"
    :style="shade !== undefined ? { '--sfb-shade': shade / 100 } : undefined"
  >
    <img v-if="image" :src="image" alt="" class="sfb__photo" fetchpriority="high">
    <div class="sfb__content">
      <p v-if="badge" class="sfb__badge">{{ badge }}</p>
      <component :is="`h${headingLevel}`" v-if="headline" class="sfb__headline">
        <template v-for="(part, index) in headlineParts" :key="index"><span v-if="part.accent" class="sfb__accent">{{ part.text }}</span><template v-else>{{ part.text }}</template></template>
      </component>
      <p v-if="subheadline" class="sfb__sub">{{ subheadline }}</p>
      <div v-if="buttons.length" class="sfb__actions">
        <template v-for="(button, index) in buttons" :key="button.id">
          <StorefrontAnchor v-if="button.link" :href="button.link" class="sfb__button" :class="{ 'sfb__button--quiet': index > 0 }">
            {{ button.label }}
          </StorefrontAnchor>
        </template>
      </div>
      <!-- A figure over what it counts, read as one line ("12K+ homes furnished"). data-sf-clear: on a
           phone's first screen the strip sits in the chat launcher's corner, which steps aside while it
           would cover a figure and comes back once the strip scrolls past (StorefrontChat). -->
      <ul v-if="stats.length" class="sfb__stats" data-sf-clear>
        <li v-for="stat in stats" :key="stat.id" class="sfb__stat">
          <strong class="sfb__stat-value">{{ stat.value }}</strong>{{ ' ' }}<span v-if="stat.label" class="sfb__stat-label">{{ stat.label }}</span>
        </li>
      </ul>
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
  font-size: var(--sf-hero-title, clamp(48px, 7vw, 88px));
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
/* The badge: a pill above the headline, outlined in the words' colour. */
.sfb__badge {
  margin: 0;
  padding: 5px 12px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
}

/* Accent words: the accent on the page's colours; on the dark shade a lighter mix of it, so
   they keep 4.5:1 against the shade (a deep accent such as indigo would not). */
.sfb__accent {
  color: var(--sf-accent, currentColor);
}

.sfb--photo:not(.sfb--left) .sfb__accent {
  color: color-mix(in srgb, var(--sf-accent, #ffffff) 40%, #ffffff);
}

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
  text-transform: var(--sf-button-case, none);
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

/* ── Words on the left (contentPosition: 'Center left') ───────────────────
   The words in the page's own colours, left of centre, on a wash of the page colour
   that fades out across the photo: at its strongest behind the words, so they keep
   their contrast on any photo. The buttons are the theme's: solid, then outlined. */
.sfb--left {
  align-items: center;
}

.sfb--left.sfb--photo {
  background: var(--sf-surface, #f1f1f1);
  color: var(--sf-text, #121011);
}

.sfb--left.sfb--photo::after {
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--sf-bg, #ffffff) 92%, transparent) 0%,
    color-mix(in srgb, var(--sf-bg, #ffffff) 85%, transparent) 50%,
    color-mix(in srgb, var(--sf-bg, #ffffff) 55%, transparent) 64%,
    transparent 86%);
}

.sfb--left .sfb__content {
  align-items: flex-start;
  gap: 24px;
  padding-block: 72px;
}

.sfb--left .sfb__content > * {
  max-width: min(100%, 640px);
}

.sfb--left .sfb__headline {
  max-width: 13ch;
  line-height: 1.05;
  letter-spacing: 0;
}

.sfb--left .sfb__badge {
  border-color: var(--sf-accent, currentColor);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-accent, currentColor);
}

.sfb--left .sfb__sub {
  max-width: 52ch;
}

.sfb--left .sfb__actions {
  gap: 16px;
  margin-top: 0;
}

.sfb--left .sfb__button,
.sfb--left.sfb--photo .sfb__button {
  height: 56px;
  padding: 0 32px;
  white-space: nowrap;
  border-color: var(--sf-button-border, var(--sf-button-bg, var(--sf-text, #121011)));
  background: var(--sf-button-bg, var(--sf-text, #121011));
  color: var(--sf-button-ink, var(--sf-bg, #ffffff)) !important;
  font-size: 16px;
  font-weight: 600;
}

.sfb--left .sfb__button:hover,
.sfb--left.sfb--photo .sfb__button:hover {
  border-color: var(--sf-button-hover, var(--sf-button-border, var(--sf-text, #121011)));
  background: var(--sf-button-hover, color-mix(in srgb, var(--sf-button-bg, var(--sf-text, #121011)) 84%, #000000));
  color: var(--sf-button-ink, var(--sf-bg, #ffffff)) !important;
}

.sfb--left .sfb__button--quiet,
.sfb--left.sfb--photo .sfb__button--quiet {
  border-color: var(--sf-text, #121011);
  background: transparent;
  color: var(--sf-text, #121011) !important;
}

.sfb--left .sfb__button--quiet:hover,
.sfb--left.sfb--photo .sfb__button--quiet:hover {
  border-color: var(--sf-text, #121011);
  background: var(--sf-text, #121011);
  color: var(--sf-bg, #ffffff) !important;
}

.sfb--left .sfb__button:focus-visible,
.sfb--left.sfb--photo .sfb__button:focus-visible {
  outline-color: var(--sf-focus, var(--sf-text, #121011));
}

/* ── White words on the left (contentPosition: 'Middle left') ─────────────
   Aurora's full-bleed hero, 400px tall when Small (UAT's height, on a phone too). The
   words are white and centred at the left, over a near-black shade that runs from the
   left: at least 58% as far as the words reach (their 640px column, wherever the page's
   measure puts it), so white keeps 4.9:1 even over a white patch of photo, then it fades
   out across the rest. On a phone the words span the width, and so does that strength.
   The buttons are the photo's: the first white with dark ink, the others outlined in white. */
.sfb--shade-left {
  --sfb-words-end: calc(max(0px, (100% - var(--sf-measure, 1200px)) / 2) + var(--sf-gutter, 24px) + 640px);
  align-items: center;
}

.sfb--shade-left.sfb--small { --sfb-height: 400px; }

.sfb--shade-left.sfb--photo::after {
  background: linear-gradient(90deg,
    rgba(10, 10, 10, 0.64) 0%,
    rgba(10, 10, 10, 0.58) var(--sfb-words-end),
    rgba(10, 10, 10, 0.2) calc(var(--sfb-words-end) + 20%),
    rgba(10, 10, 10, 0.06) 100%);
}

.sfb--shade-left .sfb__content {
  gap: 16px;
  padding-block: 48px;
}

.sfb--shade-left .sfb__content > * {
  max-width: min(100%, 640px);
}

/* The line under the headline keeps to about 46 characters, so on a laptop (1024 to 1280) it ends before the
   middle of the photo, where its subject stands (Aurora's hiker), rather than running across him. */
.sfb--shade-left .sfb__sub {
  max-width: min(100%, 440px);
}

.sfb--shade-left .sfb__headline {
  line-height: 1.2;
  letter-spacing: 0;
}

/* UAT's button: 46px tall, 24px in from each side, 14px words. */
.sfb--shade-left .sfb__button {
  min-width: 140px;
  height: 46px;
  padding: 0 24px;
  font-size: 14px;
}

/* ── Stats: a white strip of figures under the buttons ───────────────────── */
.sfb__stats {
  display: flex;
  margin: 8px 0 0;
  padding: 18px 0;
  list-style: none;
  border: 1px solid var(--sf-divider, rgba(0, 0, 0, 0.08));
  border-radius: var(--sf-radius, 4px);
  background: var(--sf-card, #ffffff);
  box-shadow: 0 7px 9px -5px rgba(0, 0, 0, 0.1);
  color: var(--sf-text, #121011);
}

.sfb__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 28px;
}

.sfb__stat + .sfb__stat {
  border-left: 1px solid var(--sf-divider, rgba(0, 0, 0, 0.12));
}

.sfb__stat-value {
  color: var(--sf-accent, var(--sf-text, #121011));
  font-family: var(--sf-heading-font, system-ui), sans-serif;
  font-size: 26px;
  font-weight: 600;
  line-height: 32px;
  letter-spacing: -0.02em;
}

.sfb__stat-label {
  color: var(--sf-muted, #5f5f5f);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
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

  .sfb__headline {
    font-size: var(--sf-hero-title-sm, clamp(48px, 7vw, 88px));
  }

  .sfb--left .sfb__content {
    gap: 20px;
    padding-block: 56px 40px;
  }

  .sfb--left .sfb__button,
  .sfb--left.sfb--photo .sfb__button {
    height: 52px;
  }

  .sfb--shade-left .sfb__content {
    padding-block: 40px;
  }

  .sfb__actions {
    align-self: stretch;
  }

  .sfb__button {
    flex: 1 1 140px;
    min-width: 0;
  }
}

/* A phone: the whole photo under the wash, a button to a row, and the figures side by side in three columns. */
@media (max-width: 600px) {
  .sfb--left.sfb--photo::after {
    background: color-mix(in srgb, var(--sf-bg, #ffffff) 84%, transparent);
  }

  .sfb--left .sfb__button,
  .sfb--left.sfb--photo .sfb__button {
    flex-basis: 100%;
  }

  .sfb__stats {
    align-self: stretch;
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    padding: 16px 0;
  }

  .sfb__stat {
    padding: 0 12px;
  }

  .sfb__stat-value {
    font-size: 22px;
    line-height: 28px;
  }

  .sfb__stat-label {
    font-size: 11px;
    letter-spacing: 0.04em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sfb__button {
    transition: none;
  }
}
</style>
