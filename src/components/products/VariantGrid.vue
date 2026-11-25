<script setup lang="ts">
import { computed } from 'vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import type { ProductVariant } from '@/stores/useCommerce'
import { LOW_STOCK, optionKind, optionValuesOf, variantUnits, type VariantOption } from '@/storefront/variants'

// A product's variants on its product page, read-only: grouped by colour (the
// group row shows the swatch, the colour and its stock) when the product has a
// colour beside another option, else one row per variant. Prices and stock are
// edited in the product wizard ("Edit options and variants").
//
// The table folds by its own width, never drops: below `layout.tableColumnsSm`
// the SKU moves under the size, the compare-at price under the price and the
// stock chip under the count, so a phone keeps every fact without a sideways scroll.

const props = withDefaults(defineProps<{
  /** The product's options, in order (`detail.options`). */
  options: VariantOption[]
  variants: ProductVariant[]
  /** A price as the product's store writes it ("$98.00"). */
  formatPrice?: (price: string) => string
  /** The table's caption, for assistive tech ("Variants of Linen Overshirt"). */
  caption?: string
  /** The empty state's button. Without it the empty state has none. */
  emptyActionLabel?: string
}>(), {
  formatPrice: (price: string) => `$${(Number.parseFloat(price) || 0).toFixed(2)}`,
  caption: 'Variants',
  emptyActionLabel: undefined,
})

const emit = defineEmits<{ 'empty-action': [] }>()

interface Row {
  variant: ProductVariant
  label: string
  /** The colour's swatch, on a row of a colour-only product. */
  swatch?: string
  /** Units on hand; null when stock is not tracked. */
  units: number | null
  status: string
  /** "Oxford Warehouse 140 · Testing 12" when more than one location holds stock; else empty. */
  byLocation: string
}

interface Group {
  key: string
  /** The colour, or null for the one group of a product not grouped by colour. */
  name: string | null
  swatch?: string
  rows: Row[]
  summary: string
}

/** What a variant's stock chip says: as the storefront sees it, "Low stock" at "Only 3 left" or fewer. */
function stockRow(variant: ProductVariant): Pick<Row, 'units' | 'status' | 'byLocation'> {
  if (!variant.manageInventory) return { units: null, status: 'Not tracked', byLocation: '' }
  const units = variantUnits(variant)
  // The total stays the number; the split by location (keys are location names) goes under it.
  const held = Object.entries(variant.stock ?? {}).filter(([, n]) => n > 0)
  const byLocation = held.length > 1 ? held.map(([where, n]) => `${where} ${n}`).join(' · ') : ''
  if (units <= 0) return { units, status: variant.allowBackorder ? 'Backorder' : 'Out of stock', byLocation }
  return { units, status: units <= LOW_STOCK ? 'Low stock' : 'In stock', byLocation }
}

const colourIndex = computed(() => props.options.findIndex((option) => optionKind(option) === 'color'))
/** Grouped when a colour shares the product with another option (Color × Size); a colour-only product lists its colours. */
const grouped = computed(() => colourIndex.value >= 0 && props.options.length > 1)

/** The first column: the options a row is told apart by. */
const labelHeader = computed(() => {
  const names = props.options.filter((_, i) => !grouped.value || i !== colourIndex.value).map((option) => option.name)
  return names.length ? names.join(' / ') : 'Variant'
})

function rowOf(variant: ProductVariant): Row {
  if (!props.options.length) return { variant, label: variant.title, ...stockRow(variant) }
  const values = optionValuesOf(variant, props.options)
  const shown = grouped.value ? values.filter((_, i) => i !== colourIndex.value) : values
  const colour = props.options[colourIndex.value]
  const swatch = !grouped.value && colour?.display !== 'buttons' ? colour?.swatches?.[values[colourIndex.value] ?? ''] : undefined
  return { variant, label: shown.join(' / ') || variant.title, ...(swatch ? { swatch } : {}), ...stockRow(variant) }
}

function summaryOf(rows: Row[], noun: string): string {
  const tracked = rows.filter((row) => row.units !== null)
  const units = tracked.reduce((sum, row) => sum + (row.units ?? 0), 0)
  const count = `${rows.length} ${noun}${rows.length === 1 ? '' : 's'}`
  if (!tracked.length) return count
  return `${count} · ${units ? `${units} in stock` : 'sold out'}`
}

const groups = computed<Group[]>(() => {
  const rows = props.variants.map(rowOf)
  if (!grouped.value) return [{ key: 'all', name: null, rows, summary: '' }]
  const option = props.options[colourIndex.value]!
  const noun = (props.options.find((_, i) => i !== colourIndex.value)?.name ?? 'variant').toLowerCase()
  const colourOf = (row: Row) => optionValuesOf(row.variant, props.options)[colourIndex.value] ?? ''
  // The option's order first; a colour only a variant names (an older seed) after it.
  const colours = [...new Set([...option.values, ...rows.map(colourOf)])]
  return colours
    .map((name) => {
      const members = rows.filter((row) => colourOf(row) === name)
      return { key: name, name, swatch: option.display === 'buttons' ? undefined : option.swatches?.[name], rows: members, summary: summaryOf(members, noun) }
    })
    .filter((group) => group.rows.length)
})

const counts = computed(() => {
  const rows = groups.value.flatMap((group) => group.rows)
  const soldOut = rows.filter((row) => row.status === 'Out of stock').length
  const low = rows.filter((row) => row.status === 'Low stock').length
  return [
    `${rows.length} variant${rows.length === 1 ? '' : 's'}`,
    soldOut ? `${soldOut} sold out` : '',
    low ? `${low} running low` : '',
  ].filter(Boolean).join(' · ')
})

const compareAt = (variant: ProductVariant): string | null =>
  Number.parseFloat(variant.compareAtPrice ?? '') > 0 ? props.formatPrice(variant.compareAtPrice!) : null
</script>

<template>
  <MpEmptyState
    v-if="!variants.length"
    icon="layers"
    title="No variants yet"
    description="Add options such as Size or Color, and a variant is made for each combination."
    :action-label="emptyActionLabel"
    action-icon="plus"
    :heading-level="3"
    @action="emit('empty-action')"
  />
  <div v-else class="vg">
    <p class="vg__counts">{{ counts }}</p>
    <v-table class="vg__table">
      <caption class="d-sr-only">{{ caption }}</caption>
      <thead>
        <tr>
          <th scope="col">{{ labelHeader }}</th>
          <th scope="col" class="vg__wide">SKU</th>
          <th scope="col" class="text-right">Price</th>
          <th scope="col" class="text-right vg__wide">Compare-at</th>
          <th scope="col" class="text-right">Stock</th>
          <th scope="col" class="vg__wide"><span class="d-sr-only">Stock status</span></th>
        </tr>
      </thead>
      <tbody v-for="group in groups" :key="group.key">
        <tr v-if="group.name !== null" class="vg__group">
          <th colspan="6" scope="rowgroup">
            <span class="vg__group-head">
              <span
                v-if="group.swatch"
                class="vg__swatch"
                :style="{ '--vg-swatch': group.swatch }"
                aria-hidden="true"
              />
              <span class="vg__group-name">{{ group.name }}</span>
              <span class="vg__group-summary">{{ group.summary }}</span>
            </span>
          </th>
        </tr>
        <tr v-for="row in group.rows" :key="row.variant.id">
          <td>
            <span class="vg__label">
              <span v-if="row.swatch" class="vg__swatch" :style="{ '--vg-swatch': row.swatch }" aria-hidden="true" />
              {{ row.label }}
            </span>
            <span v-if="row.variant.sku" class="vg__fold vg__sku"><span class="d-sr-only">SKU </span>{{ row.variant.sku }}</span>
          </td>
          <td class="vg__wide"><span class="vg__sku">{{ row.variant.sku || '—' }}</span></td>
          <td class="text-right text-no-wrap">
            {{ formatPrice(row.variant.price) }}
            <span v-if="compareAt(row.variant)" class="vg__fold vg__was"><span class="d-sr-only">Compare-at </span><s>{{ compareAt(row.variant) }}</s></span>
          </td>
          <td class="text-right text-no-wrap vg__wide">
            <s v-if="compareAt(row.variant)" class="vg__was">{{ compareAt(row.variant) }}</s>
            <template v-else><span class="text-medium-emphasis" aria-hidden="true">—</span><span class="d-sr-only">None</span></template>
          </td>
          <td class="text-right">
            <span :class="{ 'text-medium-emphasis': row.units === null }">{{ row.units ?? '—' }}</span>
            <span v-if="row.byLocation" class="vg__where">{{ row.byLocation }}</span>
            <span class="vg__fold vg__fold-chip"><MpStatusChip :status="row.status" type="stock" size="sm" /></span>
          </td>
          <td class="vg__wide"><MpStatusChip :status="row.status" type="stock" size="sm" /></td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<style scoped lang="scss">
.vg {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

.vg__counts {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--text-muted);
}

.vg__table {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-10);
}

/* Dense rows: a variant grid reads like a list, so its rows sit on the list-row
   baseline (control.height) rather than the 48px page-table floor. */
.vg .vg__table :deep(.v-table__wrapper > table > tbody > tr > td),
.vg .vg__table :deep(.v-table__wrapper > table > tbody > tr > th) {
  height: var(--mp-component-listItem-minHeight);
  padding-block: var(--mp-component-listItem-paddingBlock);
}

.vg__group th {
  background: var(--surface-secondary);
  color: var(--on-surface);
  border-bottom: 1px solid var(--border-subtle);
  text-transform: none;
}

.vg__group-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  column-gap: var(--mp-space-8);
  row-gap: var(--mp-space-2);
}

.vg__swatch {
  width: var(--mp-space-14);
  height: var(--mp-space-14);
  flex-shrink: 0;
  border-radius: var(--mp-radius-full);
  background: var(--vg-swatch);
  box-shadow: inset 0 0 0 1px var(--border-strong);
}

.vg__group-name {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: normal;
}

.vg__group-summary {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-regular);
  letter-spacing: normal;
  color: var(--text-muted);
}

.vg__sku {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
  white-space: nowrap;
  color: var(--text-muted);
}

.vg__was {
  color: var(--text-muted);
}

.vg__where {
  display: block;
  font-size: var(--mp-fontSize-12);
  white-space: nowrap;
  color: var(--text-muted);
}

.vg__label {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
}

/* Shown only once the table is too narrow for its own column. */
.vg__fold {
  display: none;
}

@container (max-width: #{$mp-layout-tableColumnsSm}) {
  .vg__wide {
    display: none;
  }

  .vg__fold {
    display: block;
  }

  .vg__fold-chip {
    margin-top: var(--mp-space-4);
  }

  /* A phone keeps every column inside the card: a folded SKU or location split wraps. */
  .vg__fold.vg__sku,
  .vg__where {
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
</style>
