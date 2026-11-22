<script setup lang="ts">
import { computed } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import StoreLineupRow from './StoreLineupRow.vue'
import { markForProvider } from '@/maropay/methodMarks'
import { connectionOfferedMethods, isManualKind, platformFeeFor, providerLabel } from '@/maropay/providers'
import type { ProviderConnection, ProviderStatus, StoreProviderSetup } from '@/maropay/providers'

// One of the merchant's own providers in a store's checkout lineup (PayPal, Stripe,
// eWay, Afterpay, Zip, or a manual method): what it offers, its rate and the
// illustrative Maropost platform fee, its connection state and its actions. The
// row is not a link — a kebab inside a button is nested-interactive — so Configure
// lives in the menu, and a provider still to connect gets a visible Finish setup.
// Move up / Move down in the menu are the keyboard path for reordering.

const props = withDefaults(defineProps<{
  connection: ProviderConnection
  setup: StoreProviderSetup
  /** 1-based place in the lineup. */
  position: number
  canManage?: boolean
  /** Reordering: whether the row can move each way; undefined hides the move items. */
  canMoveUp?: boolean
  canMoveDown?: boolean
  draggable?: boolean
  dropTarget?: boolean
}>(), {
  canManage: true,
  canMoveUp: undefined,
  canMoveDown: undefined,
  draggable: false,
  dropTarget: false,
})

const emit = defineEmits<{
  configure: []
  toggle: [enabled: boolean]
  remove: []
  move: [direction: -1 | 1]
  dragstart: [event: DragEvent]
  dragover: [event: DragEvent]
  drop: [event: DragEvent]
  dragend: []
}>()

const STATUS_LABELS: Record<ProviderStatus, string> = {
  active: 'Active',
  setup_incomplete: 'Setup incomplete',
  inactive: 'Inactive',
}

const name = computed(() => providerLabel(props.connection.kind))
const manual = computed(() => isManualKind(props.connection.kind))
const incomplete = computed(() => props.connection.status === 'setup_incomplete')
const reorderable = computed(() => props.canMoveUp !== undefined || props.canMoveDown !== undefined)

/** What shoppers get from it: the manual method's display name, or the methods it offers now (every method while it's off). */
const subtitle = computed(() => {
  const c = props.connection
  if (manual.value) return c.manual?.displayName && c.manual.displayName !== name.value ? `Shown at checkout as “${c.manual.displayName}”` : 'Orders are approved before they’re fulfilled'
  const methods = c.status === 'active' ? connectionOfferedMethods(c, props.setup) : c.methods
  if (!methods.length) return `Nothing at checkout — cards and wallets go through ${providerLabel(props.setup.cardProcessor ?? 'maropay')}`
  return methods.map((m) => m.label).join(', ')
})

const rate = computed(() => {
  if (manual.value) return null
  const methods = props.connection.status === 'active' ? connectionOfferedMethods(props.connection, props.setup) : props.connection.methods
  const labels = [...new Set(methods.map((m) => m.rate?.label).filter((l): l is string => !!l))]
  return labels.length ? labels.join(' / ') : null
})

const fee = computed(() => platformFeeFor(props.connection.kind, props.setup))
const feeLine = computed(() => {
  if (manual.value) return 'Manual'
  if (fee.value) return `+ ${fee.value.label} platform fee`
  return props.connection.kind === 'paypal' ? 'Platform fee waived' : 'No platform fee'
})
</script>

<template>
  <StoreLineupRow
    :position="position"
    :mark="markForProvider(connection.kind)"
    :title="name"
    :subtitle="subtitle"
    :rate="rate"
    :fee-line="feeLine"
    :fee-applies="!!fee"
    :draggable="draggable"
    :drop-target="dropTarget"
    @dragstart="emit('dragstart', $event)"
    @dragover="emit('dragover', $event)"
    @drop="emit('drop', $event)"
    @dragend="emit('dragend')"
  >
    <template #status>
      <v-btn v-if="incomplete && canManage" size="small" variant="outlined" class="text-none" @click="emit('configure')">Finish setup</v-btn>
      <MpStatusChip :status="STATUS_LABELS[connection.status]" type="connection" size="sm" show-icon />
    </template>
    <template #actions>
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
        <template v-if="reorderable">
          <v-divider class="my-1" />
          <MpMenuItem icon="arrow-up" title="Move up" :aria-label="`Move ${name} up`" :disabled="!canManage || !canMoveUp" @click="emit('move', -1)" />
          <MpMenuItem icon="arrow-down" title="Move down" :aria-label="`Move ${name} down`" :disabled="!canManage || !canMoveDown" @click="emit('move', 1)" />
        </template>
        <v-divider class="my-1" />
        <MpMenuItem icon="trash-2" title="Remove from this store" danger :disabled="!canManage" @click="emit('remove')" />
      </MpRowActionsMenu>
    </template>
    <template v-if="incomplete" #after>
      <MpAlert tone="info" live="off" class="store-provider__nag" :title="`Finish connecting ${name}`">
        Shoppers won’t see {{ name }} at checkout until it’s connected.
        <template v-if="canManage" #actions>
          <v-btn size="small" variant="outlined" class="text-none" @click="emit('configure')">Finish setup</v-btn>
        </template>
      </MpAlert>
    </template>
  </StoreLineupRow>
</template>

<style scoped>
.store-provider__nag {
  margin-block: var(--mp-space-12);
}
</style>
