<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MaropayActingRoleBanner from '@/components/maropay/MaropayActingRoleBanner.vue'
import MaropayActivateDialog from '@/components/maropay/MaropayActivateDialog.vue'
import MaropayProviderCard from '@/components/maropay/MaropayProviderCard.vue'
import StoreManualMethodDrawer from '@/components/saleschannels/StoreManualMethodDrawer.vue'
import StoreProviderChooserDrawer from '@/components/saleschannels/StoreProviderChooserDrawer.vue'
import StoreProviderDrawer from '@/components/saleschannels/StoreProviderDrawer.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { deriveMaropayCard } from '@/maropay/providerCard'
import { isManualKind, providerLabel } from '@/maropay/providers'
import type { OwnProviderKind } from '@/maropay/providers'
import { storePaymentsTarget } from '@/maropay/readiness'
import type { MaropayTarget } from '@/maropay/readiness'
import { useStoreActivation } from '@/views/Maropay/store/useStoreActivation'
import StoreCheckoutSummaryCard from './payments/StoreCheckoutSummaryCard.vue'
import StoreProviderListCard from './payments/StoreProviderListCard.vue'

// A store's Payments: every provider it has, the way Shopify's Settings › Payments
// lists them — Maropay sold at the top (Maropost's own payments, one card, one
// state at a time), then the merchant's own providers, then the manual methods,
// then where Maropay's checkout settings live. Maropay's page for the store
// (checklist, methods, capture, the live preview) is one level down, at
// `StorePaymentsMaropay`, and the same page opens inside Maropay's own frame.

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()
const salesChannels = useSalesChannelsStore()
const toast = useToast()

function param(name: string): string {
  const value = route.params[name]
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

const accountId = computed(() => param('accountId') || '2000290')
const channelId = computed(() => param('channelId'))
const channel = computed(() => salesChannels.getChannel(accountId.value, channelId.value))
const storeName = computed(() => channel.value?.name ?? 'this store')
const binding = computed(() => maropay.bindingFor(channelId.value))
const assignedStoreNames = computed(() => (maropay.assignedChannelIds ?? []).map((id) => maropay.channelName(id)))

// ── Which page this is ─────────────────────────────────────────────

type View = 'pos' | 'other_platform' | 'restricted' | 'ready'

const view = computed<View>(() => {
  const c = channel.value
  if (c && c.type !== 'web_store') return 'pos'
  if (c && c.provider !== 'maropost_store_builder') return 'other_platform'
  if (!maropay.can('view_transactions', channelId.value)) return 'restricted'
  return 'ready'
})

const platformName = computed(() => (channel.value?.provider === 'shopify' ? 'Shopify' : 'another platform'))

// ── The Maropay card ───────────────────────────────────────────────

const cardModel = computed(() => deriveMaropayCard({
  state: maropay.state,
  channelId: channelId.value,
  channel: maropay.channelFacts(channelId.value),
  now: maropay.now,
  can: (action) => maropay.can(action, channelId.value),
  factsFor: maropay.channelFacts,
}))

function routeFor(target: MaropayTarget) {
  return maropay.routeFor(target)
}

const {
  activateOpen, deactivateOpen, gatewayName, activateConsequences, deactivateConsequences, activate, deactivate,
} = useStoreActivation(channelId, storeName)

function onActivate(takeCards: boolean): void {
  if (activate(takeCards)) toast.success(`Maropay is live on ${storeName.value}.`)
}

function linkStore(): void {
  const result = maropay.linkStore(channelId.value)
  if (!result.ok) toast.error(result.error.message)
  else toast.success(`${storeName.value} is linked. Nothing changes at checkout until you activate.`)
}

function scrollToSection(id: string): void {
  const el = document.getElementById(id)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el?.focus({ preventScroll: true })
}

// ── The merchant's own providers ───────────────────────────────────

const setup = computed(() => maropay.storeProvidersFor(channelId.value))
const chooserOpen = ref(false)
const chooserGroup = ref<'providers' | 'manual'>('providers')
const providerDrawer = ref<{ open: boolean; kind: OwnProviderKind | null }>({ open: false, kind: null })
const manualDrawer = ref<{ open: boolean; kind: OwnProviderKind | null }>({ open: false, kind: null })
const removeKind = ref<OwnProviderKind | null>(null)
const removeOpen = ref(false)

function openChooser(group: 'providers' | 'manual'): void {
  chooserGroup.value = group
  chooserOpen.value = true
}

function configure(kind: OwnProviderKind): void {
  if (isManualKind(kind)) manualDrawer.value = { open: true, kind }
  else providerDrawer.value = { open: true, kind }
}

async function onChoose(kind: OwnProviderKind): Promise<void> {
  const result = maropay.connectProvider(channelId.value, kind)
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  toast.success(isManualKind(kind) ? `${providerLabel(kind)} is on at checkout.` : `${providerLabel(kind)} added. Finish connecting it to take payments.`)
  // The chooser's drawer closes first; then the new provider's own drawer opens.
  await nextTick()
  configure(kind)
}

function askRemove(kind: OwnProviderKind): void {
  removeKind.value = kind
  removeOpen.value = true
}

function confirmRemove(): void {
  if (!removeKind.value) return
  const result = maropay.removeProvider(channelId.value, removeKind.value)
  if (!result.ok) toast.error(result.error.message)
  else toast.info(`${providerLabel(removeKind.value)} removed from ${storeName.value}.`)
  removeKind.value = null
}
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <MaropayActingRoleBanner :role="maropay.actingRole" :store-names="assignedStoreNames" @reset="maropay.setActingRole('owner')" />

    <MpPageHeader title="Payments" :subtitle="`How ${storeName} takes payments at checkout`">
      <template v-if="binding" #actions>
        <v-btn variant="text" class="text-none" prepend-icon="wallet" :to="routeFor(storePaymentsTarget(channelId))">Open in Maropay</v-btn>
      </template>
    </MpPageHeader>

    <v-card v-if="view === 'pos'" flat border rounded="lg">
      <MpEmptyState
        icon="store"
        title="In-store payments are set up in Retail"
        :description="`${storeName} takes payments with your card terminals and registers. Online payment providers don’t apply to it.`"
        action-label="Open Retail payments"
        :heading-level="2"
        @action="router.push({ name: 'RetailPayments', params: { accountId } })"
      />
    </v-card>

    <v-card v-else-if="view === 'other_platform'" flat border rounded="lg">
      <MpEmptyState
        icon="globe"
        :title="`${storeName} checks out on ${platformName}`"
        :description="`Its payment providers are managed in ${platformName}. Maropay takes payments for Maropost web stores.`"
        :heading-level="2"
      />
    </v-card>

    <v-card v-else-if="view === 'restricted'" flat border rounded="lg">
      <MpEmptyState
        icon="lock"
        title="You don’t have access to this store’s payments"
        description="Store operations users see payments for the stores they’re assigned to."
        :heading-level="2"
      />
    </v-card>

    <template v-else>
      <MaropayProviderCard
        :model="cardModel"
        :route-for="routeFor"
        @activate="activateOpen = true"
        @link="linkStore"
        @stop="deactivateOpen = true"
        @see-providers="scrollToSection('store-providers')"
      />

      <StoreProviderListCard :channel-id="channelId" family="providers" @add="openChooser('providers')" @configure="configure" @remove="askRemove" />
      <StoreProviderListCard :channel-id="channelId" family="manual" @add="openChooser('manual')" @configure="configure" @remove="askRemove" />
      <StoreCheckoutSummaryCard :channel-id="channelId" />
    </template>

    <StoreProviderChooserDrawer v-model="chooserOpen" :setup="setup" :group="chooserGroup" @choose="onChoose" />
    <StoreProviderDrawer v-model="providerDrawer.open" :channel-id="channelId" :kind="providerDrawer.kind" />
    <StoreManualMethodDrawer v-model="manualDrawer.open" :channel-id="channelId" :kind="manualDrawer.kind" />

    <MpConfirmDialog
      v-model="removeOpen"
      :title="`Remove ${removeKind ? providerLabel(removeKind) : 'this provider'} from ${storeName}?`"
      message="Shoppers stop seeing it at checkout straight away."
      :consequences="['Orders already paid with it keep their records.', 'You can add it again later.']"
      confirm-label="Remove"
      danger
      @confirm="confirmRemove"
    />

    <MaropayActivateDialog
      v-model="activateOpen"
      :store-name="storeName"
      :gateway="gatewayName"
      :consequences="activateConsequences"
      @confirm="onActivate"
    />

    <MpConfirmDialog
      v-model="deactivateOpen"
      :title="`Stop using Maropay on ${storeName}?`"
      message="This only changes where new checkouts go."
      :consequences="deactivateConsequences"
      confirm-label="Stop using Maropay"
      danger
      @confirm="deactivate"
    />
  </div>
</template>
