<script setup lang="ts">
import { computed } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpListRow from '@/components/MpListRow.vue'
import MaropayMethodMark from '@/components/maropay/MaropayMethodMark.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { markFor } from '@/maropay/methodMarks'
import { connectionOf, connectionOfferedMethods, platformFeeLine, providerLabel } from '@/maropay/providers'
import type { OwnProviderKind } from '@/maropay/providers'

// Configure one of the merchant's own providers (PayPal, Stripe, eWay, Afterpay,
// Zip): its connection — a stub where production signs in with the provider —
// and whether it's offered at checkout, with what it takes and the fee line.

const model = defineModel<boolean>({ default: false })

const props = defineProps<{
  channelId: string
  kind: OwnProviderKind | null
}>()

const maropay = useMaropayStore()
const toast = useToast()

const setup = computed(() => maropay.storeProvidersFor(props.channelId))
const connection = computed(() => (props.kind ? connectionOf(setup.value, props.kind) : null))
const name = computed(() => (props.kind ? providerLabel(props.kind) : ''))
const canManage = computed(() => maropay.can('manage_methods', props.channelId))
const connected = computed(() => connection.value?.status !== 'setup_incomplete')
const offered = computed(() => (connection.value ? connectionOfferedMethods(connection.value, setup.value) : []))
/** Methods an active connection has but doesn't offer — cards and wallets the store's card processor took. */
const hidden = computed(() => (connection.value?.status === 'active' ? connection.value.methods.filter((m) => !offered.value.includes(m)) : []))

function setStatus(status: 'active' | 'inactive'): void {
  if (!props.kind) return
  // Read before the change lands: `connected` follows the store.
  const connecting = status === 'active' && !connected.value
  const result = maropay.setProviderStatus(props.channelId, props.kind, status)
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  if (connecting) toast.success(`Connected to ${name.value}. In production this opens ${name.value}’s sign-in.`)
  else toast.success(status === 'active' ? `${name.value} is on at checkout.` : `${name.value} is off at checkout.`)
}
</script>

<template>
  <MpFormDrawer v-model="model" :title="`Configure ${name}`" :subtitle="`${name} is your own account; Maropost only lists what it offers.`" size="md">
    <template v-if="connection">
      <MpFormSection title="Connection" />
      <MpFormGrid :cols="1">
        <v-text-field
          class="mp-form-grid__full mp-field-readonly"
          label="Merchant account"
          :model-value="connected ? `${name} account · connected` : 'Not connected'"
          readonly
        />
        <div v-if="!connected" class="mp-form-grid__full d-flex flex-wrap align-center ga-3">
          <v-btn variant="outlined" class="text-none" prepend-icon="plug" :disabled="!canManage" @click="setStatus('active')">Connect {{ name }}</v-btn>
          <span class="provider-drawer__hint">In production this opens {{ name }}’s sign-in.</span>
        </div>
      </MpFormGrid>

      <MpFormSection title="At checkout" />
      <MpFormGrid :cols="1">
        <v-switch
          class="mp-form-grid__full"
          label="Offer at checkout"
          :model-value="connection.status === 'active'"
          :disabled="!canManage || !connected"
          hide-details
          @update:model-value="setStatus($event ? 'active' : 'inactive')"
        />
        <div class="mp-form-grid__full" role="list" aria-label="Methods">
          <MpListRow v-for="method in connection.methods" :key="method.methodId" variant="divided" density="compact" role="listitem" :title="method.label" :subtitle="method.rate?.label">
            <template #lead><MaropayMethodMark :mark="markFor(method.methodId, method.label)" size="sm" decorative /></template>
            <template v-if="hidden.includes(method)" #trailing><span class="provider-drawer__hint">Through {{ providerLabel(setup.cardProcessor ?? 'maropay') }}</span></template>
          </MpListRow>
        </div>
        <p class="mp-form-grid__full provider-drawer__hint">{{ platformFeeLine(connection.kind, setup) }} — illustrative. Rates are {{ name }}’s own.</p>
      </MpFormGrid>

      <MpAlert v-if="connection.captureMode === 'manual'" tone="info" live="off" title="Captures by hand">
        {{ name }} authorises at checkout and you capture each payment from its order.
      </MpAlert>
    </template>

    <template #footer>
      <v-btn color="primary" variant="flat" class="text-none" @click="model = false">Done</v-btn>
    </template>
  </MpFormDrawer>
</template>

<style scoped>
.provider-drawer__hint {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}
</style>
