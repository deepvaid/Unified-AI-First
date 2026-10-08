<script setup lang="ts">
import { computed } from 'vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import StoreProviderRow from '@/components/saleschannels/StoreProviderRow.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { PLATFORM_FEE_CAPTION, isManualKind } from '@/maropay/providers'
import type { OwnProviderKind } from '@/maropay/providers'

// One of the two provider lists on a store's Payments page: the merchant's own
// providers (PayPal, Stripe, eWay, Afterpay, Zip) or the manual methods paid
// outside the store. Rows switch providers on and off here; adding, configuring
// and removing go through the page's drawers and dialog.

const props = defineProps<{
  channelId: string
  family: 'providers' | 'manual'
}>()

const emit = defineEmits<{
  add: []
  configure: [kind: OwnProviderKind]
  remove: [kind: OwnProviderKind]
}>()

const maropay = useMaropayStore()
const toast = useToast()

const COPY = {
  providers: {
    id: 'store-providers',
    title: 'Payment providers',
    description: 'Providers you’ve connected yourself. Each one takes the methods it offers at checkout.',
    add: 'Add provider',
    emptyIcon: 'plug',
    emptyTitle: 'No providers yet',
    emptyDescription: 'Connect PayPal, Stripe, eWay, Afterpay or Zip to take payments with your own accounts.',
    footnote: PLATFORM_FEE_CAPTION,
  },
  manual: {
    id: 'store-manual-methods',
    title: 'Manual payment methods',
    description: 'Payments made outside the online store. Orders paid this way are approved before they’re fulfilled.',
    add: 'Add manual method',
    emptyIcon: 'hand-coins',
    emptyTitle: 'No manual methods',
    emptyDescription: 'Offer bank deposit, cheque or cash on delivery for shoppers who pay outside the store.',
    footnote: 'No Maropost platform fee on payments made outside the store.',
  },
} as const

const copy = computed(() => COPY[props.family])
const setup = computed(() => maropay.storeProvidersFor(props.channelId))
const connections = computed(() => setup.value.connections.filter((c) => isManualKind(c.kind) === (props.family === 'manual')))
const canManage = computed(() => maropay.can('manage_methods', props.channelId))

function toggle(kind: OwnProviderKind, enabled: boolean): void {
  const result = maropay.setProviderStatus(props.channelId, kind, enabled ? 'active' : 'inactive')
  if (!result.ok) toast.error(result.error.message)
}
</script>

<template>
  <v-card :id="copy.id" flat border rounded="lg" class="mp-card-inset provider-list" tabindex="-1">
    <MpSectionHeader :title="copy.title" :description="copy.description" :heading-level="2">
      <template #actions>
        <v-tooltip :disabled="canManage" text="Only the business owner can change payment providers." location="bottom">
          <template #activator="{ props: tip }">
            <span v-bind="tip">
              <v-btn size="small" variant="outlined" class="text-none" prepend-icon="plus" :disabled="!canManage" @click="emit('add')">{{ copy.add }}</v-btn>
            </span>
          </template>
        </v-tooltip>
      </template>
    </MpSectionHeader>

    <div v-if="connections.length" role="list">
      <StoreProviderRow
        v-for="connection in connections"
        :key="connection.kind"
        role="listitem"
        :connection="connection"
        :setup="setup"
        :can-manage="canManage"
        @configure="emit('configure', connection.kind)"
        @toggle="toggle(connection.kind, $event)"
        @remove="emit('remove', connection.kind)"
      />
    </div>
    <MpEmptyState
      v-else
      :icon="copy.emptyIcon"
      :title="copy.emptyTitle"
      :description="copy.emptyDescription"
      :action-label="canManage ? copy.add : undefined"
      action-icon="plus"
      :heading-level="3"
      @action="emit('add')"
    />
    <p class="provider-list__footnote">{{ copy.footnote }}</p>
  </v-card>
</template>

<style scoped>
.provider-list:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.provider-list__footnote {
  margin: var(--mp-space-12) 0 0;
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}
</style>
