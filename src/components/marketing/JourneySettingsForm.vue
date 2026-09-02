<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { EMOJI_RE } from '@/stores/journeyTemplateSetup'

/**
 * The "Journey settings" form shared by the from-scratch page and step 1 of
 * the template wizard (production reuses one component the same way):
 * name · optional end date + time · Enable · Retrigger.
 *
 * Validity is reported live through `update:valid`; `validate()` forces the
 * messages to show (Next / Create attempt on an untouched form).
 */
export interface JourneySettingsValue {
  name: string
  endDate: string
  endTime: string
  enabled: boolean
  retrigger: boolean
}

const props = withDefaults(defineProps<{
  modelValue: JourneySettingsValue
  /** Names already taken — the field errors inline instead of production's vanishing toast. */
  existingNames?: string[]
}>(), {
  existingNames: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: JourneySettingsValue]
  'update:valid': [valid: boolean]
}>()

const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

function patch(part: Partial<JourneySettingsValue>) {
  emit('update:modelValue', { ...props.modelValue, ...part })
}

// ── Name ────────────────────────────────────────────────────────────────────
const taken = computed(() => new Set(props.existingNames.map(n => n.trim().toLowerCase())))
const nameRules = [
  (v: string) => !!v?.trim() || 'Journey name is required',
  (v: string) => !EMOJI_RE.test(v ?? '') || 'You cannot use emojis in this field.',
  (v: string) => !taken.value.has((v ?? '').trim().toLowerCase()) || 'Name has already been taken',
]
const nameValid = computed(() => nameRules.every(r => r(props.modelValue.name) === true))

// ── End date + time ─────────────────────────────────────────────────────────
// Production pairs a date picker (min = today) with 96 fifteen-minute slots;
// slots already past are disabled when the chosen date is today. Picking one
// half auto-fills the other; clearing one clears both.
const today = computed(() => localDate(new Date()))

function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function slotLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60)
  const m = minutes % 60
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

const timeSlots = computed(() => {
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const isToday = props.modelValue.endDate === today.value
  return Array.from({ length: 96 }, (_, i) => {
    const minutes = i * 15
    const label = slotLabel(minutes)
    return { title: label, value: label, props: { disabled: isToday && minutes <= nowMinutes } }
  })
})

const firstOpenSlot = computed(() => timeSlots.value.find(s => !s.props.disabled)?.value ?? '')

const endInPast = computed(() => {
  const { endDate, endTime } = props.modelValue
  if (!endDate || !endTime) return false
  return new Date(`${endDate} ${endTime}`.replace(/-/g, '/')).getTime() < Date.now()
})

watch(() => props.modelValue.endDate, (date, prev) => {
  if (date && !prev && !props.modelValue.endTime) patch({ endTime: firstOpenSlot.value })
  if (!date && prev && props.modelValue.endTime) patch({ endTime: '' })
})
watch(() => props.modelValue.endTime, (time, prev) => {
  if (time && !prev && !props.modelValue.endDate) patch({ endDate: today.value })
  if (!time && prev && props.modelValue.endDate) patch({ endDate: '' })
})

const timeRules = [() => !endInPast.value || 'Selected time is earlier than the current time']

const isValid = computed(() => nameValid.value && !endInPast.value)
watch(isValid, v => emit('update:valid', v), { immediate: true })

async function validate(): Promise<boolean> {
  const res = await form.value?.validate()
  return (res?.valid ?? false) && isValid.value
}
defineExpose({ validate })
</script>

<template>
  <v-form ref="form" @submit.prevent>
    <MpFormGrid :cols="2">
      <v-text-field
        class="mp-form-grid__full"
        :model-value="modelValue.name"
        label="Journey name *"
        placeholder="e.g. Welcome series"
        autofocus
        :rules="nameRules"
        @update:model-value="patch({ name: $event })"
      />

      <v-text-field
        :model-value="modelValue.endDate"
        label="End date"
        type="date"
        :min="today"
        clearable
        hint="Optionally set an end date for the journey to be disabled. All contacts in the journey will be paused."
        persistent-hint
        @update:model-value="patch({ endDate: $event ?? '' })"
      />
      <v-select
        :model-value="modelValue.endTime || null"
        label="End time"
        :items="timeSlots"
        clearable
        prepend-inner-icon="clock"
        :rules="timeRules"
        @update:model-value="patch({ endTime: $event ?? '' })"
      />

      <v-checkbox
        class="mp-form-grid__full"
        :model-value="modelValue.enabled"
        label="Enable journey"
        hint="Activate if you want to enable the journey at creation. You must include all the necessary content in the journey to enable after editing. When you finish, the journey is live."
        persistent-hint
        @update:model-value="patch({ enabled: !!$event })"
      />
      <v-checkbox
        class="mp-form-grid__full"
        :model-value="modelValue.retrigger"
        label="Retrigger journey"
        hint="Contacts who have already completed the journey can re-enter and start it again if they match the trigger criteria. A contact already in the journey cannot re-enter until they are finished."
        persistent-hint
        @update:model-value="patch({ retrigger: !!$event })"
      />
    </MpFormGrid>
  </v-form>
</template>
