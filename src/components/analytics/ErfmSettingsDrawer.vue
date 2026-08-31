<script setup lang="ts">
// SETTINGS header action on the eRFM report: the R / F / M scoring thresholds.
//
// RECONSTRUCTED, not observed. Upstream's `fetchERFMSettings` never resolved
// during the crawl (degraded UAT backend), so the drawer rendered three empty
// sections. What *is* confirmed is the model shape and every validation message;
// what is inferred is the field labels, their order, their units, and the
// direction of the ordering rules. All of that is flagged in PARITY.md.
//
// Three upstream messages were rewritten under the approved copy change — they
// read "value must be greater value of score of 2", "value must be less than
// value of scores of 3" and "value must be greater than the values of score of 2
// and score of 3". Nothing in the UI is labelled "score of 2", and the grammar
// made the direction unrecoverable; these name the sibling field instead.
import { computed, ref, watch } from 'vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { ERFM_MAX_RECENCY_DAYS, type ErfmSettings } from '@/stores/useAnalytics'

const model = defineModel<boolean>({ default: false })

const props = defineProps<{ settings: ErfmSettings }>()

const emit = defineEmits<{ save: [settings: ErfmSettings] }>()

type Draft = {
  highestScoreDays: string
  averageScoreDays: string
  lowestScoreDays: string
  mostFrequent: string
  averagelyFrequent: string
  highestSpender: string
  averageSpender: string
}

function toDraft(s: ErfmSettings): Draft {
  const str = (v: number | null) => (v == null ? '' : String(v))
  return {
    highestScoreDays: str(s.recency.highestScoreDays),
    averageScoreDays: str(s.recency.averageScoreDays),
    lowestScoreDays: str(s.recency.lowestScoreDays),
    mostFrequent: str(s.frequency.mostFrequent),
    averagelyFrequent: str(s.frequency.averagelyFrequent),
    highestSpender: str(s.monetary.highestSpender),
    averageSpender: str(s.monetary.averageSpender),
  }
}

const draft = ref<Draft>(toDraft(props.settings))
const acknowledged = ref(false)
const saving = ref(false)
// Panel `value`s are strings, so the model has to hold strings — seeding it with
// numbers matches nothing and every section renders collapsed and empty.
const openPanels = ref(['recency', 'frequency', 'monetary'])
const confirmDiscard = ref(false)

// Re-snapshot on open; the acknowledgement is deliberately not sticky — each
// visit re-consents, because each Apply triggers a fresh recalculation.
watch(model, (open) => {
  if (open) {
    draft.value = toDraft(props.settings)
    acknowledged.value = false
    saving.value = false
    openPanels.value = ['recency', 'frequency', 'monetary']
  }
})

const num = (v: string): number | null => {
  const t = v.trim()
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** Upstream's four numeric messages, in upstream's order of precedence. */
function baseNumberError(v: string): string | null {
  const t = v.trim()
  if (!t) return 'Value is required'
  const n = Number(t)
  if (!Number.isFinite(n)) return 'Enter a valid number'
  if (n < 0) return 'Only positive numbers are allowed'
  if (n === 0) return 'Enter a value greater than 0'
  return null
}

function recencyError(v: string, bound: 'highest' | 'average' | 'lowest'): string | null {
  const base = baseNumberError(v)
  if (base) return base
  const n = num(v)!
  if (n > ERFM_MAX_RECENCY_DAYS) return `Recency days can’t exceed ${ERFM_MAX_RECENCY_DAYS}`

  const high = num(draft.value.highestScoreDays)
  const avg = num(draft.value.averageScoreDays)
  const low = num(draft.value.lowestScoreDays)

  // Fewer days since purchase earns a better score, so the three bands run
  // highest < average < lowest in days.
  if (bound === 'highest' && avg != null && n >= avg) return 'Must be fewer days than the average-score band'
  if (bound === 'average') {
    if (high != null && n <= high) return 'Must be more days than the highest-score band'
    if (low != null && n >= low) return 'Must be fewer days than the lowest-score band'
  }
  if (bound === 'lowest' && avg != null && n <= avg) return 'Must be more days than the average-score band'
  return null
}

function pairError(v: string, other: string, side: 'upper' | 'lower', label: string): string | null {
  const base = baseNumberError(v)
  if (base) return base
  const n = num(v)!
  const o = num(other)
  if (o == null) return null
  if (side === 'upper' && n <= o) return `Must be higher than ${label}`
  if (side === 'lower' && n >= o) return `Must be lower than ${label}`
  return null
}

const errors = computed(() => ({
  highestScoreDays: recencyError(draft.value.highestScoreDays, 'highest'),
  averageScoreDays: recencyError(draft.value.averageScoreDays, 'average'),
  lowestScoreDays: recencyError(draft.value.lowestScoreDays, 'lowest'),
  mostFrequent: pairError(draft.value.mostFrequent, draft.value.averagelyFrequent, 'upper', 'the average-frequency band'),
  averagelyFrequent: pairError(draft.value.averagelyFrequent, draft.value.mostFrequent, 'lower', 'the most-frequent band'),
  highestSpender: pairError(draft.value.highestSpender, draft.value.averageSpender, 'upper', 'the average-spender band'),
  averageSpender: pairError(draft.value.averageSpender, draft.value.highestSpender, 'lower', 'the highest-spender band'),
}))

const isValid = computed(() => Object.values(errors.value).every((e) => e === null))

const isDirty = computed(() => {
  const original = toDraft(props.settings)
  return (Object.keys(original) as (keyof Draft)[]).some(
    (k) => draft.value[k].trim() !== original[k]
  )
})

const canApply = computed(() => isDirty.value && isValid.value && acknowledged.value && !saving.value)

function msg(key: keyof Draft): string[] {
  const e = errors.value[key]
  return e ? [e] : []
}

function requestClose() {
  if (isDirty.value) confirmDiscard.value = true
  else model.value = false
}

function discard() {
  draft.value = toDraft(props.settings)
  model.value = false
}

async function apply() {
  if (!canApply.value) return
  saving.value = true
  await new Promise((resolve) => setTimeout(resolve, 700))
  emit('save', {
    recency: {
      highestScoreDays: num(draft.value.highestScoreDays),
      averageScoreDays: num(draft.value.averageScoreDays),
      lowestScoreDays: num(draft.value.lowestScoreDays),
    },
    frequency: {
      mostFrequent: num(draft.value.mostFrequent),
      averagelyFrequent: num(draft.value.averagelyFrequent),
    },
    monetary: {
      highestSpender: num(draft.value.highestSpender),
      averageSpender: num(draft.value.averageSpender),
    },
  })
  saving.value = false
  model.value = false
}
</script>

<template>
  <MpFormDrawer
    v-model="model"
    title="RFM settings"
    subtitle="Set the thresholds that score recency, frequency and monetary value."
    size="md"
    guarded
    @close="requestClose"
  >
    <!-- Upstream uses this whole paragraph as a checkbox label. Split here: the
         warning is an alert, the checkbox gets a name a screen reader can use. -->
    <MpAlert tone="warning" title="Changing these definitions recalculates the report">
      The matrix is recalculated for the current 90-day period using your updated definitions.
      Historical RFM data keeps the definitions that were active at the time, so data saved under
      different criteria can’t be combined into a single chart.
    </MpAlert>

    <v-expansion-panels v-model="openPanels" multiple variant="accordion" class="erfm-settings__panels">
      <v-expansion-panel value="recency">
        <v-expansion-panel-title>Recency definitions</v-expansion-panel-title>
        <v-expansion-panel-text>
          <MpFormGrid :cols="1">
            <v-text-field
              v-model="draft.highestScoreDays"
              label="Highest score — days since purchase *"
              placeholder="30"
              suffix="days"
              :error-messages="msg('highestScoreDays')"
              :disabled="saving"
            />
            <v-text-field
              v-model="draft.averageScoreDays"
              label="Average score — days since purchase *"
              placeholder="90"
              suffix="days"
              :error-messages="msg('averageScoreDays')"
              :disabled="saving"
            />
            <v-text-field
              v-model="draft.lowestScoreDays"
              label="Lowest score — days since purchase *"
              placeholder="180"
              suffix="days"
              :error-messages="msg('lowestScoreDays')"
              :disabled="saving"
            />
          </MpFormGrid>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="frequency">
        <v-expansion-panel-title>Frequency definitions</v-expansion-panel-title>
        <v-expansion-panel-text>
          <MpFormGrid :cols="1">
            <v-text-field
              v-model="draft.mostFrequent"
              label="Most frequent — orders *"
              placeholder="6"
              suffix="orders"
              :error-messages="msg('mostFrequent')"
              :disabled="saving"
            />
            <v-text-field
              v-model="draft.averagelyFrequent"
              label="Averagely frequent — orders *"
              placeholder="3"
              suffix="orders"
              :error-messages="msg('averagelyFrequent')"
              :disabled="saving"
            />
          </MpFormGrid>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="monetary">
        <v-expansion-panel-title>Monetary definitions</v-expansion-panel-title>
        <v-expansion-panel-text>
          <MpFormGrid :cols="1">
            <v-text-field
              v-model="draft.highestSpender"
              label="Highest spender — lifetime value *"
              placeholder="1000"
              prefix="$"
              :error-messages="msg('highestSpender')"
              :disabled="saving"
            />
            <v-text-field
              v-model="draft.averageSpender"
              label="Average spender — lifetime value *"
              placeholder="250"
              prefix="$"
              :error-messages="msg('averageSpender')"
              :disabled="saving"
            />
          </MpFormGrid>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-checkbox
      v-model="acknowledged"
      :disabled="saving"
      label="I understand the report will be recalculated"
      hide-details
    />

    <template #footer>
      <v-btn variant="text" class="text-none" :disabled="saving" @click="requestClose">Cancel</v-btn>
      <v-btn
        variant="flat"
        color="primary"
        class="text-none"
        :loading="saving"
        :disabled="!canApply"
        @click="apply"
      >
        Apply
      </v-btn>
    </template>
  </MpFormDrawer>

  <MpConfirmDialog
    v-model="confirmDiscard"
    title="Discard your changes?"
    message="The threshold changes you made won’t be applied."
    confirm-label="Discard"
    danger
    @confirm="discard"
  />
</template>

<style scoped>
.erfm-settings__panels {
  border-radius: var(--mp-component-card-radius);
}
</style>
