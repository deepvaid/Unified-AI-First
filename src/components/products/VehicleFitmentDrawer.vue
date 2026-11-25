<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import {
  draftErrors, emptyDraft, fitmentMakes, fitmentModels, modelYears, rowFromDraft, NOTE_MAX,
} from '@/storefront/fitmentForm'
import type { FitmentDraft, FitmentDraftErrors } from '@/storefront/fitmentForm'
import type { FitmentRow } from '@/storefront/fitment'

/**
 * Adds a vehicle to a part's fitment: Make, then Model (that make's models), then
 * the first and last year (that model's years), an optional note, and a position
 * when the part is sold by position. A row the part already lists, or one whose
 * years and position meet a listed row of the same model, is refused on the model
 * (src/storefront/fitmentForm.ts).
 */

const open = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  /** The rows the part lists now, to refuse a repeat. */
  rows: FitmentRow[]
  /** The part, named under the title. */
  productName?: string
  /** The positions a row can name; none hides the field. */
  positions?: string[]
}>(), { productName: '', positions: () => [] })

const emit = defineEmits<{ add: [row: FitmentRow] }>()

const draft = ref<FitmentDraft>(emptyDraft())
/** Add was pressed once: from then on every problem shows as it changes. */
const tried = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return
  draft.value = emptyDraft()
  tried.value = false
})

const makes = fitmentMakes()
const models = computed(() => (draft.value.make ? fitmentModels(draft.value.make) : []))
const years = computed(() => modelYears(draft.value.make, draft.value.model))
const yearsTo = computed(() => years.value.filter((year) => draft.value.yearFrom === null || year >= draft.value.yearFrom))

// A choice that changes clears the later ones it no longer allows.
watch(() => draft.value.make, () => {
  if (!models.value.includes(draft.value.model)) draft.value.model = ''
})
watch(years, (list) => {
  if (draft.value.yearFrom !== null && !list.includes(draft.value.yearFrom)) draft.value.yearFrom = null
  if (draft.value.yearTo !== null && !list.includes(draft.value.yearTo)) draft.value.yearTo = null
})
watch(() => draft.value.yearFrom, (from) => {
  if (from !== null && draft.value.yearTo !== null && draft.value.yearTo < from) draft.value.yearTo = null
})

/** The problems shown: all of them once Add was pressed; before that only a note that is too long, as it is typed. */
const errors = computed<FitmentDraftErrors>(() => {
  const all = draftErrors(draft.value, props.rows)
  return tried.value ? all : (all.note ? { note: all.note } : {})
})

const uid = useId()
const FIELDS = ['make', 'model', 'yearFrom', 'yearTo', 'position', 'note'] as const
const fieldId = (field: (typeof FIELDS)[number]) => `${uid}-${field}`
const formId = `${uid}-form`

async function submit() {
  tried.value = true
  const problems = draftErrors(draft.value, props.rows)
  const first = FIELDS.find((field) => problems[field])
  if (first) {
    await nextTick()
    document.getElementById(fieldId(first))?.focus()
    return
  }
  // The row joins the list as the drawer closes: its problems stop showing first, or it would read as its own repeat.
  tried.value = false
  emit('add', rowFromDraft(draft.value))
  open.value = false
}

const subtitle = computed(() => props.productName.trim() || undefined)
</script>

<template>
  <MpFormDrawer v-model="open" title="Add vehicle" :subtitle="subtitle">
    <form :id="formId" class="vfd__form" novalidate @submit.prevent="submit">
      <MpFormGrid :cols="2">
        <v-select
          :id="fieldId('make')"
          v-model="draft.make"
          :items="makes"
          label="Make *"
          :error-messages="errors.make"
          class="mp-form-grid__full"
        />
        <v-select
          :id="fieldId('model')"
          v-model="draft.model"
          :items="models"
          label="Model *"
          :disabled="!draft.make"
          :error-messages="errors.model"
          class="mp-form-grid__full"
        />
        <v-select
          :id="fieldId('yearFrom')"
          v-model="draft.yearFrom"
          :items="years"
          label="Year from *"
          :disabled="!years.length"
          :error-messages="errors.yearFrom"
        />
        <v-select
          :id="fieldId('yearTo')"
          v-model="draft.yearTo"
          :items="yearsTo"
          label="Year to *"
          :disabled="!years.length"
          :error-messages="errors.yearTo"
        />
        <v-select
          v-if="positions.length"
          :id="fieldId('position')"
          :model-value="draft.position || null"
          :items="positions"
          label="Position"
          hint="Leave empty when the part fits either end."
          persistent-hint
          clearable
          :error-messages="errors.position"
          class="mp-form-grid__full"
          @update:model-value="draft.position = $event ?? ''"
        />
        <v-text-field
          :id="fieldId('note')"
          v-model="draft.note"
          label="Note"
          placeholder="Without trailer tow package"
          hint="Shoppers see it beside this vehicle."
          persistent-hint
          :counter="NOTE_MAX"
          :error-messages="errors.note"
          class="mp-form-grid__full"
        />
      </MpFormGrid>
    </form>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="open = false">Cancel</v-btn>
      <v-btn type="submit" :form="formId" color="primary" variant="flat" class="text-none">Add vehicle</v-btn>
    </template>
  </MpFormDrawer>
</template>

<style scoped>
.vfd__form {
  display: contents;
}
</style>
