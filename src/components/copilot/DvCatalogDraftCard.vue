<script setup lang="ts">
// DvCatalogDraftCard — a Catalog Co-Pilot result in the Da Vinci thread.
//
// Create mode reads as a spec sheet: the product's title and subtitle, the
// description, a two-column list of the drafted facts, the search listing, and
// what is left for the merchant. Enrich and field modes list each suggestion with
// whether it is new or replaces what's there, and a checkbox per row when there
// is more than one, so the merchant applies all or a subset.
//
// The action footer is sticky inside the drawer's scroll body, so Apply stays in
// reach however long the draft is. Drafts that are no longer in play collapse to
// one line and expand at full contrast — they are never dimmed.
import { computed, ref, watch } from 'vue'
import MpListRow from '@/components/MpListRow.vue'
import type { CatalogDraft, CatalogFieldKey } from '@/composables/useCatalogGenerator'
import {
  CATALOG_FIELD_LABELS,
  CATALOG_FIELD_TITLES,
  CREDITS_PER_ACTION,
  type CatalogField,
  type CatalogMode,
} from '@/composables/catalogCopilotConfig'
import type { CatalogDraftStatus } from '@/stores/useCopilot'

const props = withDefaults(defineProps<{
  mode: CatalogMode
  field?: CatalogField
  draft: CatalogDraft
  /** Current values for the drafted keys — enrich and field modes compare against them. */
  current?: CatalogDraft
  keys: CatalogFieldKey[]
  status?: CatalogDraftStatus
  appliedKeys?: CatalogFieldKey[]
  /** Fields left blank on purpose (create mode). */
  gaps?: CatalogFieldKey[]
  /** Assumptions to check (create mode). */
  notes?: string[]
  /** The button that persists on the target form. */
  commitLabel?: string
  /** Apply in flight (the drawer may be navigating to the form). */
  busy?: boolean
}>(), {
  field: undefined,
  current: undefined,
  status: 'draft',
  appliedKeys: undefined,
  gaps: () => [],
  notes: () => [],
  commitLabel: 'Save as Draft or Publish',
  busy: false,
})

const emit = defineEmits<{
  apply: [keys: CatalogFieldKey[]]
  discard: []
}>()

const STATUS_LABELS: Record<CatalogDraftStatus, string> = {
  draft: 'Draft',
  applied: 'Applied',
  discarded: 'Discarded',
  superseded: 'Replaced',
  inactive: 'Inactive',
}

const SEO_LIMITS: Partial<Record<CatalogFieldKey, number>> = { seoTitle: 60, seoMetaDescription: 155 }

const isDiff = computed(() => props.mode !== 'create')
const isOpen = computed(() => props.status === 'draft')
const selectable = computed(() => isDiff.value && props.keys.length > 1 && isOpen.value)

const selected = ref<CatalogFieldKey[]>([...props.keys])
watch(() => props.keys, (keys) => { selected.value = [...keys] })

/** Collapsed drafts (applied, replaced, discarded, inactive) expand on request. */
const expanded = ref(false)
const showBody = computed(() => isOpen.value || expanded.value)
const descriptionOpen = ref(false)
const currentOpen = ref<CatalogFieldKey[]>([])

const heading = computed(() => {
  if (props.mode === 'create') return props.draft.title || 'New product'
  if (props.mode === 'enrich') return 'Suggestions'
  return CATALOG_FIELD_TITLES[props.field ?? 'description']
})

const ariaLabel = computed(() => (props.mode === 'create' ? `Product draft: ${heading.value}` : heading.value))

/** "Save" on the edit page; the stepper has two buttons that persist. */
const commitPhrase = computed(() => (props.commitLabel === 'Save' ? 'click Save' : 'Save or Publish'))

const applyLabel = computed(() => {
  if (!isDiff.value) return 'Apply to form'
  if (!selectable.value) return 'Apply'
  return selected.value.length === props.keys.length ? `Apply all ${props.keys.length}` : `Apply ${selected.value.length} selected`
})

/** Enrich and field: name what changed. A create draft fills the whole form. */
const appliedLabels = computed(() => (props.appliedKeys ?? props.keys).map((key) => CATALOG_FIELD_LABELS[key]))

const closedNote = computed(() => {
  switch (props.status) {
    case 'applied': return isDiff.value
      ? `Click ${props.commitLabel} to keep the changes.`
      : `Review each step, then ${props.commitLabel}.`
    case 'discarded': return 'Discarded — nothing was applied.'
    case 'superseded': return 'Replaced by a newer draft.'
    case 'inactive': return 'No longer active.'
    default: return ''
  }
})

const hasSeo = computed(() => props.keys.includes('seoTitle') || props.keys.includes('seoMetaDescription'))

function asText(value: CatalogDraft[CatalogFieldKey]): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  return value.map((item) => (typeof item === 'string' ? item : `${item.name}: ${item.values.join(', ')}`)).join(', ')
}

function isLong(value: string | undefined): boolean {
  return (value?.length ?? 0) > 140
}

function counter(key: CatalogFieldKey): string | undefined {
  const limit = SEO_LIMITS[key]
  const value = props.draft[key]
  return limit && typeof value === 'string' ? `${value.length}/${limit}` : undefined
}

function hasCurrent(key: CatalogFieldKey): boolean {
  return asText(props.current?.[key]).trim().length > 0
}

/** Categories are only added to, so the row shows the whole set with the additions marked. */
function isNewCategory(category: string): boolean {
  return !(props.current?.categories ?? []).some((c) => c.toLowerCase() === category.toLowerCase())
}

const addedCategoryCount = computed(() => (props.draft.categories ?? []).filter(isNewCategory).length)

function diffTag(key: CatalogFieldKey): string {
  if (key === 'categories' && hasCurrent(key)) return `Adds ${addedCategoryCount.value}`
  return hasCurrent(key) ? 'Replaces current' : 'New'
}

/** "Show current" is for values a suggestion replaces; added-to categories show both already. */
function canShowCurrent(key: CatalogFieldKey): boolean {
  return key !== 'categories' && hasCurrent(key)
}

function toggleCurrent(key: CatalogFieldKey) {
  currentOpen.value = currentOpen.value.includes(key)
    ? currentOpen.value.filter((k) => k !== key)
    : [...currentOpen.value, key]
}

function skipped(key: CatalogFieldKey): boolean {
  return props.status === 'applied' && !!props.appliedKeys && !props.appliedKeys.includes(key)
}
</script>

<template>
  <article class="dv-catalog-draft" :class="`dv-catalog-draft--${status}`" :aria-label="ariaLabel">
    <header class="dv-catalog-draft__head">
      <h3 class="dv-catalog-draft__title">{{ heading }}</h3>
      <span class="dv-catalog-draft__badge" :class="`dv-catalog-draft__badge--${status}`">
        <v-icon v-if="status === 'draft'" size="11" aria-hidden="true">sparkles</v-icon>
        <v-icon v-else-if="status === 'applied'" size="11" aria-hidden="true">check</v-icon>
        {{ STATUS_LABELS[status] }}
      </span>
    </header>

    <!-- Collapsed: a draft that is no longer in play -->
    <div v-if="!isOpen" class="dv-catalog-draft__summary">
      <div v-if="status === 'applied' && isDiff" class="dv-catalog-draft__chips">
        <v-chip v-for="label in appliedLabels" :key="label" size="small" variant="tonal" label>{{ label }}</v-chip>
      </div>
      <p class="dv-catalog-draft__note">{{ closedNote }}</p>
      <button
        type="button"
        class="dv-catalog-draft__link"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Hide draft' : 'Show draft' }}
      </button>
    </div>

    <!-- Create: a spec sheet -->
    <div v-if="showBody && !isDiff" class="dv-catalog-draft__body">
      <p v-if="draft.subtitle" class="dv-catalog-draft__subtitle">{{ draft.subtitle }}</p>

      <div v-if="draft.description" class="dv-catalog-draft__block">
        <p class="dv-catalog-draft__prose" :class="{ 'is-clamped': !descriptionOpen }">{{ draft.description }}</p>
        <button
          v-if="isLong(draft.description)"
          type="button"
          class="dv-catalog-draft__link"
          :aria-expanded="descriptionOpen"
          @click="descriptionOpen = !descriptionOpen"
        >
          {{ descriptionOpen ? 'Show less' : 'Show all' }}
        </button>
      </div>

      <dl class="dv-catalog-draft__facts">
        <template v-for="option in draft.options ?? []" :key="option.name">
          <dt>{{ option.name }}</dt>
          <dd>{{ option.values.join(' · ') }}</dd>
        </template>
        <template v-if="draft.price">
          <dt>Price</dt>
          <dd>${{ draft.price }} <span class="dv-catalog-draft__muted">on every variant</span></dd>
        </template>
        <template v-if="draft.brand">
          <dt>Brand</dt>
          <dd>{{ draft.brand }}</dd>
        </template>
        <template v-if="draft.tag">
          <dt>Tag</dt>
          <dd>{{ draft.tag }}</dd>
        </template>
        <template v-if="draft.categories?.length">
          <dt>Categories</dt>
          <dd>{{ draft.categories.join(' · ') }}</dd>
        </template>
        <template v-if="draft.collection">
          <dt>Collection</dt>
          <dd>{{ draft.collection }}</dd>
        </template>
        <template v-if="draft.sku">
          <dt>SKU</dt>
          <dd class="dv-catalog-draft__mono">{{ draft.sku }}</dd>
        </template>
      </dl>

      <div v-if="hasSeo" class="dv-catalog-draft__block">
        <span class="dv-catalog-draft__label">Search listing</span>
        <div class="dv-catalog-draft__serp">
          <span class="dv-catalog-draft__serp-url">/products/{{ draft.handle || 'product-handle' }}</span>
          <span class="dv-catalog-draft__serp-title">{{ draft.seoTitle }}</span>
          <span class="dv-catalog-draft__serp-desc">{{ draft.seoMetaDescription }}</span>
        </div>
      </div>

      <div v-if="gaps.length || notes.length" class="dv-catalog-draft__todo">
        <p v-if="gaps.length" class="dv-catalog-draft__todo-line">
          <v-icon size="14" aria-hidden="true">circle-dashed</v-icon>
          <span class="dv-catalog-draft__label">Left for you</span>
          {{ gaps.map((gap) => CATALOG_FIELD_LABELS[gap]).join(' · ') }}
        </p>
        <p v-for="note in notes" :key="note" class="dv-catalog-draft__note">{{ note }}</p>
      </div>
    </div>

    <!-- Enrich and field: each suggestion, new or replacing what's there -->
    <div v-if="showBody && isDiff" class="dv-catalog-draft__body dv-catalog-draft__body--flush">
      <MpListRow
        v-for="key in keys"
        :key="key"
        variant="divided"
        density="compact"
        class="dv-catalog-draft__diff"
        :class="{ 'dv-catalog-draft__diff--skipped': skipped(key) }"
      >
        <template v-if="selectable" #lead>
          <v-checkbox-btn
            v-model="selected"
            :value="key"
            density="compact"
            :aria-label="`Apply ${CATALOG_FIELD_LABELS[key]}`"
          />
        </template>
        <span class="dv-catalog-draft__diff-head">
          <span class="dv-catalog-draft__label">{{ CATALOG_FIELD_LABELS[key] }}</span>
          <span class="dv-catalog-draft__tag">{{ diffTag(key) }}</span>
          <span v-if="counter(key)" class="dv-catalog-draft__count">{{ counter(key) }}</span>
          <span v-if="skipped(key)" class="dv-catalog-draft__tag">Not applied</span>
        </span>
        <span v-if="key === 'categories'" class="dv-catalog-draft__chips">
          <v-chip
            v-for="category in draft.categories"
            :key="category"
            size="small"
            variant="tonal"
            :color="hasCurrent(key) && isNewCategory(category) ? 'primary' : undefined"
            :prepend-icon="hasCurrent(key) && isNewCategory(category) ? 'plus' : undefined"
            label
          >
            {{ category }}<span v-if="hasCurrent(key) && isNewCategory(category)" class="d-sr-only">, added</span>
          </v-chip>
        </span>
        <span
          v-else
          class="dv-catalog-draft__prose"
          :class="{ 'is-clamped': key === 'description' && !descriptionOpen }"
        >{{ asText(draft[key]) }}</span>
        <span
          v-if="(key === 'description' && isLong(draft.description)) || canShowCurrent(key)"
          class="dv-catalog-draft__links"
        >
          <button
            v-if="key === 'description' && isLong(draft.description)"
            type="button"
            class="dv-catalog-draft__link"
            :aria-expanded="descriptionOpen"
            @click="descriptionOpen = !descriptionOpen"
          >
            {{ descriptionOpen ? 'Show less' : 'Show all' }}
          </button>
          <button
            v-if="canShowCurrent(key)"
            type="button"
            class="dv-catalog-draft__link"
            :aria-expanded="currentOpen.includes(key)"
            @click="toggleCurrent(key)"
          >
            {{ currentOpen.includes(key) ? 'Hide current' : 'Show current' }}
          </button>
        </span>
        <span v-if="currentOpen.includes(key)" class="dv-catalog-draft__was">{{ asText(current?.[key]) }}</span>
      </MpListRow>
      <div v-if="notes.length" class="dv-catalog-draft__todo dv-catalog-draft__todo--diff">
        <p v-for="note in notes" :key="note" class="dv-catalog-draft__note">{{ note }}</p>
      </div>
    </div>

    <!-- Sticky inside the drawer's scroll body: Apply stays in reach. -->
    <footer v-if="isOpen" class="dv-catalog-draft__foot">
      <div class="dv-catalog-draft__actions">
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          class="text-none"
          prepend-icon="check"
          :loading="busy"
          :disabled="!selected.length"
          @click="emit('apply', [...selected])"
        >
          {{ applyLabel }}
        </v-btn>
        <v-btn variant="text" size="small" class="text-none" :disabled="busy" @click="emit('discard')">Discard</v-btn>
      </div>
      <p class="dv-catalog-draft__note">
        <v-tooltip location="top" text="Applying uses 1 AI action. Discard and Publish use none.">
          <template #activator="{ props: tip }">
            <span v-bind="tip" class="dv-catalog-draft__cost" tabindex="0">{{ CREDITS_PER_ACTION }} credits</span>
          </template>
        </v-tooltip>
        · Nothing saves until you {{ commitPhrase }}.
      </p>
    </footer>
  </article>
</template>

<style scoped>
.dv-catalog-draft {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  background: var(--surface-primary);
  color: var(--on-surface);
  /* clip, not hidden: `hidden` makes a scroll container, which would trap the
     sticky footer inside the card instead of the drawer's scroll body. */
  overflow: clip;
}

.dv-catalog-draft__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-space-10);
  padding: var(--mp-space-12) var(--mp-space-14) 0;
}

.dv-catalog-draft__title {
  margin: 0;
  min-width: 0;
  font-size: var(--mp-fontSize-15);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: var(--mp-lineHeight-compact);
  overflow-wrap: anywhere;
}

.dv-catalog-draft__badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--mp-space-4);
  padding: var(--mp-space-2) var(--mp-space-8);
  border-radius: var(--mp-radius-full);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  text-transform: uppercase;
  background: var(--dv-accent-soft);
  color: var(--dv-text-primary);
}

.dv-catalog-draft__badge--applied {
  background: var(--pos-soft);
  color: var(--pos-ink);
}

.dv-catalog-draft__badge--discarded,
.dv-catalog-draft__badge--superseded,
.dv-catalog-draft__badge--inactive {
  background: var(--surface-secondary);
  color: var(--on-surface-muted);
}

.dv-catalog-draft__summary {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mp-space-6);
  padding: var(--mp-space-6) var(--mp-space-14) var(--mp-space-12);
}

.dv-catalog-draft__body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
  padding: var(--mp-space-4) var(--mp-space-14) var(--mp-space-14);
}

.dv-catalog-draft__body--flush {
  gap: 0;
  padding-top: var(--mp-space-2);
}

/* A collapsed draft that was expanded: it follows the summary, not the header. */
.dv-catalog-draft__summary + .dv-catalog-draft__body {
  border-top: 1px solid var(--border-subtle);
  padding-top: var(--mp-space-12);
}

.dv-catalog-draft__subtitle {
  margin: calc(-1 * var(--mp-space-8)) 0 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-compact);
  color: var(--on-surface-muted);
}

.dv-catalog-draft__block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mp-space-6);
}

.dv-catalog-draft__prose {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.is-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* The spec sheet: label column sized to its longest label, values beside it. */
.dv-catalog-draft__facts {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: baseline;
  column-gap: var(--mp-space-12);
  row-gap: var(--mp-space-8);
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-compact);
}

.dv-catalog-draft__facts dt {
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
}

.dv-catalog-draft__facts dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

.dv-catalog-draft__facts dd.dv-catalog-draft__chips {
  align-self: center;
  margin: 0;
}

.dv-catalog-draft__label {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--on-surface-muted);
}

.dv-catalog-draft__muted {
  color: var(--on-surface-muted);
}

.dv-catalog-draft__mono {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
}

.dv-catalog-draft__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-4);
}

.dv-catalog-draft__serp {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  gap: var(--mp-space-2);
  padding: var(--mp-space-10) var(--mp-space-12);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-10);
}

.dv-catalog-draft__serp-url {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
  overflow-wrap: anywhere;
}

.dv-catalog-draft__serp-title {
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-compact);
  color: rgb(var(--v-theme-primary));
}

.dv-catalog-draft__serp-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-compact);
  color: var(--on-surface-muted);
}

.dv-catalog-draft__todo {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  padding: var(--mp-space-8) var(--mp-space-12);
  border-radius: var(--mp-radius-10);
  background: var(--surface-secondary);
  color: var(--on-surface);
}

/* Under the diff rows: the rows sit flush, so the notes carry their own air. */
.dv-catalog-draft__todo--diff {
  margin-top: var(--mp-space-8);
}

.dv-catalog-draft__todo-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-6);
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-compact);
}

.dv-catalog-draft__todo-line .v-icon {
  color: var(--on-surface-muted);
}

.dv-catalog-draft__note {
  margin: 0;
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-compact);
  color: var(--on-surface-muted);
}

.dv-catalog-draft__link {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  line-height: var(--mp-component-field-labelHeight);
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
}

.dv-catalog-draft__link:focus-visible,
.dv-catalog-draft__cost:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--mp-radius-4);
}

.dv-catalog-draft__links {
  display: flex;
  gap: var(--mp-space-12);
}

/* Diff rows: the checkbox lines up with the field label, not the row's middle. */
.dv-catalog-draft__diff {
  align-items: flex-start;
  padding-block: var(--mp-space-10);
}

.dv-catalog-draft__diff :deep(.mp-list-row__lead) {
  margin-top: calc((var(--mp-component-field-labelHeight) - var(--mp-space-28)) / 2);
}

.dv-catalog-draft__diff :deep(.mp-list-row__body) {
  gap: var(--mp-space-4);
}

.dv-catalog-draft__diff--skipped .dv-catalog-draft__prose {
  color: var(--on-surface-muted);
}

.dv-catalog-draft__diff-head {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  min-height: var(--mp-component-field-labelHeight);
}

.dv-catalog-draft__tag {
  padding: 0 var(--mp-space-6);
  border-radius: var(--mp-radius-4);
  background: var(--surface-secondary);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
  line-height: var(--mp-component-field-labelHeight);
  color: var(--on-surface-muted);
}

.dv-catalog-draft__count {
  margin-inline-start: auto;
  font-size: var(--mp-fontSize-11);
  font-variant-numeric: tabular-nums;
  color: var(--on-surface-muted);
}

.dv-catalog-draft__was {
  padding-inline-start: var(--mp-space-8);
  border-inline-start: 2px solid var(--border-subtle);
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-compact);
  color: var(--on-surface-muted);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.dv-catalog-draft__foot {
  position: sticky;
  /* The host scroll body publishes its bottom padding so the stuck footer meets
     the edge instead of leaving a strip of scrolled content under it. */
  bottom: var(--dv-sticky-bottom, 0px);
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  padding: var(--mp-space-10) var(--mp-space-14) var(--mp-space-12);
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-primary);
}

.dv-catalog-draft__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
}

.dv-catalog-draft__cost {
  white-space: nowrap;
  font-weight: var(--mp-fontWeight-semibold);
  font-variant-numeric: tabular-nums;
  text-decoration: underline dotted;
  text-underline-offset: 2px;
  cursor: help;
}
</style>
