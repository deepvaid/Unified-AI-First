<script setup lang="ts">
import { computed } from 'vue'
import MpListRow from '@/components/MpListRow.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { METHOD_STATUS_LABELS } from '@/maropay/model'
import type { MethodStatus, PaymentMethodCatalogEntry } from '@/maropay/model'

// One payment method on one store: its rate, what it needs, and the switch that
// offers it at checkout. A method that needs a review opens its requirements
// instead of switching on; one awaiting approval stays switched on but isn't
// shown to shoppers until our payments partner approves it.

const props = withDefaults(defineProps<{
  method: PaymentMethodCatalogEntry & { status: MethodStatus }
  /** Why the merchant can't change this method (their role, a live store's last method). Disables the controls and says why. */
  disabledReason?: string | null
}>(), {
  disabledReason: null,
})

const emit = defineEmits<{
  toggle: [enabled: boolean]
  /** A method that needs a review was chosen — open its requirements. */
  setup: []
}>()

const on = computed(() => props.method.status === 'enabled' || props.method.status === 'pending_approval')

/** The switch already says on or off; the chip carries only what a switch can't. */
const chip = computed(() => {
  const status = props.method.status
  return status === 'setup_required' || status === 'pending_approval' || status === 'unavailable' ? METHOD_STATUS_LABELS[status] : null
})

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

const detail = computed(() => {
  const m = props.method
  const notes = [m.rate.label]
  if (m.status === 'setup_required' && m.requirements.length) notes.push(`Needs a short review: ${m.requirements.map(lowerFirst).join(' and ')}`)
  else if (m.reviewNote && (m.status === 'pending_approval' || m.status === 'unavailable')) notes.push(m.reviewNote)
  if (m.delayed) notes.push('Confirmation can take a few business days')
  if (!m.supportsManualCapture) notes.push('Automatic capture only')
  return notes.join(' · ')
})
</script>

<template>
  <MpListRow variant="divided">
    <span class="maropay-method__title">{{ method.label }}</span>
    <span class="maropay-method__detail">{{ detail }}</span>
    <template #trailing>
      <span class="maropay-method__controls">
        <MpStatusChip v-if="chip" :status="chip" type="method" size="sm" />
        <v-tooltip v-if="method.status !== 'unavailable'" :disabled="!disabledReason" :text="disabledReason ?? ''" location="top">
          <template #activator="{ props: tip }">
            <!-- Disabled controls swallow pointer events, so the tooltip hangs off a wrapper. -->
            <span v-bind="tip" class="d-inline-flex">
              <v-btn
                v-if="method.status === 'setup_required'"
                size="small"
                variant="outlined"
                class="text-none"
                :disabled="!!disabledReason"
                @click="emit('setup')"
              >
                Set up
              </v-btn>
              <v-switch
                v-else
                :model-value="on"
                :disabled="!!disabledReason"
                :aria-label="`Offer ${method.label} at checkout`"
                @update:model-value="emit('toggle', Boolean($event))"
              />
            </span>
          </template>
        </v-tooltip>
      </span>
    </template>
  </MpListRow>
</template>

<style scoped>
.maropay-method__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: var(--mp-lineHeight-snug);
  color: var(--text-primary);
}

.maropay-method__detail {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}

.maropay-method__controls {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-12);
}
</style>
