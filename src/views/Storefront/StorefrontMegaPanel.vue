<script setup lang="ts">
import type { StorefrontMegaMenu } from '@/stores/useStorefront'
import StorefrontAnchor from './StorefrontAnchor.vue'

// A header link's panel, the mega menu: columns of links under a heading, and a
// picture tile beside them. StorefrontHeader decides when it is open (hover, a press,
// Esc, the keyboard moving on) and draws it in both drawings. It hangs from the
// header's nearest positioned box, the page's full width: the classic header itself,
// or the sections header's bar (so it sits under the menu row, not under the search row).
//
// It paints its own surface, so a dark header's ink and focus colour never reach it,
// and its focus rings are in its own ink. Classic themes set none of the sections
// drawing's variables, so every fallback below is the value the classic panel has
// always had (Daybloom draws exactly as before); a sections theme (Vitaheal) gets its
// heading weight and case, and its card corners on the picture.

defineProps<{
  menu: StorefrontMegaMenu
  /** The panel's id: the link's button names it in `aria-controls`; its column headings take ids from it. */
  panelId: string
  open: boolean
}>()
</script>

<template>
  <div v-show="open" :id="panelId" class="sf-mega">
    <div class="sf-mega__inner" :class="{ 'sf-mega__inner--feature': menu.feature }">
      <div v-for="(column, c) in menu.columns" :key="column.heading" class="sf-mega__col">
        <p :id="`${panelId}-${c}`" class="sf-mega__heading">{{ column.heading }}</p>
        <ul :aria-labelledby="`${panelId}-${c}`">
          <li v-for="link in column.links" :key="link.label">
            <StorefrontAnchor :href="link.href" class="sf-mega__link">{{ link.label }}</StorefrontAnchor>
          </li>
        </ul>
      </div>
      <StorefrontAnchor v-if="menu.feature" :href="menu.feature.link.href" class="sf-mega__feature">
        <img :src="menu.feature.image" alt="" loading="lazy">
        <span class="sf-mega__feature-heading">{{ menu.feature.heading }}</span>
        <span class="sf-mega__feature-text">{{ menu.feature.text }}</span>
        <span class="sf-mega__feature-link">
          {{ menu.feature.link.label }}
          <v-icon size="16" aria-hidden="true">arrow-right</v-icon>
        </span>
      </StorefrontAnchor>
    </div>
  </div>
</template>

<style scoped>
/* P4-8 — DELIBERATELY OUT OF SYSTEM, like the rest of the storefront (see
 * StorefrontLayout.vue): it draws with the store's theme variables (--sf-*). Moved
 * from StorefrontHeader's classic rules; the fallbacks are those rules' values. */
.sf-mega {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  border-top: 1px solid var(--sf-divider, #e5e5e5);
  border-bottom: 1px solid var(--sf-divider, #e5e5e5);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  box-shadow: 0 24px 32px -24px rgba(18, 16, 17, 0.28);
  font-size: 15px;
  font-weight: 400;
  /* The page's own line height, whatever the menu row it hangs from sets. */
  line-height: 24px;
}

.sf-mega a {
  color: inherit;
  text-decoration: none;
}

.sf-mega a:hover {
  text-decoration: underline;
}

.sf-mega a:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.sf-mega__inner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 40px;
  box-sizing: border-box;
  max-width: var(--sf-measure, 1200px);
  margin: 0 auto;
  padding: 32px var(--sf-gutter, 24px) 40px;
  text-align: left;
}

/* With a picture tile: the columns share what is left of the row. */
.sf-mega__inner--feature {
  grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(240px, 300px);
}

.sf-mega__heading {
  margin: 0 0 14px;
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  font-weight: var(--sf-heading-weight, 700);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sf-mega__col ul {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-mega__link {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
}

/* Always in the last track, at the panel's end, however many columns of links there are. */
.sf-mega__feature {
  grid-column: -2 / -1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sf-mega__feature:hover {
  text-decoration: none !important;
}

.sf-mega__feature img {
  width: 100%;
  aspect-ratio: 4 / 3;
  margin-bottom: 8px;
  border-radius: var(--sf-card-radius, var(--sf-radius, 6px));
  object-fit: cover;
}

.sf-mega__feature-heading {
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 17px;
  font-weight: var(--sf-heading-weight, 700);
  line-height: 1.3;
  text-transform: var(--sf-heading-case, none);
}

.sf-mega__feature-text {
  font-size: 14px;
  line-height: 1.5;
}

.sf-mega__feature-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
