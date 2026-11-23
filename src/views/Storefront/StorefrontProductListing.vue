<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Product } from '@/stores/useCommerce'
import {
  activeFilters, clearFilters, emptyFilters, facetGroups, listProducts, listingSorts, noFitText, parseListingQuery,
  resultCountText, toListingQuery, toggleFilter, withListingQuery,
} from '@/storefront/facets'
import type { ActiveFilter, FacetKey, ListingFilters, ListingSort } from '@/storefront/facets'
import { vehicleLabel } from '@/storefront/fitment'
import { DEFAULT_GRID, listingNoun } from '@/storefront/listing'
import type { GridSettings } from '@/storefront/listing'
import StorefrontDrawer from './StorefrontDrawer.vue'
import StorefrontFilters from './StorefrontFilters.vue'
import StorefrontListingCard from './StorefrontListingCard.vue'
import StorefrontQuickAdd from './StorefrontQuickAdd.vue'
import { STOREFRONT } from './storefrontContext'

// A product list on the richer theme drawing (Northfold, Torqline): the
// collection page and the search results. Its title and intro, the result count,
// the sort, the filters for what the products have (./facets.ts: a rail on a
// desktop, a "Filter and sort" sheet on a phone), a chip per filter in use with
// Clear all, and editorial cards with quick add. Products sold out in every
// variant go last.
//
// The filters and the sort live in the URL (?size=m&color=black&sort=price-asc),
// so a filtered list can be shared and reloaded, and Back undoes the last change.
// Each change is said to screen readers ("8 of 20 styles"). The page's own keys
// (the search's `q`) are left alone.
//
// On a store that sells parts (Torqline) a bar above the list names the shopper's
// vehicle ("Showing parts for 2019 Ford F-150 · Change") with the switch "Only show
// parts that fit", on until the URL says `fits=0`; without a vehicle it asks for
// one. When the vehicle leaves nothing, the list says so ("No parts fit your 2015
// Honda Civic in Brakes") and offers every part there, or another vehicle.

const props = withDefaults(defineProps<{
  /** Everything the page lists, in its own order (the collection's, or the search's best match first). */
  products: readonly Product[]
  title: string
  /** A line or two under the title. */
  intro?: string
  /** On search results the given order is the best match, and the sort says so. */
  page?: 'collection' | 'search'
  /** What the collection template's product grid asks for. */
  settings?: GridSettings
  /** The "New" mark on cards (off on a New… collection's own page). */
  showNew?: boolean
  /** Where the list is, for "No parts fit your … in Brakes": the collection's name; none on All products or a search. */
  scope?: string
}>(), {
  intro: '',
  page: 'collection',
  settings: () => ({ ...DEFAULT_GRID }),
  showNew: true,
  scope: '',
})

const route = useRoute()
const router = useRouter()
const storefront = inject(STOREFRONT)!
const uid = useId()

const money = computed(() => ({ currency: storefront.currency.value, locale: storefront.channel.value.webStore?.locale }))
const noun = computed(() => listingNoun(props.products))
const sorts = computed(() => listingSorts(props.page))

/** The filters and sort the URL asks for; the ones the template turns off are not read (the fits switch always is). */
const filters = computed<ListingFilters>(() => {
  const asked = parseListingQuery(route.query)
  const kept = props.settings.filters ? asked : { ...emptyFilters(asked.sort), fits: asked.fits }
  return props.settings.sort ? kept : { ...kept, sort: 'featured' }
})

// ── The shopper's vehicle (a store that sells parts) ──────────────────────
const parts = computed(() => storefront.sellsParts.value)
const vehicle = computed(() => (parts.value ? storefront.vehicle.value : null))
const vehicleName = computed(() => (vehicle.value ? vehicleLabel(vehicle.value) : ''))
/** What fits the vehicle, or fits anything. None without a vehicle, so the switch does nothing. */
const fits = computed(() => (vehicle.value
  ? (product: Product) => ['fits', 'universal'].includes(storefront.fitOf(product))
  : undefined))
const listOptions = computed(() => ({ ...money.value, fits: fits.value }))
const fitsOn = computed(() => !!fits.value && filters.value.fits)

function setFits(on: boolean): void {
  void go({ ...filters.value, fits: on })
}

const shown = computed(() => listProducts(props.products, filters.value, listOptions.value))
// A group none of whose values would list anything with the other filters (sizes, once only
// accessories are chosen) says nothing, unless something in it is chosen.
const groups = computed(() => (props.settings.filters ? facetGroups(props.products, filters.value, listOptions.value) : [])
  .filter((group) => group.selected > 0 || group.values.some((value) => value.count > 0)))
const chips = computed(() => activeFilters(props.products, filters.value, money.value))
const countText = computed(() => resultCountText(shown.value.length, props.products.length, noun.value))
/** The toolbar's count: "8 of 20 styles", and "0 of 4 styles" above the empty state, which says the rest. */
const toolbarCount = computed(() => (shown.value.length ? countText.value : `0 of ${props.products.length} ${noun.value.other}`))
const hasRail = computed(() => groups.value.length > 0)

/**
 * The vehicle leaves nothing that the other filters would list: "No parts fit your
 * 2015 Honda Civic in Brakes" (the collection, else the one category chosen), with a
 * button that turns the switch off.
 */
const noFit = computed(() => {
  if (!fitsOn.value || shown.value.length || !listProducts(props.products, { ...filters.value, fits: false }, money.value).length) return null
  const chosen = chips.value.filter((chip) => chip.key === 'category')
  const name = props.scope || (chosen.length === 1 ? chosen[0]!.label : '')
  // A collection is a kind of part when every part in it is one ("Brakes", not "Deals").
  const category = props.scope ? props.products.every((p) => p.detail?.tag === props.scope) : !!name
  return noFitText(vehicleName.value, { name, category, page: props.page })
})

async function showAllParts(): Promise<void> {
  await go({ ...filters.value, fits: false })
  await nextTick()
  count.value?.focus()
}

function go(next: ListingFilters) {
  return router.push({ query: withListingQuery(route.query, next) })
}

function toggle(key: FacetKey, value: string): void {
  void go(toggleFilter(filters.value, key, value))
}

function setSort(event: Event): void {
  const sort = (event.target as HTMLSelectElement).value as ListingSort
  void go({ ...filters.value, sort })
}

// ── Chips ─────────────────────────────────────────────────────────────────
const chipList = ref<HTMLElement | null>(null)
const count = ref<HTMLElement | null>(null)

/** Takes the chip's filter off; focus moves to the chip now in its place, else to the count. */
async function removeChip(chip: ActiveFilter, index: number): Promise<void> {
  await go(chip.next)
  await nextTick()
  const left = [...(chipList.value?.querySelectorAll<HTMLElement>('.sf-listing__chip') ?? [])]
  ;(left[Math.min(index, left.length - 1)] ?? count.value)?.focus()
}

async function clearAll(): Promise<void> {
  await go(clearFilters(filters.value))
  await nextTick()
  count.value?.focus()
}

// ── Said to screen readers ────────────────────────────────────────────────
// After a change of filter, the new count (or, when the vehicle leaves nothing, the empty
// state's own heading: "No parts fit your 2015 Honda Civic in Brakes"); after a change of sort, the sort.
watch(() => JSON.stringify({ ...toListingQuery(filters.value), sort: undefined }), () => {
  void nextTick(() => storefront.announce(noFit.value?.title ?? countText.value))
})
watch(() => filters.value.sort, (sort) => {
  const label = sorts.value.find((s) => s.value === sort)?.label ?? ''
  if (label) storefront.announce(`Sorted by ${label.toLowerCase()}`)
})

// ── The phone's sheet ─────────────────────────────────────────────────────
const sheetOpen = ref(false)
const sheetButton = computed(() => {
  const what = props.settings.filters && groups.value.length ? (props.settings.sort ? 'Filter and sort' : 'Filter') : 'Sort'
  return chips.value.length ? `${what} (${chips.value.length})` : what
})
const showLabel = computed(() => (shown.value.length
  ? `Show ${shown.value.length} ${shown.value.length === 1 ? noun.value.one : noun.value.other}`
  : 'Show results'))

// ── Quick add ─────────────────────────────────────────────────────────────
const quickAdd = ref<InstanceType<typeof StorefrontQuickAdd> | null>(null)
/** Cards whose product was just added: their "+" reads "Added" for a moment. */
const justAdded = ref<number[]>([])
const timers = new Map<number, number>()

function onAdded(product: Product): void {
  justAdded.value = [...justAdded.value.filter((id) => id !== product.id), product.id]
  window.clearTimeout(timers.get(product.id))
  timers.set(product.id, window.setTimeout(() => {
    justAdded.value = justAdded.value.filter((id) => id !== product.id)
    timers.delete(product.id)
  }, 2000))
}
onBeforeUnmount(() => {
  for (const timer of timers.values()) window.clearTimeout(timer)
})

function startQuickAdd(product: Product, color: string | undefined): void {
  quickAdd.value?.start(product, color)
}
</script>

<template>
  <div class="sf-listing">
    <header class="sf-listing__head">
      <h1 class="sf-listing__title">{{ title }}</h1>
      <p v-if="intro" class="sf-listing__intro">{{ intro }}</p>
      <slot name="lead" />
    </header>

    <div v-if="parts && products.length" class="sf-listing__fit">
      <template v-if="vehicle">
        <p class="sf-listing__fit-text">
          <v-icon size="18" class="sf-listing__fit-icon" aria-hidden="true">car-front</v-icon>
          <span>
            {{ fitsOn ? 'Showing parts for' : 'Your vehicle:' }} <strong class="sf-listing__fit-name">{{ vehicleName }}</strong>{{ ' ' }}<span class="sf-listing__fit-then"><span aria-hidden="true">· </span><button type="button" class="sf-listing__fit-change" aria-label="Change vehicle" aria-haspopup="dialog" @click="storefront.chooseVehicle()">Change</button></span>
          </span>
        </p>
        <label class="sf-listing__switch">
          <input
            type="checkbox"
            role="switch"
            class="sf-listing__switch-input"
            :checked="filters.fits"
            @change="setFits(($event.target as HTMLInputElement).checked)"
          >
          <span class="sf-listing__switch-track" aria-hidden="true" />
          <span>Only show parts that fit</span>
        </label>
      </template>
      <template v-else>
        <p class="sf-listing__fit-text">
          <v-icon size="18" class="sf-listing__fit-icon" aria-hidden="true">car-front</v-icon>
          <span>Select your vehicle to see parts that fit</span>
        </p>
        <button type="button" class="sf-listing__fit-select" aria-haspopup="dialog" @click="storefront.chooseVehicle()">Select vehicle</button>
      </template>
    </div>

    <slot v-if="!products.length" name="empty" />

    <div v-else class="sf-listing__body" :class="{ 'sf-listing__body--rail': hasRail }" :style="{ '--sf-listing-cols': settings.columns, '--sf-listing-cols-narrow': Math.min(settings.columns, 3) }">
      <aside v-if="hasRail" class="sf-listing__rail" :aria-labelledby="`${uid}-filters`">
        <h2 :id="`${uid}-filters`" class="sf-listing__rail-title">Filters</h2>
        <StorefrontFilters :groups="groups" :noun="noun" @toggle="toggle" />
      </aside>

      <section class="sf-listing__main" :aria-labelledby="`${uid}-results`">
        <h2 :id="`${uid}-results`" class="sf-sr">{{ noun.other.charAt(0).toUpperCase() + noun.other.slice(1) }}</h2>

        <div class="sf-listing__toolbar">
          <button
            v-if="hasRail || settings.sort"
            type="button"
            class="sf-listing__sheet-button"
            :class="{ 'sf-listing__sheet-button--sort-only': !hasRail }"
            aria-haspopup="dialog"
            @click="sheetOpen = true"
          >
            <v-icon size="18" aria-hidden="true">sliders-horizontal</v-icon>
            {{ sheetButton }}
          </button>
          <p ref="count" class="sf-listing__count" tabindex="-1">{{ toolbarCount }}</p>
          <label v-if="settings.sort" class="sf-listing__sort">
            <span>Sort by</span>
            <select class="sf-listing__select" :value="filters.sort" @change="setSort">
              <option v-for="option in sorts" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
        </div>

        <div v-if="chips.length" ref="chipList" class="sf-listing__chips">
          <ul class="sf-listing__chip-list" role="list" aria-label="Filters in use">
            <li v-for="(chip, i) in chips" :key="`${chip.key}:${chip.value}`">
              <button type="button" class="sf-listing__chip" :aria-label="chip.removeLabel" @click="removeChip(chip, i)">
                {{ chip.label }}
                <v-icon size="16" aria-hidden="true">x</v-icon>
              </button>
            </li>
          </ul>
          <button type="button" class="sf-listing__clear" @click="clearAll">Clear all</button>
        </div>

        <ul v-if="shown.length" class="sf-listing__grid" role="list">
          <li v-for="product in shown" :key="product.id">
            <StorefrontListingCard
              :product="product"
              :color-keys="filters.color"
              :quick-add="settings.quickAdd"
              :added="justAdded.includes(product.id)"
              :show-new="showNew"
              :card-style="settings.cardStyle"
              @quick-add="startQuickAdd"
            />
          </li>
        </ul>

        <div v-else-if="noFit" class="sf-listing__none">
          <p class="sf-listing__none-title">{{ noFit.title }}</p>
          <div class="sf-listing__none-actions">
            <button type="button" class="sf-listing__button" @click="showAllParts">{{ noFit.showAll }}</button>
            <button type="button" class="sf-listing__button sf-listing__button--secondary" aria-haspopup="dialog" @click="storefront.chooseVehicle()">Change vehicle</button>
          </div>
        </div>

        <div v-else class="sf-listing__none">
          <p class="sf-listing__none-title">No {{ noun.other }} match these filters.</p>
          <p class="sf-listing__none-text">Try removing a filter.</p>
          <button type="button" class="sf-listing__button" @click="clearAll">Clear all filters</button>
        </div>
      </section>
    </div>

    <StorefrontDrawer v-if="products.length" v-model="sheetOpen" :title="sheetButton.replace(/ \(\d+\)$/, '')">
      <label v-if="settings.sort" class="sf-listing__sheet-sort">
        <span>Sort by</span>
        <select class="sf-listing__select sf-listing__select--block" :value="filters.sort" @change="setSort">
          <option v-for="option in sorts" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <StorefrontFilters v-if="hasRail" :groups="groups" :noun="noun" layout="sheet" @toggle="toggle" />
      <template #footer>
        <button v-if="chips.length" type="button" class="sf-listing__button sf-listing__button--secondary" @click="clearAll">Clear all</button>
        <button type="button" class="sf-listing__button" @click="sheetOpen = false">{{ showLabel }}</button>
      </template>
    </StorefrontDrawer>

    <StorefrontQuickAdd ref="quickAdd" @added="onAdded" />
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Colours, fonts and
 * corners come from the store's theme (--sf-*); every painted surface sets its
 * own text colour. The list sits on the page's measure and gutter (--sf-measure,
 * --sf-gutter, set by StorefrontLayout), so its left edge is the header logo's at
 * every width, as on the home and product pages. */
.sf-listing {
  --sf-listing-line: color-mix(in srgb, var(--sf-text, #121011) 13%, transparent);
  --sf-listing-muted: var(--sf-muted, color-mix(in srgb, var(--sf-text, #121011) 64%, var(--sf-bg, #ffffff)));
  box-sizing: border-box;
  max-width: var(--sf-measure, 1200px);
  margin: 0 auto;
  padding: 0 var(--sf-gutter, 24px);
}

.sf-listing__head {
  padding: 32px 0 40px;
  text-align: center;
}

/* The page title's size on this drawing: the product title's, 40px (30px at 900px and narrower). */
.sf-listing__title {
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 40px;
  font-weight: var(--sf-heading-weight, 400);
  line-height: 1.1;
  letter-spacing: -0.01em;
  text-transform: var(--sf-heading-case, none);
  overflow-wrap: anywhere;
}

.sf-listing__intro {
  max-width: 34em;
  margin: 14px auto 0;
  color: var(--sf-listing-muted);
  font-size: 16px;
  line-height: 24px;
}

.sf-listing__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 40px;
}

.sf-listing__body--rail {
  grid-template-columns: 220px minmax(0, 1fr);
}

.sf-listing__rail-title {
  display: flex;
  align-items: center;
  min-height: 52px;
  margin: 0;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sf-listing__main {
  min-width: 0;
}

/* Count on the left, sort on the right, on the rail's title line. */
.sf-listing__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  min-height: 52px;
  border-bottom: 1px solid var(--sf-listing-line);
}

.sf-listing__count {
  flex: 1;
  margin: 0;
  color: var(--sf-listing-muted);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.sf-listing__count:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 4px;
}

.sf-listing__count:focus:not(:focus-visible) {
  outline: none;
}

.sf-listing__sort {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--sf-listing-muted);
}

.sf-listing__select {
  height: 40px;
  padding: 0 32px 0 12px;
  border: 1px solid color-mix(in srgb, var(--sf-text, #121011) 22%, transparent);
  border-radius: var(--sf-radius, 0);
  background: var(--sf-bg, #ffffff) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 14px;
  appearance: none;
  cursor: pointer;
}

.sf-listing__select--block {
  width: 100%;
  height: 48px;
}

.sf-listing__select:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

/* Below a desktop the filters are in the sheet this button opens. */
.sf-listing__sheet-button {
  display: none;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid color-mix(in srgb, var(--sf-text, #121011) 30%, transparent);
  border-radius: var(--sf-radius, 0);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.sf-listing__sheet-button:hover {
  border-color: var(--sf-text, #121011);
}

.sf-listing__sheet-button:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-listing__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding-top: 16px;
}

.sf-listing__chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-listing__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 10px 0 14px;
  border: 1px solid color-mix(in srgb, var(--sf-text, #121011) 22%, transparent);
  border-radius: 999px;
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.sf-listing__chip:hover {
  border-color: var(--sf-text, #121011);
}

.sf-listing__clear {
  min-height: 36px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 13px;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.sf-listing__chip:focus-visible,
.sf-listing__clear:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-listing__grid {
  display: grid;
  grid-template-columns: repeat(var(--sf-listing-cols, 4), minmax(0, 1fr));
  gap: 44px 20px;
  margin: 0;
  padding: 28px 0 0;
  list-style: none;
}

.sf-listing__none {
  padding: 72px 16px 40px;
  text-align: center;
}

.sf-listing__none-title {
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 28px;
  font-weight: var(--sf-heading-weight, 400);
  line-height: 1.2;
  text-transform: var(--sf-heading-case, none);
}

.sf-listing__none-text {
  margin: 8px 0 24px;
  color: var(--sf-listing-muted);
  font-size: 15px;
}

/* The vehicle bar of a store that sells parts: the vehicle and the fits switch, above the list
   on every width (on a phone the filters stay in the sheet). Focus rings are the text colour:
   this theme's accent is a yellow that would not show on white. */
.sf-listing__fit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  margin-bottom: 24px;
  padding: 14px 18px;
  border-radius: var(--sf-radius, 0);
  background: var(--sf-surface, color-mix(in srgb, var(--sf-text, #121011) 5%, var(--sf-bg, #ffffff)));
  color: var(--sf-text, #121011);
  font-size: 15px;
  line-height: 22px;
}

.sf-listing__fit-text {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  min-width: 0;
}

/* The vehicle never breaks at its hyphen ("F-" | "150"), and "· Change" wraps as one, never leaving the dot behind. */
.sf-listing__fit-name,
.sf-listing__fit-then {
  white-space: nowrap;
}

.sf-listing__fit-text strong {
  font-weight: 700;
}

.sf-listing__fit-icon {
  flex: none;
  margin-top: 2px;
  color: inherit;
}

.sf-listing__fit-change {
  padding: 1px 2px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.sf-listing__fit-select {
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid var(--sf-button-border, var(--sf-brand, #121011));
  border-radius: var(--sf-button-radius, var(--sf-radius, 0));
  background: var(--sf-button-bg, var(--sf-brand, #121011));
  color: var(--sf-button-ink, var(--sf-on-brand, #ffffff));
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

/* "Only show parts that fit": a real checkbox with the switch role; the track shows it. */
.sf-listing__switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-weight: 600;
  cursor: pointer;
}

.sf-listing__switch-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

.sf-listing__switch-track {
  position: relative;
  flex: none;
  width: 40px;
  height: 24px;
  border: 1px solid var(--sf-text, #121011);
  border-radius: 999px;
  background: var(--sf-bg, #ffffff);
  transition: background-color 160ms ease;
}

.sf-listing__switch-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--sf-text, #121011);
  transition: transform 160ms ease;
}

.sf-listing__switch-input:checked + .sf-listing__switch-track {
  background: var(--sf-text, #121011);
}

.sf-listing__switch-input:checked + .sf-listing__switch-track::after {
  background: var(--sf-bg, #ffffff);
  transform: translateX(16px);
}

.sf-listing__fit-change:focus-visible,
.sf-listing__fit-select:focus-visible,
.sf-listing__switch-input:focus-visible + .sf-listing__switch-track {
  outline: 2px solid var(--sf-text, #121011);
  outline-offset: 2px;
}

.sf-listing__none-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

/* The store's buttons: its colours and corners. */
.sf-listing__button {
  display: inline-flex;
  flex: 1 1 140px;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  padding: 0 24px;
  border: 1px solid var(--sf-button-border, var(--sf-brand, #121011));
  border-radius: var(--sf-button-radius, var(--sf-radius, 0));
  background: var(--sf-button-bg, var(--sf-brand, #121011));
  color: var(--sf-button-ink, var(--sf-on-brand, #ffffff));
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.sf-listing__none .sf-listing__button {
  flex: 0 0 auto;
}

.sf-listing__none-actions .sf-listing__button:focus-visible {
  outline-color: var(--sf-text, #121011);
}

.sf-listing__button:hover {
  background: color-mix(in srgb, var(--sf-button-bg, var(--sf-brand, #121011)) 86%, var(--sf-bg, #ffffff));
}

.sf-listing__button--secondary {
  border-color: color-mix(in srgb, var(--sf-text, #121011) 30%, transparent);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
}

.sf-listing__button--secondary:hover {
  border-color: var(--sf-text, #121011);
  background: var(--sf-bg, #ffffff);
}

.sf-listing__button:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-listing__sheet-sort {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}

.sf-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* A desktop under 1280px: three cards beside the rail. */
@media (max-width: 1279px) {
  .sf-listing__body--rail .sf-listing__grid {
    grid-template-columns: repeat(var(--sf-listing-cols-narrow, 3), minmax(0, 1fr));
  }
}

/* A tablet: the rail goes into the sheet. */
@media (max-width: 1023px) {
  .sf-listing__body,
  .sf-listing__body--rail {
    grid-template-columns: minmax(0, 1fr);
  }

  .sf-listing__rail {
    display: none;
  }

  .sf-listing__sheet-button {
    display: inline-flex;
  }

  .sf-listing__sheet-button--sort-only {
    display: none;
  }

  .sf-listing__grid,
  .sf-listing__body--rail .sf-listing__grid {
    grid-template-columns: repeat(var(--sf-listing-cols-narrow, 3), minmax(0, 1fr));
  }

  .sf-listing__count {
    text-align: end;
  }
}

@media (max-width: 900px) {
  .sf-listing__title {
    font-size: 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sf-listing__switch-track,
  .sf-listing__switch-track::after {
    transition: none;
  }
}

/* A phone: two cards to a row, the sort in the sheet too, touch-sized chips. */
@media (max-width: 600px) {
  .sf-listing__fit {
    margin-bottom: 16px;
    padding: 12px 14px;
  }

  .sf-listing__fit-select {
    width: 100%;
  }

  .sf-listing__head {
    padding: 20px 0 28px;
  }

  .sf-listing__intro {
    font-size: 15px;
    line-height: 22px;
  }

  .sf-listing__toolbar {
    min-height: 60px;
  }

  .sf-listing__sort {
    display: none;
  }

  .sf-listing__sheet-button--sort-only {
    display: inline-flex;
  }

  .sf-listing__grid,
  .sf-listing__body--rail .sf-listing__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px 12px;
    padding-top: 20px;
  }

  .sf-listing__chip,
  .sf-listing__clear {
    min-height: 44px;
  }
}
</style>
