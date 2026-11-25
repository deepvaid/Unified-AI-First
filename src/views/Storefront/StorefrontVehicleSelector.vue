<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { makesFor, modelsFor, yearsOf } from '@/storefront/fitment'
import type { Vehicle } from '@/storefront/fitment'

// The shopper's vehicle, chosen Year, then Make, then Model: three native selects
// with visible labels, each later one disabled until the one before it is chosen.
// Changing the year keeps the make and model while that year still offers them.
// The submit button is never disabled: pressed with something missing, it says
// what under that select ("Choose a model") and moves focus there.
//
// It only chooses. Its parent decides what choosing does: the vehicle drawer saves
// the vehicle (`submit`) or forgets it (`clear`, shown with `clearable`); the home
// page's vehicle finder saves it and opens the parts. `layout="row"` puts the
// selects and the button side by side (the finder, on a wide screen).

const props = withDefaults(defineProps<{
  /** The vehicle chosen so far: the selects start on it. */
  vehicle?: Vehicle | null
  submitLabel?: string
  /** Offers "Clear vehicle" while a vehicle is chosen. */
  clearable?: boolean
  layout?: 'stack' | 'row'
}>(), {
  vehicle: null,
  submitLabel: 'Save vehicle',
  clearable: false,
  layout: 'stack',
})

const emit = defineEmits<{
  submit: [vehicle: Vehicle]
  clear: []
}>()

const id = useId()
const year = ref(props.vehicle ? String(props.vehicle.year) : '')
const make = ref(props.vehicle?.make ?? '')
const model = ref(props.vehicle?.model ?? '')

watch(() => props.vehicle, (vehicle) => {
  year.value = vehicle ? String(vehicle.year) : ''
  make.value = vehicle?.make ?? ''
  model.value = vehicle?.model ?? ''
})

const years = yearsOf()
const makes = computed(() => (year.value ? makesFor(Number(year.value)) : []))
const models = computed(() => (year.value && make.value ? modelsFor(Number(year.value), make.value) : []))

// A make or model the new year (or make) doesn't offer is let go.
watch(makes, (list) => { if (!list.includes(make.value)) make.value = '' })
watch(models, (list) => { if (!list.includes(model.value)) model.value = '' })

type Field = 'year' | 'make' | 'model'
const missing = ref<Field | null>(null)
watch([year, make, model], () => { missing.value = null })

const ERRORS: Record<Field, string> = { year: 'Choose a year', make: 'Choose a make', model: 'Choose a model' }
const yearSelect = ref<HTMLSelectElement | null>(null)
const makeSelect = ref<HTMLSelectElement | null>(null)
const modelSelect = ref<HTMLSelectElement | null>(null)
const selects: Record<Field, typeof yearSelect> = { year: yearSelect, make: makeSelect, model: modelSelect }

function onSubmit(): void {
  const first: Field | null = !year.value ? 'year' : !make.value ? 'make' : !model.value ? 'model' : null
  if (first) {
    missing.value = first
    void nextTick(() => selects[first].value?.focus())
    return
  }
  emit('submit', { year: Number(year.value), make: make.value, model: model.value })
}

const chosen = computed(() => props.vehicle !== null)
</script>

<template>
  <form class="sf-vs" :class="`sf-vs--${layout}`" novalidate @submit.prevent="onSubmit">
    <div class="sf-vs__fields">
      <div class="sf-vs__field">
        <label :for="`${id}-year`" class="sf-vs__label">Year</label>
        <div class="sf-vs__control">
          <select
            :id="`${id}-year`"
            ref="yearSelect"
            v-model="year"
            class="sf-vs__select"
            :aria-invalid="missing === 'year' ? 'true' : undefined"
            :aria-describedby="missing === 'year' ? `${id}-error` : undefined"
          >
            <option value="">Select year</option>
            <option v-for="y in years" :key="y" :value="String(y)">{{ y }}</option>
          </select>
          <v-icon class="sf-vs__chevron" size="18" aria-hidden="true">chevron-down</v-icon>
        </div>
        <p v-if="missing === 'year'" :id="`${id}-error`" class="sf-vs__error">{{ ERRORS.year }}</p>
      </div>

      <div class="sf-vs__field">
        <label :for="`${id}-make`" class="sf-vs__label">Make</label>
        <div class="sf-vs__control">
          <select
            :id="`${id}-make`"
            ref="makeSelect"
            v-model="make"
            class="sf-vs__select"
            :disabled="!year"
            :aria-invalid="missing === 'make' ? 'true' : undefined"
            :aria-describedby="missing === 'make' ? `${id}-error` : undefined"
          >
            <option value="">Select make</option>
            <option v-for="m in makes" :key="m" :value="m">{{ m }}</option>
          </select>
          <v-icon class="sf-vs__chevron" size="18" aria-hidden="true">chevron-down</v-icon>
        </div>
        <p v-if="missing === 'make'" :id="`${id}-error`" class="sf-vs__error">{{ ERRORS.make }}</p>
      </div>

      <div class="sf-vs__field">
        <label :for="`${id}-model`" class="sf-vs__label">Model</label>
        <div class="sf-vs__control">
          <select
            :id="`${id}-model`"
            ref="modelSelect"
            v-model="model"
            class="sf-vs__select"
            :disabled="!make"
            :aria-invalid="missing === 'model' ? 'true' : undefined"
            :aria-describedby="missing === 'model' ? `${id}-error` : undefined"
          >
            <option value="">Select model</option>
            <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
          </select>
          <v-icon class="sf-vs__chevron" size="18" aria-hidden="true">chevron-down</v-icon>
        </div>
        <p v-if="missing === 'model'" :id="`${id}-error`" class="sf-vs__error">{{ ERRORS.model }}</p>
      </div>
    </div>

    <div class="sf-vs__actions">
      <button type="submit" class="sf-vs__submit">{{ submitLabel }}</button>
      <button v-if="clearable && chosen" type="button" class="sf-vs__clear" @click="emit('clear')">Clear vehicle</button>
    </div>
  </form>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────────
 * P4-8 — out of system on purpose: see StorefrontLayout.vue. Colours, fonts and
 * corners are the store's theme (--sf-*); the selects' outline is its muted ink
 * (4.5:1 on the page), so a field's edge always shows. Targets are 48px tall.
 * ───────────────────────────────────────────────────────────────────────────── */
.sf-vs {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: var(--sf-text, #121011);
}

.sf-vs__fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sf-vs__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.sf-vs__label {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.sf-vs__control {
  position: relative;
}

.sf-vs__select {
  box-sizing: border-box;
  width: 100%;
  height: 48px;
  padding: 0 40px 0 14px;
  border: 1px solid var(--sf-muted, #66625c);
  border-radius: var(--sf-radius, 4px);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
  appearance: none;
  cursor: pointer;
}

.sf-vs__select:focus-visible {
  outline: 2px solid var(--sf-text, #121011);
  outline-offset: 1px;
}

.sf-vs__select:disabled {
  border-style: dashed;
  background: var(--sf-surface, #f2f3f5);
  color: var(--sf-muted, #66625c);
  cursor: not-allowed;
}

.sf-vs__select[aria-invalid='true'] {
  border: 2px solid #b3261e;
}

.sf-vs__chevron {
  position: absolute;
  top: 50%;
  right: 14px;
  color: inherit;
  transform: translateY(-50%);
  pointer-events: none;
}

/* #b3261e: 6.5:1 on white, 5.9:1 on #f2f3f5. */
.sf-vs__error {
  margin: 0;
  color: #b3261e;
  font-size: 14px;
  line-height: 20px;
}

.sf-vs__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
}

.sf-vs__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 28px;
  border: 1px solid var(--sf-button-border, transparent);
  border-radius: var(--sf-button-radius, var(--sf-radius, 4px));
  background: var(--sf-button-bg, var(--sf-brand, #121011));
  color: var(--sf-button-ink, var(--sf-on-brand, #ffffff));
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.sf-vs__submit:hover {
  filter: brightness(0.95);
}

.sf-vs__submit:focus-visible,
.sf-vs__clear:focus-visible {
  outline: 2px solid var(--sf-text, #121011);
  outline-offset: 2px;
}

.sf-vs__clear {
  min-height: 44px;
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 15px;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.sf-vs--stack .sf-vs__submit {
  flex: 1 1 100%;
}

/* A row: three selects and the button side by side, the button on the selects' line. */
.sf-vs--row {
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
}

.sf-vs--row .sf-vs__fields {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 12px;
}

.sf-vs--row .sf-vs__actions {
  flex: none;
  padding-top: 26px;
}

@media (max-width: 760px) {
  .sf-vs--row {
    flex-direction: column;
    align-items: stretch;
  }

  .sf-vs--row .sf-vs__fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .sf-vs--row .sf-vs__actions {
    padding-top: 0;
  }

  .sf-vs--row .sf-vs__submit {
    flex: 1 1 100%;
  }
}
</style>
