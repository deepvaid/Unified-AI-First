<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import VehicleFitmentDrawer from './VehicleFitmentDrawer.vue'
import { useResponsiveTableHeaders, type ResponsiveHeader } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import {
  addRow, fitmentSummary, listedFitment, removeRows, rowKey, rowName, rowsLabel, searchRows, sortRows, universalFitment,
  yearsLabel,
} from '@/storefront/fitmentForm'
import type { Fitment, FitmentRow } from '@/storefront/fitment'

/**
 * The "Vehicle fitment" card on a part's page in Products: the vehicles the part
 * fits (`detail.fitment`), or Universal fit for a part that fits every vehicle.
 * Rows are added in a drawer and kept in order (make, model, year); the choice is
 * saved with the page's Save, and the storefront reads it from there.
 *
 * The bulk bar and the confirms sit beside the card, not in it: the card is a
 * stacking context, and the next card on the page painted over a bar inside it.
 * Attributes (a class) land on the card.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** The part's fitment; undefined while it lists none. */
  modelValue?: Fitment
  /** The part, named in the Add vehicle drawer. */
  productName?: string
  /** The positions a row can name (the part's Position option, `positionsFor`); none hides Position. */
  positions?: string[]
}>(), { modelValue: undefined, productName: '', positions: () => [] })

const emit = defineEmits<{ 'update:modelValue': [fitment: Fitment] }>()

const toast = useToast()

const universal = computed(() => !!props.modelValue?.universal)
const rows = computed(() => sortRows(props.modelValue?.rows ?? []))
const listing = computed(() => !universal.value && rows.value.length > 0)

// ── Universal fit ─────────────────────────────────────────────────────
const confirmUniversal = ref(false)
/** Re-renders the switch when the confirm is dismissed, so it reads off again. */
const switchKey = ref(0)

function setUniversal(on: boolean | null) {
  if (!on) emit('update:modelValue', listedFitment([]))
  else if (rows.value.length) confirmUniversal.value = true
  else emit('update:modelValue', universalFitment())
}

function makeUniversal() {
  const count = rows.value.length
  selected.value = []
  emit('update:modelValue', universalFitment())
  toast.success(`Universal fit is on. ${rowsLabel(count)} removed.`)
}

watch(confirmUniversal, (isOpen) => {
  if (!isOpen) switchKey.value++
})

// ── The table ─────────────────────────────────────────────────────────
const search = ref('')
const items = computed(() => searchRows(rows.value, search.value).map((row) => ({ ...row, key: rowKey(row) })))

const HEADERS: (ResponsiveHeader & { title: string; key: string })[] = [
  { title: 'Make', key: 'make', sortable: false, hideBelow: 'sm' },
  { title: 'Model', key: 'model', sortable: false },
  { title: 'Years', key: 'years', sortable: false, hideBelow: 'sm' },
  { title: 'Position', key: 'position', sortable: false, hideBelow: 'sm' },
  { title: 'Note', key: 'note', sortable: false, hideBelow: 'lg' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', headerProps: { class: 'mp-th-sr' } },
]
/** Position is a column only for a part sold by position, or one whose rows already name one. */
const positionHidden = computed(() => (!props.positions.length && !rows.value.some((row) => row.position) ? ['position'] : []))
const { visibleHeaders, isVisible } = useResponsiveTableHeaders(HEADERS, positionHidden)
/** On a phone the make, years and position fold into one Vehicle column. */
const headers = computed(() =>
  visibleHeaders.value.map((header) => (header.key === 'model' && !isVisible('make') ? { ...header, title: 'Vehicle' } : header)))

/** What the dropped columns said, folded under the model so it is not lost. */
function foldedLine(row: FitmentRow): string {
  return [
    !isVisible('years') && yearsLabel(row),
    !isVisible('position') && row.position,
    !isVisible('note') && row.note,
  ].filter(Boolean).join(' · ')
}

// ── Selection and removing ────────────────────────────────────────────
const selected = ref<string[]>([])
watch(rows, (list) => {
  const keys = new Set(list.map(rowKey))
  selected.value = selected.value.filter((key) => keys.has(key))
})

function selectAll() {
  selected.value = items.value.map((item) => item.key)
}

const head = ref<HTMLElement | null>(null)
const addButton = ref<{ $el?: HTMLElement } | null>(null)

/** After a removal the button pressed is gone: focus goes to Add vehicle (the empty state's, once nothing is left). */
async function focusAdd() {
  await nextTick()
  const target = addButton.value?.$el ?? head.value?.querySelector<HTMLElement>('button')
  target?.focus()
}

function removeOne(row: FitmentRow) {
  emit('update:modelValue', listedFitment(removeRows(rows.value, [rowKey(row)])))
  toast.success(`Removed ${rowName(row)}`)
  focusAdd()
}

const confirmRemove = ref(false)
const removeTitle = computed(() => `Remove ${rowsLabel(selected.value.length)}?`)
/** True for both cases: some rows left (a vehicle no other row lists reads "Doesn’t fit"), or none (every vehicle reads "Check fit"). */
const removeMessage = computed(() => (selected.value.length >= rows.value.length
  ? 'The part then lists no vehicles, so shoppers see “Check fit” on it until you add one or turn on Universal fit.'
  : 'A shopper whose vehicle no other row lists then sees that the part doesn’t fit.'))

function removeSelected() {
  const count = selected.value.length
  emit('update:modelValue', listedFitment(removeRows(rows.value, selected.value)))
  selected.value = []
  toast.success(`${rowsLabel(count)} removed`)
  focusAdd()
}

// ── Adding ────────────────────────────────────────────────────────────
const adding = ref(false)

function add(row: FitmentRow) {
  emit('update:modelValue', listedFitment(addRow(rows.value, row)))
  search.value = ''
  toast.success(`Added ${rowName(row)}`)
}
</script>

<template>
  <v-card v-bind="$attrs" flat border rounded="lg" class="vfc">
    <div ref="head" class="vfc__head mp-card-inset" :class="{ 'vfc__head--above-table': listing }">
      <MpFormSection
        :heading-level="2"
        title="Vehicle fitment"
        description="The vehicles this part fits. Shoppers see it on the product page and when they shop for their vehicle."
      />
      <v-switch
        :key="switchKey"
        :model-value="universal"
        hide-details
        density="compact"
        label="Universal fit — fits every vehicle"
        @update:model-value="setUniversal"
      />
      <p v-if="universal" class="vfc__note">Shoppers see “Universal fit” on this part, whatever vehicle they choose.</p>
      <MpEmptyState
        v-else-if="!rows.length"
        icon="car"
        :heading-level="3"
        title="No vehicles yet"
        description="Add the vehicles this part fits, so shoppers can tell it fits theirs."
        action-label="Add vehicle"
        action-icon="plus"
        @action="adding = true"
      />
    </div>

    <template v-if="listing">
      <MpDataTableToolbar v-model:search="search" search-placeholder="Search make or model">
        <template #title>
          <span class="mp-meta-label text-medium-emphasis">{{ fitmentSummary(rows) }}</span>
        </template>
        <template #actions>
          <v-btn ref="addButton" variant="outlined" prepend-icon="plus" class="text-none" @click="adding = true">Add vehicle</v-btn>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        item-value="key"
        show-select
        hover
        density="comfortable"
        :items-per-page="-1"
        hide-default-footer
        class="vfc__table"
      >
        <!-- Labelled select boxes (WCAG W-04). aria-checked is dropped: Vuetify's "mixed" is invalid on a native checkbox. -->
        <template #header.data-table-select="{ allSelected, selectAll: toggleAll, someSelected }">
          <v-checkbox-btn
            :model-value="allSelected"
            :indeterminate="someSelected && !allSelected"
            :aria-checked="undefined"
            aria-label="Select all rows"
            @update:model-value="toggleAll(!allSelected)"
          />
        </template>
        <template #item.data-table-select="{ internalItem, isSelected, toggleSelect }">
          <v-checkbox-btn
            :model-value="isSelected(internalItem)"
            :aria-label="`Select ${rowName(internalItem.raw)}`"
            @update:model-value="toggleSelect(internalItem)"
          />
        </template>

        <template #item.make="{ item }">
          <span class="text-no-wrap">{{ item.make }}</span>
        </template>
        <template #item.model="{ item }">
          <div v-if="isVisible('make')" class="text-no-wrap">{{ item.model }}</div>
          <div v-else>{{ item.make }} {{ item.model }}</div>
          <div v-if="foldedLine(item)" class="vfc__folded">{{ foldedLine(item) }}</div>
        </template>
        <template #item.years="{ item }">
          <span class="vfc__years">{{ yearsLabel(item) }}</span>
        </template>
        <template #item.position="{ item }">
          <span :class="{ 'text-medium-emphasis': !item.position }">{{ item.position || '—' }}</span>
        </template>
        <template #item.note="{ item }">
          <span :class="{ 'text-medium-emphasis': !item.note }">{{ item.note || '—' }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            icon="trash-2"
            variant="text"
            size="small"
            :aria-label="`Remove ${rowName(item)}`"
            @click="removeOne(item)"
          />
        </template>

        <template #no-data>
          <MpEmptyState
            icon="search"
            :heading-level="3"
            title="No vehicles match your search"
            description="Search by make or model, like Ford or F-150."
          />
        </template>
      </v-data-table>
    </template>

    <VehicleFitmentDrawer v-model="adding" :rows="rows" :product-name="productName" :positions="positions" @add="add" />
  </v-card>

  <MpFloatingBulkBar :count="selected.length" :total="items.length" @clear="selected = []" @select-all="selectAll">
    <v-btn size="small" variant="flat" color="surface" rounded="lg" prepend-icon="trash-2" class="text-none text-error" @click="confirmRemove = true">
      Remove
    </v-btn>
  </MpFloatingBulkBar>

  <MpConfirmDialog
    v-model="confirmRemove"
    :title="removeTitle"
    :message="removeMessage"
    confirm-label="Remove"
    danger
    @confirm="removeSelected"
  />

  <MpConfirmDialog
    v-model="confirmUniversal"
    title="Make this a universal part?"
    :message="`It fits every vehicle, so the ${rowsLabel(rows.length)} it lists now are removed.`"
    confirm-label="Make universal"
    danger
    @confirm="makeUniversal"
  />
</template>

<style scoped>
.vfc__head {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

/* The toolbar below opens with its own top space. */
.vfc__head--above-table {
  padding-bottom: 0;
}

.vfc__note {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--text-muted);
}

.vfc__folded {
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.vfc__years {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
</style>
