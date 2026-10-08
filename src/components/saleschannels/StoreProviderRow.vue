<script setup lang="ts">
import { computed } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayMethodMark from '@/components/maropay/MaropayMethodMark.vue'
import { markForProvider } from '@/maropay/methodMarks'
import { providerLabel, providerSubtitle } from '@/maropay/providers'
import type { ProviderConnection, ProviderStatus, StoreProviderSetup } from '@/maropay/providers'

// One of the merchant's own providers on a store (PayPal, Stripe, eWay, Afterpay,
// Zip, or a manual method): what it offers, at what rate, with the illustrative
// Maropost platform fee, its connection state and its actions. The row is not a
// link — a kebab inside a button is nested-interactive — so Configure lives in
// the menu, and a provider still to connect gets a visible Finish setup.

const props = withDefaults(defineProps<{
  connection: ProviderConnection
  setup: StoreProviderSetup
  canManage?: boolean
}>(), {
  canManage: true,
})

const emit = defineEmits<{
  configure: []
  toggle: [enabled: boolean]
  remove: []
}>()

const STATUS_LABELS: Record<ProviderStatus, string> = {
  active: 'Active',
  setup_incomplete: 'Setup incomplete',
  inactive: 'Inactive',
}

const name = computed(() => providerLabel(props.connection.kind))
const subtitle = computed(() => providerSubtitle(props.connection, props.setup))
const incomplete = computed(() => props.connection.status === 'setup_incomplete')
</script>

<template>
  <div class="store-provider">
    <MpListRow variant="divided" :title="name" :subtitle="subtitle">
      <template #lead>
        <MaropayMethodMark :mark="markForProvider(connection.kind)" size="md" decorative />
      </template>
      <template #trailing>
        <span class="store-provider__controls">
          <v-btn v-if="incomplete && canManage" size="small" variant="outlined" class="text-none" @click="emit('configure')">Finish setup</v-btn>
          <MpStatusChip :status="STATUS_LABELS[connection.status]" type="connection" size="sm" show-icon />
          <MpRowActionsMenu :ariaLabel="`${name} actions`">
            <MpMenuItem icon="settings-2" title="Configure" @click="emit('configure')" />
            <MpMenuItem
              v-if="connection.status === 'active'"
              icon="power-off"
              title="Turn off at checkout"
              :disabled="!canManage"
              @click="emit('toggle', false)"
            />
            <MpMenuItem
              v-else
              icon="power"
              :title="incomplete ? 'Mark as connected' : 'Turn on at checkout'"
              :disabled="!canManage"
              @click="emit('toggle', true)"
            />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Remove from this store" danger :disabled="!canManage" @click="emit('remove')" />
          </MpRowActionsMenu>
        </span>
      </template>
    </MpListRow>
    <MpAlert v-if="incomplete" tone="info" live="off" class="store-provider__nag" :title="`Finish connecting ${name}`">
      Shoppers won’t see {{ name }} at checkout until it’s connected.
      <template v-if="canManage" #actions>
        <v-btn size="small" variant="outlined" class="text-none" @click="emit('configure')">Finish setup</v-btn>
      </template>
    </MpAlert>
  </div>
</template>

<style scoped>
.store-provider__controls {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--mp-space-8);
}

.store-provider__nag {
  margin-block: var(--mp-space-12);
}
</style>
