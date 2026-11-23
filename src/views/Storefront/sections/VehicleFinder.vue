<script setup lang="ts">
import { computed, inject, ref, useId } from 'vue'
import { useRouter } from 'vue-router'
import { vehicleLabel } from '@/storefront/fitment'
import type { Vehicle } from '@/storefront/fitment'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontVehicleSelector from '../StorefrontVehicleSelector.vue'
import { STOREFRONT } from '../storefrontContext'
import { flag, text } from './sectionSettings'

// The home page's vehicle finder on an auto-parts store: the `vehicle-finder`
// section. A photograph with the headline and a line, then a panel with the Year →
// Make → Model selects in a row. Find parts saves the vehicle for the store and
// opens every part (the list then shows the parts that fit), with focus on that
// page's heading, as a skip link would leave it. With
// `partNumberSearch`, and once the store can search, the panel also takes a part
// number ("TQ-BRK-4471"), which the search page finds.
//
// Settings: headline, subheadline, image (a path under /public, set by the theme; the
// builder doesn't edit it), partNumberSearch.

const props = withDefaults(defineProps<{
  section: ThemeSection
  /** The page's first banner names the page (h1); the others are h2. */
  headingLevel?: 1 | 2
}>(), { headingLevel: 2 })

const storefront = inject(STOREFRONT)!
const router = useRouter()
const id = useId()

const settings = computed(() => props.section.settings)
const headline = computed(() => text(settings.value, 'headline', 'Find parts that fit'))
const subheadline = computed(() => text(settings.value, 'subheadline'))
const image = computed(() => text(settings.value, 'image'))
const partSearch = computed(() => flag(settings.value, 'partNumberSearch') && storefront.searchable.value)

async function find(vehicle: Vehicle): Promise<void> {
  storefront.setVehicle(vehicle)
  storefront.announce(`Showing parts for ${vehicleLabel(vehicle)}`)
  await router.push(storefront.link('/collections/all'))
  focusPageHeading()
}

/** Puts focus on the new page's heading once it is drawn (a few frames at most), so the keyboard starts there. */
function focusPageHeading(frames = 30): void {
  const heading = document.querySelector<HTMLElement>('.sf-body h1')
  if (!heading) {
    if (frames > 0) requestAnimationFrame(() => focusPageHeading(frames - 1))
    return
  }
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
  heading.focus({ preventScroll: true })
}

const partNumber = ref('')
const partInput = ref<HTMLInputElement | null>(null)

function searchPart(): void {
  const q = partNumber.value.trim()
  if (!q) {
    partInput.value?.focus()
    return
  }
  void router.push(storefront.link(`/search?q=${encodeURIComponent(q)}`))
}
</script>

<template>
  <section class="sfvf" :class="{ 'sfvf--photo': image }" :aria-labelledby="`${id}-title`">
    <img v-if="image" :src="image" alt="" class="sfvf__photo" fetchpriority="high">
    <div class="sfvf__content">
      <div class="sfvf__words">
        <component :is="`h${headingLevel}`" :id="`${id}-title`" class="sfvf__headline">{{ headline }}</component>
        <p v-if="subheadline" class="sfvf__sub">{{ subheadline }}</p>
      </div>

      <div class="sfvf__panel">
        <StorefrontVehicleSelector :vehicle="storefront.vehicle.value" layout="row" submit-label="Find parts" @submit="find" />

        <form v-if="partSearch" class="sfvf__part" role="search" @submit.prevent="searchPart">
          <label :for="`${id}-part`" class="sfvf__part-label">Or search by part number</label>
          <div class="sfvf__part-row">
            <input
              :id="`${id}-part`"
              ref="partInput"
              v-model="partNumber"
              type="search"
              class="sfvf__part-input"
              placeholder="TQ-BRK-4471"
              autocomplete="off"
              spellcheck="false"
            >
            <button type="submit" class="sfvf__part-go">
              <v-icon size="18" aria-hidden="true">search</v-icon>
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────────
 * P4-8 — out of system on purpose: see StorefrontLayout.vue. Over the photograph
 * the words are white under a shade; the panel paints the page's own colour and
 * ink, so its labels and selects read as they do on the rest of the store.
 * ───────────────────────────────────────────────────────────────────────────── */
.sfvf {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--sf-surface, #f2f3f5);
  color: var(--sf-text, #121011);
}

.sfvf--photo {
  background: #15171a;
  color: #ffffff;
}

.sfvf__photo {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Darker on the left, where the words sit. */
.sfvf--photo::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(12, 13, 15, 0.82) 0%, rgba(12, 13, 15, 0.55) 55%, rgba(12, 13, 15, 0.3) 100%),
    linear-gradient(0deg, rgba(12, 13, 15, 0.6) 0%, rgba(12, 13, 15, 0) 50%);
}

.sfvf__content {
  display: flex;
  flex-direction: column;
  gap: 32px;
  box-sizing: border-box;
  max-width: var(--sf-measure, 1200px);
  margin: 0 auto;
  padding: 88px var(--sf-gutter, 24px) 64px;
}

.sfvf__words {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 640px;
}

.sfvf__headline {
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: clamp(44px, 6vw, 76px);
  font-weight: var(--sf-heading-weight, 700);
  line-height: 0.95;
  letter-spacing: 0;
  text-transform: var(--sf-heading-case, none);
  text-wrap: balance;
}

.sfvf__sub {
  max-width: 48ch;
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
}

.sfvf__panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
  max-width: 920px;
  padding: 24px;
  border-radius: var(--sf-radius, 4px);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
}

.sfvf__part {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 18px;
  border-top: 1px solid var(--sf-divider, #e5e5e5);
}

.sfvf__part-label {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.sfvf__part-row {
  display: flex;
  gap: 8px;
  max-width: 520px;
}

.sfvf__part-input {
  flex: 1 1 auto;
  box-sizing: border-box;
  min-width: 0;
  height: 48px;
  padding: 0 14px;
  border: 1px solid var(--sf-muted, #66625c);
  border-radius: var(--sf-radius, 4px);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.sfvf__part-input::placeholder {
  color: var(--sf-muted, #66625c);
  opacity: 1;
}

.sfvf__part-input:focus-visible {
  outline: 2px solid var(--sf-text, #121011);
  outline-offset: 1px;
}

/* A quiet button: outlined in the text colour, beside the field. */
.sfvf__part-go {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 20px;
  border: 1px solid var(--sf-text, #121011);
  border-radius: var(--sf-button-radius, var(--sf-radius, 4px));
  background: transparent;
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.sfvf__part-go:hover {
  background: var(--sf-surface, #f2f3f5);
}

.sfvf__part-go:focus-visible {
  outline: 2px solid var(--sf-text, #121011);
  outline-offset: 2px;
}

@media (max-width: 900px) {
  /* The words run the width of a phone, over the brightest part of a sky too: an even, darker shade. */
  .sfvf--photo::after {
    background: linear-gradient(0deg, rgba(12, 13, 15, 0.78) 0%, rgba(12, 13, 15, 0.62) 100%);
  }

  .sfvf__content {
    gap: 24px;
    padding: 48px var(--sf-gutter, 24px) 40px;
  }

  .sfvf__sub {
    font-size: 16px;
  }

  .sfvf__panel {
    padding: 20px 16px;
  }
}
</style>
