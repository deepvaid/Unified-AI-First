<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import StoreLineupRow from '@/components/saleschannels/StoreLineupRow.vue'
import StoreProviderRow from '@/components/saleschannels/StoreProviderRow.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { STORE_ACTIVATION_LABELS } from '@/maropay/model'
import { connectionOf, lineupFor, providerLabel } from '@/maropay/providers'
import type { OwnProviderKind, ProviderKind } from '@/maropay/providers'
import { checkoutMethods, joinList, storePaymentsTarget } from '@/maropay/readiness'
import type { MaropayTarget } from '@/maropay/readiness'

// The checkout lineup: every provider on a store, in the order shoppers see them
// — the merchant's own PayPal, Stripe, eWay, Afterpay or Zip, the manual methods
// paid outside the store and, once it is live, Maropay. Rows drag into a new
// order (pointer) or move through their menu (keyboard); the order is saved as
// the store's lineup and the storefront follows it. Adding, configuring and
// removing go through the page's drawers and dialogs.

const props = defineProps<{
  channelId: string
  routeFor: (target: MaropayTarget) => RouteLocationRaw
}>()

const emit = defineEmits<{
  add: [group: 'providers' | 'manual']
  configure: [kind: OwnProviderKind]
  remove: [kind: OwnProviderKind]
  stop: []
}>()

const maropay = useMaropayStore()
const toast = useToast()

const setup = computed(() => maropay.storeProvidersFor(props.channelId))
const binding = computed(() => maropay.bindingFor(props.channelId))
const live = computed(() => binding.value?.activation === 'live')
const lineup = computed(() => lineupFor(setup.value, { maropay: live.value }))
const canManage = computed(() => maropay.can('manage_methods', props.channelId))
const reorderable = computed(() => canManage.value && lineup.value.length > 1)

// Maropay's own row, while it is live.
const maropayTakes = computed(() => {
  if (!binding.value) return ''
  const ready = checkoutMethods(maropay.state, binding.value)
  return ready.length ? joinList(ready.map((m) => m.label)) : 'Nothing yet — turn on a method'
})
const maropayRate = computed(() => {
  if (!binding.value) return null
  const labels = [...new Set(checkoutMethods(maropay.state, binding.value).map((m) => m.rate.label))]
  return labels.length ? labels.join(' / ') : null
})

function toggle(kind: OwnProviderKind, enabled: boolean): void {
  const result = maropay.setProviderStatus(props.channelId, kind, enabled ? 'active' : 'inactive')
  if (!result.ok) toast.error(result.error.message)
}

// ── Reordering ─────────────────────────────────────────────────────

const dragging = ref<ProviderKind | null>(null)
const over = ref<ProviderKind | null>(null)

function commit(next: ProviderKind[]): void {
  const result = maropay.reorderLineup(props.channelId, next)
  if (!result.ok) toast.error(result.error.message)
}

async function move(kind: ProviderKind, direction: -1 | 1): Promise<void> {
  const next = [...lineup.value]
  const from = next.indexOf(kind)
  const to = from + direction
  if (from === -1 || to < 0 || to >= next.length) return
  next.splice(from, 1)
  next.splice(to, 0, kind)
  commit(next)
  // The row moved under the open menu; keep focus on its kebab so the next move is one key away.
  await nextTick()
  document.querySelector<HTMLElement>(`[data-lineup="${kind}"] [aria-haspopup="menu"]`)?.focus()
}

function onDragStart(kind: ProviderKind): void {
  dragging.value = kind
}

function onDragOver(kind: ProviderKind, event: DragEvent): void {
  if (!dragging.value || dragging.value === kind) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  over.value = kind
}

function onDrop(kind: ProviderKind, event: DragEvent): void {
  event.preventDefault()
  const from = dragging.value
  dragging.value = null
  over.value = null
  if (!from || from === kind) return
  const next = lineup.value.filter((k) => k !== from)
  next.splice(next.indexOf(kind), 0, from)
  commit(next)
}

function onDragEnd(): void {
  dragging.value = null
  over.value = null
}
</script>

<template>
  <v-card id="store-providers" flat border rounded="lg" class="mp-card-inset lineup" tabindex="-1">
    <MpSectionHeader title="Checkout lineup" description="What shoppers can pay with, in the order they see it." :heading-level="2">
      <template #actions>
        <v-tooltip :disabled="canManage" text="Only the business owner can change payment providers." location="bottom">
          <template #activator="{ props: tip }">
            <span v-bind="tip" class="lineup__actions">
              <v-btn id="store-manual-methods" size="small" variant="text" class="text-none" prepend-icon="plus" :disabled="!canManage" @click="emit('add', 'manual')">Manual method</v-btn>
              <v-btn size="small" variant="outlined" class="text-none" prepend-icon="plus" :disabled="!canManage" @click="emit('add', 'providers')">Add provider</v-btn>
            </span>
          </template>
        </v-tooltip>
      </template>
    </MpSectionHeader>

    <div v-if="lineup.length" role="list" aria-label="Checkout lineup" class="lineup__rows">
      <template v-for="(kind, index) in lineup" :key="kind">
        <StoreLineupRow
          v-if="kind === 'maropay'"
          role="listitem"
          :data-lineup="kind"
          :position="index + 1"
          mark="maropay"
          title="Maropay"
          :subtitle="maropayTakes"
          :rate="maropayRate"
          fee-line="No platform fee"
          :draggable="reorderable"
          :drop-target="over === kind"
          @dragstart="onDragStart(kind)"
          @dragover="onDragOver(kind, $event)"
          @drop="onDrop(kind, $event)"
          @dragend="onDragEnd"
        >
          <template #status><MpStatusChip :status="STORE_ACTIVATION_LABELS.live" type="readiness" size="sm" show-icon /></template>
          <template #actions>
            <MpRowActionsMenu ariaLabel="Maropay actions">
              <MpMenuItem icon="settings-2" title="Manage" :to="routeFor(storePaymentsTarget(channelId, 'store'))" />
              <template v-if="reorderable">
                <v-divider class="my-1" />
                <MpMenuItem icon="arrow-up" title="Move up" aria-label="Move Maropay up" :disabled="index === 0" @click="move(kind, -1)" />
                <MpMenuItem icon="arrow-down" title="Move down" aria-label="Move Maropay down" :disabled="index === lineup.length - 1" @click="move(kind, 1)" />
              </template>
              <template v-if="maropay.can('deactivate_store', channelId)">
                <v-divider class="my-1" />
                <MpMenuItem icon="power" title="Stop using Maropay on this store" danger @click="emit('stop')" />
              </template>
            </MpRowActionsMenu>
          </template>
        </StoreLineupRow>
        <StoreProviderRow
          v-else
          role="listitem"
          :data-lineup="kind"
          :connection="connectionOf(setup, kind)!"
          :setup="setup"
          :position="index + 1"
          :can-manage="canManage"
          :can-move-up="reorderable ? index > 0 : undefined"
          :can-move-down="reorderable ? index < lineup.length - 1 : undefined"
          :draggable="reorderable"
          :drop-target="over === kind"
          @configure="emit('configure', kind)"
          @toggle="toggle(kind, $event)"
          @remove="emit('remove', kind)"
          @move="move(kind, $event)"
          @dragstart="onDragStart(kind)"
          @dragover="onDragOver(kind, $event)"
          @drop="onDrop(kind, $event)"
          @dragend="onDragEnd"
        />
      </template>
    </div>
    <MpEmptyState
      v-else
      icon="plug"
      title="No payment methods yet"
      description="Connect PayPal, Stripe, eWay, Afterpay or Zip, or offer bank deposit, cheque or cash on delivery — shoppers can’t check out until there’s one."
      :action-label="canManage ? 'Add provider' : undefined"
      action-icon="plus"
      :heading-level="3"
      @action="emit('add', 'providers')"
    />

    <p class="lineup__footnote">
      <v-icon size="14" class="lineup__footnote-icon" aria-hidden="true">info</v-icon>
      The 1% platform fee is illustrative and applies to payments through other providers. Maropay and manual methods carry none{{ live ? '' : `; ${providerLabel('paypal')}’s is waived once Maropay takes cards` }}.
    </p>
  </v-card>
</template>

<style scoped lang="scss">
.lineup:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.lineup__actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-8);
}

/* Narrow: the two add buttons stack rather than push the card wider. */
@media (max-width: #{$mp-layout-breakpointCompact}) {
  .lineup__actions {
    flex-direction: column;
    align-items: stretch;
  }
}

.lineup__footnote {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-6);
  margin: var(--mp-space-12) 0 0;
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}

.lineup__footnote-icon {
  flex: none;
  margin-top: var(--mp-space-2);
  color: var(--icon-secondary);
}
</style>
