<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import SizeChartTable from './SizeChartTable.vue'
import {
  canSave, cleanSizeChart, convertRows, hasValuesToConvert, issueList, missingSizes, sizeChartIssues,
} from '@/storefront/sizeChartForm'
import type { SizeChartDraft, SizeChartIssueTarget } from '@/storefront/sizeChartForm'
import { hasMeasurements } from '@/storefront/sizeCharts'
import type { SizeChart, SizeUnit } from '@/storefront/sizeCharts'

/**
 * Creates or edits a size chart (Products › Size charts): its name and store, the
 * unit its numbers are written in, the measurements as an editable grid
 * (SizeChartTable), and the words the size guide shows with it. Saving is the
 * host's job: the drawer checks the chart, then emits `save` with it cleaned up.
 * Closing with unsaved changes asks first.
 */

const open = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  /** An existing chart (it has an id) to edit, or a new chart's starting values. */
  chart: SizeChart | SizeChartDraft
  /** The stores a new chart can go to. An existing chart stays in its own. */
  stores: { id: string; name: string }[]
  /** The other charts, so a name is not used twice in one store. */
  others?: Pick<SizeChart, 'id' | 'name' | 'channelId'>[]
  /** The products that show this chart, with the sizes they sell and where to edit them. */
  usedBy?: { id: number; name: string; sizes: string[]; to?: RouteLocationRaw }[]
}>(), {
  others: () => [],
  usedBy: () => [],
})

const emit = defineEmits<{ save: [chart: SizeChartDraft] }>()

const editing = computed(() => 'id' in props.chart)
const editingId = computed(() => ('id' in props.chart ? props.chart.id : null))

// ── The form ─────────────────────────────────────────────────────────────
const copy = (chart: SizeChartDraft): SizeChartDraft => ({
  channelId: chart.channelId,
  name: chart.name,
  unit: chart.unit,
  columns: [...chart.columns],
  rows: chart.rows.map((row) => ({ size: row.size, values: [...row.values] })),
  fitNote: chart.fitNote,
  howToMeasure: chart.howToMeasure,
})

const form = ref<SizeChartDraft>(copy(props.chart))
const pristine = ref(JSON.stringify(form.value))
const attempted = ref(false)
const unitNote = ref('')

function reset(): void {
  form.value = copy(props.chart)
  pristine.value = JSON.stringify(form.value)
  attempted.value = false
  unitNote.value = ''
}
// Every opening starts from the chart as it is now.
watch(open, (isOpen) => { if (isOpen) reset() })
watch(() => props.chart, () => { if (!open.value) reset() })

const isDirty = computed(() => JSON.stringify(form.value) !== pristine.value)

// ── Store and unit ───────────────────────────────────────────────────────
const storeItems = computed(() => {
  const own = props.stores.some((store) => store.id === form.value.channelId)
  return own ? props.stores : [...props.stores, { id: form.value.channelId, name: form.value.channelId }]
})
/** A chart stays in its store once made; a new one can only go elsewhere when there is somewhere else. */
const storeFixed = computed(() => editing.value || props.stores.length < 2)

const UNIT_WORDS: Record<SizeUnit, string> = { in: 'inches', cm: 'centimeters' }

/**
 * A chart whose every column is a size (socks by shoe size) reads the same in either
 * unit: shoppers see it as written, with no unit switch, so it has no unit to choose.
 */
const sizesOnly = computed(() => form.value.columns.length > 0 && !hasMeasurements(form.value))
const unitItems = computed(() => [
  { value: 'in', label: 'Inches', disabled: sizesOnly.value },
  { value: 'cm', label: 'Centimeters', disabled: sizesOnly.value },
])
const unitHint = computed(() => unitNote.value
  || (sizesOnly.value ? 'This chart has sizes only, so shoppers see it as written.' : 'The unit the measurements are written in. Shoppers can switch.'))

const gridHelp = computed(() => `${sizesOnly.value ? 'Sizes, shown to shoppers as written' : `Body measurements in ${UNIT_WORDS[form.value.unit]}`}. `
  + 'Write a range as 34-36, and a dash (—) for a size a column doesn’t have. The arrow keys move between cells.')

/** The measurements already written are converted, so the chart still measures the same; a column of sizes is kept. */
function setUnit(next: string | null): void {
  if (next !== 'in' && next !== 'cm') return
  const from = form.value.unit
  if (next === from) return
  const { columns, rows } = form.value
  const convert = hasValuesToConvert(columns, rows)
  form.value = { ...form.value, unit: next, rows: convert ? convertRows(rows, from, next, columns) : rows }
  unitNote.value = convert ? `Measurements converted to ${UNIT_WORDS[next]}.` : ''
}

// ── Checking ─────────────────────────────────────────────────────────────
const others = computed(() => props.others.filter((chart) => chart.id !== editingId.value))
const issues = computed(() => sizeChartIssues(form.value, others.value))
const shownIssues = computed(() => (attempted.value ? issues.value : null))
const problems = computed(() => (attempted.value ? issueList(form.value, issues.value) : []))

/** Products whose sizes the chart does not list, while it is being edited. */
const gaps = computed(() => props.usedBy
  .map((product) => ({ name: product.name, sizes: missingSizes(form.value.rows, product.sizes) }))
  .filter((gap) => gap.sizes.length))

/** "XS", "XS and XXL", "XS, XXL and 3XL". */
const andList = (items: string[]): string => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)

// ── Focus ────────────────────────────────────────────────────────────────
const nameField = ref<{ focus: () => void } | null>(null)
const tableRef = ref<InstanceType<typeof SizeChartTable> | null>(null)

function focusProblem(target: SizeChartIssueTarget): void {
  if (target.kind === 'name') nameField.value?.focus()
  else tableRef.value?.focusTarget(target)
}

// ── Save and close ───────────────────────────────────────────────────────
function save(): void {
  attempted.value = true
  if (!canSave(issues.value)) {
    // The summary names every problem; focus goes to the first one.
    void nextTick(() => {
      const first = problems.value[0]
      if (first) focusProblem(first.target)
    })
    return
  }
  emit('save', cleanSizeChart(form.value))
}

const confirmDiscard = ref(false)
function requestClose(): void {
  if (isDirty.value) confirmDiscard.value = true
  else open.value = false
}

function discard(): void {
  open.value = false
}
</script>

<template>
  <MpFormDrawer
    v-model="open"
    :title="editing ? `Edit ${chart.name || 'size chart'}` : 'New size chart'"
    subtitle="Shoppers see it in the size guide on each product that uses it"
    size="lg"
    guarded
    @close="requestClose"
  >
    <MpAlert
      v-if="problems.length"
      tone="error"
      :title="problems.length === 1 ? 'Fix 1 thing to save the chart' : `Fix ${problems.length} things to save the chart`"
      live="polite"
    >
      <ul class="size-chart-drawer__problems">
        <li v-for="(problem, index) in problems.slice(0, 5)" :key="index">
          <button type="button" class="mp-link size-chart-drawer__problem" @click="focusProblem(problem.target)">{{ problem.text }}</button>
        </li>
        <li v-if="problems.length > 5" class="size-chart-drawer__more">and {{ problems.length - 5 }} more, marked in the chart</li>
      </ul>
    </MpAlert>

    <MpFormGrid :cols="2">
      <v-text-field
        ref="nameField"
        v-model="form.name"
        label="Name *"
        placeholder="Women’s tops"
        class="mp-form-grid__full"
        :error-messages="shownIssues?.name"
      />
      <v-select
        v-model="form.channelId"
        :items="storeItems"
        item-title="name"
        item-value="id"
        label="Store"
        :readonly="storeFixed"
        :class="{ 'mp-field-readonly': storeFixed }"
        :hint="editing ? 'A chart stays with the store it was made for.' : undefined"
        persistent-hint
      />
      <MpFormField label="Unit" :hint="unitHint">
        <MpSegmentedControl :model-value="form.unit" :items="unitItems" ariaLabel="Unit" @update:model-value="setUnit" />
      </MpFormField>
    </MpFormGrid>

    <MpFormSection
      title="Measurements"
      :description="gridHelp"
    >
      <SizeChartTable
        ref="tableRef"
        v-model:columns="form.columns"
        v-model:rows="form.rows"
        :unit="form.unit"
        :issues="shownIssues"
      />
      <MpAlert v-if="gaps.length" tone="warning" live="polite" title="Some sizes are not in the chart">
        <ul class="size-chart-drawer__gaps">
          <li v-for="gap in gaps" :key="gap.name">
            {{ gap.name }} sells {{ andList(gap.sizes) }}. Its size guide has no row for {{ gap.sizes.length === 1 ? 'it' : 'them' }}.
          </li>
        </ul>
      </MpAlert>
    </MpFormSection>

    <MpFormSection title="In the size guide">
      <MpFormGrid>
        <v-textarea
          v-model="form.fitNote"
          label="Fit note"
          rows="3"
          auto-grow
          placeholder="Body measurements. Our tops are cut true to size."
          hint="Shown under the chart. Start a sentence with “Between sizes?” to give that advice its own heading."
          persistent-hint
        />
        <v-textarea
          v-model="form.howToMeasure"
          label="How to measure"
          rows="5"
          auto-grow
          placeholder="Chest: around the fullest part, under the arms."
          hint="One line per measurement, starting with its name and a colon."
          persistent-hint
        />
      </MpFormGrid>
    </MpFormSection>

    <MpFormSection
      v-if="editing"
      title="Used by"
      :description="usedBy.length
        ? `${usedBy.length} ${usedBy.length === 1 ? 'product shows' : 'products show'} this chart in the size guide.`
        : 'No product shows this chart yet.'"
    >
      <div v-if="usedBy.length" class="size-chart-drawer__products">
        <MpListRow
          v-for="product in usedBy"
          :key="product.id"
          variant="divided"
          :title="product.name"
          :subtitle="product.sizes.length ? `Sizes ${product.sizes.join(' · ')}` : undefined"
          :to="product.to"
        >
          <template v-if="product.to" #trailing><v-icon icon="chevron-right" size="16" aria-hidden="true" /></template>
        </MpListRow>
      </div>
    </MpFormSection>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="requestClose">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="save">
        {{ editing ? 'Save chart' : 'Create chart' }}
      </v-btn>
    </template>
  </MpFormDrawer>

  <MpConfirmDialog
    v-model="confirmDiscard"
    title="Discard changes?"
    message="This size chart has unsaved changes. Closing now will discard them."
    confirm-label="Discard"
    cancel-label="Keep editing"
    danger
    @confirm="discard"
  />
</template>

<style scoped>
.size-chart-drawer__problems,
.size-chart-drawer__gaps {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  margin: 0;
  padding-inline-start: var(--mp-space-20);
}

/* A problem in the summary takes focus to its field: a button that reads as a link. */
.size-chart-drawer__problem {
  padding: 0;
  border: 0;
  background: none;
  text-align: start;
  cursor: pointer;
  font: inherit;
}

.size-chart-drawer__more {
  list-style: none;
  margin-inline-start: calc(var(--mp-space-20) * -1);
}

.size-chart-drawer__products {
  display: flex;
  flex-direction: column;
}
</style>
