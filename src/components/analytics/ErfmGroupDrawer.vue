<script setup lang="ts">
// GROUPS header action on the eRFM report: rename the five RFM groups. Every
// section of the report reads these labels, so a save re-labels the matrix axes,
// both tables and the distribution chart at once.
//
// Upstream this drawer's third button is labelled "RESET" but restores
// Maropost's *shipped defaults*, not the values the merchant last saved — so
// using it to undo typing silently destroys their vocabulary, with no
// confirmation. Relabelled "Restore defaults" and gated behind a confirm here
// (approved copy change, logged in IMPROVEMENTS.md).
import { computed, ref, watch } from 'vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpAlert from '@/components/MpAlert.vue'
import {
  ERFM_GROUP_KEYS,
  ERFM_GROUP_DEFAULT_LABELS,
  type ErfmGroupKey,
} from '@/stores/useAnalytics'

const model = defineModel<boolean>({ default: false })

const props = defineProps<{
  /** Currently saved aliases. Snapshotted on open so Cancel and dirty-tracking work. */
  aliases: Record<ErfmGroupKey, string>
}>()

const emit = defineEmits<{ save: [aliases: Record<ErfmGroupKey, string>] }>()

const draft = ref<Record<ErfmGroupKey, string>>({ ...props.aliases })
const saving = ref(false)
const confirmDiscard = ref(false)
const confirmRestore = ref(false)

// Re-snapshot on every open so a cancelled edit never leaks into the next visit.
watch(model, (open) => {
  if (open) {
    draft.value = { ...props.aliases }
    saving.value = false
  }
})

const EMOJI = /\p{Extended_Pictographic}/u

function trimmed(key: ErfmGroupKey): string {
  return (draft.value[key] ?? '').trim()
}

/** Per-field error, or null. Order matches upstream: required → emoji → duplicate. */
function errorFor(key: ErfmGroupKey): string | null {
  const value = trimmed(key)
  if (!value) return 'Group name is required'
  if (EMOJI.test(value)) return 'Emojis aren’t supported in group names'
  const clash = ERFM_GROUP_KEYS.some(
    (other) => other !== key && trimmed(other).toLowerCase() === value.toLowerCase()
  )
  if (clash) return 'Group name already exists'
  return null
}

const errors = computed(
  () => Object.fromEntries(ERFM_GROUP_KEYS.map((k) => [k, errorFor(k)])) as Record<ErfmGroupKey, string | null>
)

const isValid = computed(() => ERFM_GROUP_KEYS.every((k) => errors.value[k] === null))

const isDirty = computed(() => ERFM_GROUP_KEYS.some((k) => trimmed(k) !== (props.aliases[k] ?? '')))

const canSave = computed(() => isDirty.value && isValid.value && !saving.value)

const isDefault = computed(
  () => ERFM_GROUP_KEYS.every((k) => trimmed(k) === ERFM_GROUP_DEFAULT_LABELS[k])
)

function requestClose() {
  if (isDirty.value) confirmDiscard.value = true
  else model.value = false
}

function discard() {
  draft.value = { ...props.aliases }
  model.value = false
}

function restoreDefaults() {
  draft.value = { ...ERFM_GROUP_DEFAULT_LABELS }
}

async function submit() {
  if (!canSave.value) return
  saving.value = true
  // Mocked round-trip so the pending state is walkable end to end.
  await new Promise((resolve) => setTimeout(resolve, 600))
  emit(
    'save',
    Object.fromEntries(ERFM_GROUP_KEYS.map((k) => [k, trimmed(k)])) as Record<ErfmGroupKey, string>
  )
  saving.value = false
  model.value = false
}
</script>

<template>
  <MpFormDrawer
    v-model="model"
    title="Groups"
    subtitle="Rename the five RFM groups to match the language your team uses."
    size="sm"
    guarded
    @close="requestClose"
  >
    <MpAlert tone="info">
      These names appear everywhere this report shows a group — both matrices, the distribution
      chart and the performance tables.
    </MpAlert>

    <MpFormGrid :cols="1">
      <v-text-field
        v-for="key in ERFM_GROUP_KEYS"
        :key="key"
        v-model="draft[key]"
        :label="ERFM_GROUP_DEFAULT_LABELS[key] + ' *'"
        :placeholder="ERFM_GROUP_DEFAULT_LABELS[key]"
        :error-messages="errors[key] ? [errors[key]] : []"
        :disabled="saving"
        counter="40"
        maxlength="40"
      />
    </MpFormGrid>

    <template #footerStart>
      <v-btn
        variant="text"
        class="text-none"
        :disabled="isDefault || saving"
        @click="confirmRestore = true"
      >
        Restore defaults
      </v-btn>
    </template>

    <template #footer>
      <v-btn variant="text" class="text-none" :disabled="saving" @click="requestClose">Cancel</v-btn>
      <v-btn
        variant="flat"
        color="primary"
        class="text-none"
        :loading="saving"
        :disabled="!canSave"
        @click="submit"
      >
        Save
      </v-btn>
    </template>
  </MpFormDrawer>

  <MpConfirmDialog
    v-model="confirmDiscard"
    title="Discard your changes?"
    message="The group names you edited won’t be saved."
    confirm-label="Discard"
    danger
    @confirm="discard"
  />

  <MpConfirmDialog
    v-model="confirmRestore"
    title="Restore the default group names?"
    message="This replaces every name in this drawer with Maropost’s defaults — including names you saved earlier. Nothing is saved until you choose Save."
    confirm-label="Restore defaults"
    @confirm="restoreDefaults"
  />
</template>
