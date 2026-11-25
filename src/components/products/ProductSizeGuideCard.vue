<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import type { SizeChart } from '@/storefront/sizeCharts'

// The "Size guide" card on a product's page in Products: which of its store's
// size charts the product page opens from its sizes (`detail.sizeChartId`), with
// a preview of the chart chosen. Charts are written on Products › Size charts.

const props = withDefaults(defineProps<{
  /** The chart the product links; undefined for none. */
  modelValue?: string
  /** The charts of the product's store. */
  charts: SizeChart[]
  /** The product's sizes, to say which of them the chosen chart leaves out. */
  sizes?: string[]
  /** Where "Manage size charts" goes; no link without it. */
  manageTo?: RouteLocationRaw | null
}>(), { modelValue: undefined, sizes: () => [], manageTo: null })

const emit = defineEmits<{ 'update:modelValue': [chartId: string | undefined] }>()

/** The select's value for "No size guide": a select cannot hold undefined as an item. */
const NONE = ''

const items = computed(() => [
  { title: 'No size guide', value: NONE },
  ...props.charts.map((chart) => ({ title: chart.name, value: chart.id })),
])

/** The chart chosen, while it still exists. */
const chart = computed(() => props.charts.find((c) => c.id === props.modelValue))

function choose(value: string | null) {
  emit('update:modelValue', value ? value : undefined)
}

/** Sizes the product sells that the chart has no row for. */
const missing = computed(() => {
  const rows = new Set(chart.value?.rows.map((row) => row.size) ?? [])
  return chart.value ? props.sizes.filter((size) => !rows.has(size)) : []
})

const unitText = computed(() => (chart.value?.unit === 'cm' ? 'Measurements in centimeters' : 'Measurements in inches'))

/** A range as the size guide writes it: "32-33" reads "32–33". */
const range = (value: string) => value.replace(/(\d)\s*-\s*(\d)/g, '$1–$2') || '—'

const missingText = computed(() => {
  const list = missing.value
  const names = list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0]
  return `${names} ${list.length > 1 ? 'are' : 'is'} not in this chart, so shoppers who choose ${list.length > 1 ? 'them' : 'it'} see no measurements.`
})
</script>

<template>
  <v-card flat border rounded="lg" class="psg mp-card-inset">
    <MpFormSection
      :heading-level="2"
      title="Size guide"
      description="Shoppers open it beside the sizes on the product page."
    />
    <v-select
      :model-value="chart ? chart.id : NONE"
      :items="items"
      label="Size chart"
      @update:model-value="choose"
    />

    <div v-if="chart" class="psg__preview">
      <div class="psg__caption">
        <span>{{ unitText }}</span>
        <span>{{ chart.rows.length }} {{ chart.rows.length === 1 ? 'size' : 'sizes' }}</span>
      </div>
      <v-table density="compact" class="psg__table">
        <caption class="d-sr-only">{{ chart.name }}, {{ unitText.toLowerCase() }}</caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th v-for="column in chart.columns" :key="column" scope="col">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in chart.rows" :key="row.size">
            <th scope="row">{{ row.size }}</th>
            <td v-for="(column, i) in chart.columns" :key="column">{{ range(row.values[i] ?? '') }}</td>
          </tr>
        </tbody>
      </v-table>
      <p v-if="chart.fitNote" class="psg__note">{{ chart.fitNote }}</p>
    </div>
    <p v-else class="psg__none">
      {{ charts.length ? 'This product shows no size guide. Pick a chart to add one.' : 'This store has no size charts yet.' }}
    </p>

    <MpAlert v-if="missing.length" tone="warning">{{ missingText }}</MpAlert>

    <RouterLink v-if="manageTo" :to="manageTo" class="mp-link text-body-2 align-self-start">Manage size charts</RouterLink>
  </v-card>
</template>

<style scoped>
.psg {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.psg__preview {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

.psg__caption {
  display: flex;
  justify-content: space-between;
  gap: var(--mp-space-8);
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
}

.psg__table {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-10);
}

/* A preview, not a page table: rows on the compact list baseline, and a size column that reads as the row's name. */
.psg .psg__table :deep(.v-table__wrapper > table > tbody > tr > td),
.psg .psg__table :deep(.v-table__wrapper > table > tbody > tr > th) {
  height: var(--mp-component-field-height-sm);
  padding-block: var(--mp-space-4);
  padding-inline: var(--mp-component-table-cellPaddingInlineCompact);
  font-size: var(--mp-fontSize-13);
  white-space: nowrap;
}

.psg .psg__table :deep(.v-table__wrapper > table > thead > tr > th) {
  padding-inline: var(--mp-component-table-cellPaddingInlineCompact);
}

.psg__table tbody th {
  font-weight: var(--mp-fontWeight-medium);
  text-align: start;
}

.psg__note,
.psg__none {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--text-muted);
}
</style>
