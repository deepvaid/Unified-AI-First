<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { useToast } from '@/composables/useToast'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import {
  SLA_MIN_MINUTES,
  formatSla,
  fromMinutes,
  slaError,
  toMinutes,
  type AssignmentStrategy,
  type Inbox,
  type SlaUnit,
} from '@/service/model'

const props = defineProps<{ inbox: Inbox }>()
const emit = defineEmits<{ dirty: [dirty: boolean] }>()

const settings = useServiceSettingsStore()
const toast = useToast()

const ASSIGNMENT_OPTIONS: { value: AssignmentStrategy; title: string; description: string }[] = [
  { value: 'manual', title: 'Manual', description: 'New tickets stay unassigned until an agent picks them up or someone assigns them.' },
  { value: 'round-robin', title: 'Round robin', description: 'New tickets are shared out in turn across the agents of this inbox.' },
]
const UNIT_OPTIONS: { value: SlaUnit; title: string }[] = [
  { value: 'minutes', title: 'Minutes' },
  { value: 'hours', title: 'Hours' },
]

const saved = () => {
  const sla = props.inbox.slaMinutes
  const { value, unit } = sla === null ? { value: 4, unit: 'hours' as SlaUnit } : fromMinutes(sla)
  return { assignment: props.inbox.assignment, slaOn: sla !== null, slaValue: value as number | null, slaUnit: unit }
}
const draft = reactive(saved())

const minutes = computed(() =>
  draft.slaOn ? toMinutes(Number(draft.slaValue ?? Number.NaN), draft.slaUnit) : null,
)
const error = computed(() => slaError(minutes.value))

const isDirty = computed(() => {
  const s = saved()
  if (draft.assignment !== s.assignment || draft.slaOn !== s.slaOn) return true
  return draft.slaOn && minutes.value !== props.inbox.slaMinutes
})
watch(isDirty, value => emit('dirty', value), { immediate: true })

function discard() {
  Object.assign(draft, saved())
}
function save() {
  if (error.value) return
  settings.updateInbox(props.inbox.id, { assignment: draft.assignment, slaMinutes: minutes.value })
  Object.assign(draft, saved())
  toast.success(`Assignment and SLA saved — ${formatSla(minutes.value)}`)
}
</script>

<template>
  <v-card flat border rounded="lg" class="mp-card-inset">
    <MpFormSection title="Assignment" description="Who picks up a new ticket when it arrives in this inbox." />
    <v-radio-group v-model="draft.assignment" label="Assign new tickets" class="routing-radios">
      <v-radio v-for="option in ASSIGNMENT_OPTIONS" :key="option.value" :value="option.value">
        <template #label>
          <span class="d-flex flex-column">
            <span class="text-body-2 font-weight-medium">{{ option.title }}</span>
            <span class="text-caption text-medium-emphasis">{{ option.description }}</span>
          </span>
        </template>
      </v-radio>
    </v-radio-group>

    <MpFormSection
      title="SLA"
      :description="`How long a ticket can wait before it breaches, from when it was created. Agents are warned about an hour before, so the minimum is ${SLA_MIN_MINUTES} minutes.`"
    />
    <MpFormGrid :cols="2">
      <v-switch v-model="draft.slaOn" label="Track an SLA for this inbox" inset class="mp-form-grid__full"></v-switch>
      <template v-if="draft.slaOn">
        <v-text-field
          v-model.number="draft.slaValue"
          label="Breach time *"
          type="number"
          min="1"
          :error-messages="error"
          :hint="error ? '' : `Breaches ${formatSla(minutes)} after a ticket is created.`"
          persistent-hint
        ></v-text-field>
        <v-select v-model="draft.slaUnit" :items="UNIT_OPTIONS" label="Unit"></v-select>
      </template>
    </MpFormGrid>

    <div class="inbox-tab__actions d-flex justify-end ga-2">
      <v-btn variant="text" class="text-none" :disabled="!isDirty" @click="discard">Discard</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!isDirty || !!error" @click="save">Save changes</v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.inbox-tab__actions {
  margin-top: var(--mp-component-field-sectionGap);
}

/* Two-line radio labels: keep the dot on the title line. */
.routing-radios :deep(.v-selection-control) {
  align-items: flex-start;
}
.routing-radios :deep(.v-selection-control + .v-selection-control) {
  margin-top: var(--mp-space-8);
}
</style>
