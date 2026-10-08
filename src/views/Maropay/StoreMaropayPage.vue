<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayActingRoleBanner from '@/components/maropay/MaropayActingRoleBanner.vue'
import MaropayActivateDialog from '@/components/maropay/MaropayActivateDialog.vue'
import MaropayActivationChecklist from '@/components/maropay/MaropayActivationChecklist.vue'
import MaropayDemoPanel from '@/components/maropay/MaropayDemoPanel.vue'
import MaropayMethodMark from '@/components/maropay/MaropayMethodMark.vue'
import { useToast } from '@/composables/useToast'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMaropayStore } from '@/stores/useMaropay'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { markForProvider } from '@/maropay/methodMarks'
import { HISTORY_KIND_ICONS, PROVIDER_LABELS, STORE_ACTIVATION_LABELS } from '@/maropay/model'
import { activeConnections, cardGateway, connectionOfferedMethods, providerLabel } from '@/maropay/providers'
import type { CaptureMode, MethodStatus, PaymentMethodCatalogEntry } from '@/maropay/model'
import { formatDay, joinList, storePaymentsTarget, taskTarget } from '@/maropay/readiness'
import type { ActivationCheckItem } from '@/maropay/readiness'
import { inStock, productHandle, storefrontProducts } from '@/views/Storefront/storefrontCatalog'
import StoreActivationImpactCard from './store/StoreActivationImpactCard.vue'
import StoreCheckoutOptionsCard from './store/StoreCheckoutOptionsCard.vue'
import StorePaymentMethodsCard from './store/StorePaymentMethodsCard.vue'
import StorePaymentsPreview from './store/StorePaymentsPreview.vue'
import { useStoreActivation } from './store/useStoreActivation'

// Maropay on one store: its checklist, methods, capture and checkout options, and
// the switch itself (plan §3D–3E). The business is verified once; each store
// activates on its own — after its checklist, its methods, a test checkout and the
// owner's review of what changes. Activation and deactivation only change where
// new checkouts go: payments already taken stay with the provider that took them,
// and the merchant's other providers (the store's Payments page) keep working.
//
// Two frames show this page. From anywhere in Maropay it opens inside Maropay's
// rail (`MaropayStorePayments`), so the way back is on screen; from the store's
// Payments page it's one level down in the store editor (`StorePaymentsMaropay`).
// The settings sit beside a live "What shoppers see" preview once the page is wide
// enough.

const props = withDefaults(defineProps<{
  frame?: 'maropay' | 'store'
}>(), {
  frame: 'store',
})

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()
const salesChannels = useSalesChannelsStore()
const commerce = useCommerceStore()
const toast = useToast()

function param(name: string): string {
  const value = route.params[name]
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

const accountId = computed(() => param('accountId') || '2000290')
const channelId = computed(() => param('channelId'))
const channel = computed(() => salesChannels.getChannel(accountId.value, channelId.value))
const storeName = computed(() => channel.value?.name ?? 'this store')
const overviewRoute = computed(() => ({ name: 'MaropayOverview', params: { accountId: accountId.value } }))

const inMaropay = computed(() => props.frame === 'maropay')
const maropayStoreRoute = computed(() => maropay.routeFor(storePaymentsTarget(channelId.value)))
const storeEditorRoute = computed(() => ({ name: 'SalesChannelDetail', params: { accountId: accountId.value, channelId: channelId.value } }))
const isMaropostStore = computed(() => channel.value?.type === 'web_store' && channel.value.provider === 'maropost_store_builder')
const storeHomeHref = computed(() => router.resolve({ name: 'StorefrontHome', params: { accountId: accountId.value, channelId: channelId.value } }).href)
/** A product page of this store (one in stock, so its buy buttons show), where the methods first show up for a shopper. */
const storefrontHref = computed(() => {
  const product = storefrontProducts(commerce.products).find(inStock)
  const params = { accountId: accountId.value, channelId: channelId.value }
  return router.resolve(product
    ? { name: 'StorefrontProduct', params: { ...params, handle: productHandle(product) } }
    : { name: 'StorefrontHome', params }).href
})

const binding = computed(() => maropay.bindingFor(channelId.value))
const live = computed(() => binding.value?.activation === 'live')
const gateway = computed(() => cardGateway(maropay.storeProvidersFor(channelId.value)))
const previousName = computed(() => (gateway.value ? PROVIDER_LABELS[gateway.value.kind] : null))

const canManage = computed(() => maropay.can('manage_methods', channelId.value))
const canActivate = computed(() => maropay.can('activate_store', channelId.value))

const assignedStoreNames = computed(() => (maropay.assignedChannelIds ?? []).map((id) => maropay.channelName(id)))

// ── Which page this is ─────────────────────────────────────────────

type View = 'not_found' | 'pos' | 'other_platform' | 'restricted' | 'no_account' | 'setup' | 'unavailable' | 'unlinked' | 'store'

const view = computed<View>(() => {
  const c = channel.value
  // The store editor catches a missing store before this page; Maropay's frame doesn't.
  if (!c) return 'not_found'
  if (c.type !== 'web_store') return 'pos'
  if (c.provider !== 'maropost_store_builder') return 'other_platform'
  if (!maropay.can('view_transactions', channelId.value)) return 'restricted'
  const account = maropay.account
  if (!account) return 'no_account'
  // Declined and closed accounts read like an unavailable one here: nothing to activate, the store keeps its setup.
  const unavailable = ['unavailable', 'declined', 'closed'].includes(maropay.overview.key)
  if (account.setup !== 'submitted') return unavailable ? 'unavailable' : 'setup'
  if (unavailable) return 'unavailable'
  return binding.value ? 'store' : 'unlinked'
})

const platformName = computed(() => (channel.value?.provider === 'shopify' ? 'Shopify' : 'another platform'))
const platformCheckout = computed(() => (channel.value?.provider === 'shopify' ? 'Shopify’s checkout and payments' : 'the checkout of its own platform'))

function linkStore(): void {
  const result = maropay.linkStore(channelId.value)
  if (!result.ok) toast.error(result.error.message)
  else toast.success(`${storeName.value} is linked. Nothing changes at checkout until you activate.`)
}

// ── Status ─────────────────────────────────────────────────────────

const storeState = computed(() => maropay.storeStateFor(channelId.value) ?? 'inactive')

/** Who takes this store's checkouts, in one line under the title. */
const routing = computed(() => {
  const b = binding.value
  if (b?.activation === 'live') {
    const since = b.activatedAt ? ` since ${formatDay(b.activatedAt)}` : ''
    return `Checkout uses Maropay${since}${previousName.value ? ` · earlier payments stay with ${previousName.value}` : ''}`
  }
  if (previousName.value) return `Checkout uses ${previousName.value} until you activate Maropay`
  return 'Keeps its current payment setup until you activate Maropay'
})

const headerSubtitle = computed(() => (view.value === 'store' ? routing.value : `How ${storeName.value} takes payments at checkout`))

const deactivatedAt = computed(() => (binding.value && !live.value ? binding.value.deactivatedAt : null))

// ── Checklist ──────────────────────────────────────────────────────

const checklist = computed(() => maropay.checklistFor(channelId.value))
const openVerificationTask = computed(() => maropay.openTasks.find((t) => t.kind === 'verification' && t.status === 'open') ?? null)
const testing = ref(false)

function delay(ms = 600): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function runTestCheckout(): Promise<void> {
  if (testing.value) return
  testing.value = true
  await delay()
  const result = maropay.validateCheckout(channelId.value)
  testing.value = false
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  const validation = result.value.checkoutValidation
  if (validation.status === 'passed') toast.success('Test checkout passed — a test payment went through end to end.')
  else toast.warning(validation.failureReason ?? 'The test checkout didn’t complete.')
}

/** Where an item gets fixed, when that isn't on this page. */
function fixRoute(item: ActivationCheckItem) {
  if (item.key === 'payment_capability' && openVerificationTask.value) return maropay.routeFor(taskTarget(openVerificationTask.value))
  if (item.key === 'store_prerequisites' && channel.value?.status === 'draft') return storeEditorRoute.value
  if (item.key === 'payment_capability' || item.key === 'payout_ready' || item.key === 'account_tasks') return overviewRoute.value
  return null
}

function fixLabel(item: ActivationCheckItem): string {
  if (item.key === 'payment_capability' && openVerificationTask.value) return 'Provide information'
  if (item.key === 'store_prerequisites') return 'Open store overview'
  return 'View tasks'
}

function scrollToSection(id: string): void {
  const el = document.getElementById(id)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el?.focus({ preventScroll: true })
}

// A deep link from the store's Payments page lands on its section (#maropay-store-capture).
onMounted(() => {
  const id = route.hash.replace(/^#/, '')
  if (id) void nextTick(() => scrollToSection(id))
})

// ── Methods (what activating offers) ───────────────────────────────

type StoreMethod = PaymentMethodCatalogEntry & { status: MethodStatus }

const checkoutMethods = computed(() => maropay.checkoutMethodsFor(channelId.value))
const pendingMethods = computed<StoreMethod[]>(() => maropay.methodsForStore(channelId.value).filter((m) => m.status === 'pending_approval'))

// ── Capture ────────────────────────────────────────────────────────

const captureItems = computed(() => [
  { value: 'automatic', label: 'Automatic', disabled: !canManage.value },
  { value: 'manual', label: 'Manual', disabled: !canManage.value },
])
const captureConflicts = computed(() => (binding.value?.captureMode === 'manual' ? checkoutMethods.value.filter((m) => !m.supportsManualCapture) : []))

function setCapture(mode: string | null): void {
  if (!mode || mode === binding.value?.captureMode) return
  const result = maropay.setCaptureMode(channelId.value, mode as CaptureMode)
  if (!result.ok) toast.error(result.error.message)
}

// ── Activate and deactivate ────────────────────────────────────────
// Shared with the store's Payments page, so the Maropay card and this page say the same things.

const {
  activateOpen, deactivateOpen, justActivated, activateHint,
  activateConsequences, deactivateConsequences, activate: activateStore, deactivate: deactivateStore,
} = useStoreActivation(channelId, storeName)
const activatedAlert = ref<HTMLElement | null>(null)
/** The Activate dialog's choice, previewed here: the impact card and the live preview follow it. */
const cardsVia = ref<'maropay' | 'existing'>('maropay')

async function activate(takeCards: boolean): Promise<void> {
  if (!activateStore(takeCards)) return
  await nextTick()
  activatedAlert.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  activatedAlert.value?.focus({ preventScroll: true })
}

function deactivate(): void {
  deactivateStore()
}

// ── The store's other providers (Maropay's frame) ──────────────────

const providersRoute = computed(() => ({ name: 'StorePayments', params: { accountId: accountId.value, channelId: channelId.value } }))
const otherProviders = computed(() => {
  const setup = maropay.storeProvidersFor(channelId.value)
  return activeConnections(setup).map((c) => ({
    kind: c.kind,
    name: providerLabel(c.kind),
    offers: connectionOfferedMethods(c, setup).map((m) => m.label),
  }))
})

// ── Activity and demo ──────────────────────────────────────────────

const activity = computed(() => maropay.history.filter((entry) => entry.channelId === channelId.value).slice(0, 8))
const showDemo = computed(() => canManage.value && (!live.value || pendingMethods.value.length > 0))

function decideMethod(method: StoreMethod, approved: boolean): void {
  const result = maropay.simulateMethodApproval(method.id, approved)
  if (result.ok) toast.info(`Simulated: ${method.label} ${approved ? 'approved' : 'declined'}.`)
  else toast.error(result.error.message)
}
</script>

<template>
  <div class="store-payments d-flex flex-column gap-5">
    <!-- Maropay's frame shows the acting-role banner already. -->
    <MaropayActingRoleBanner v-if="!inMaropay" :role="maropay.actingRole" :store-names="assignedStoreNames" @reset="maropay.setActingRole('owner')" />

    <MpPageHeader
      :eyebrow="inMaropay ? 'Store' : undefined"
      :title="view === 'not_found' ? 'Store not found' : inMaropay ? storeName : 'Maropay'"
      :subtitle="view === 'not_found' ? undefined : headerSubtitle"
      :back-to="inMaropay ? overviewRoute : providersRoute"
    >
      <template v-if="view === 'store'" #title-append>
        <MpStatusChip :status="STORE_ACTIVATION_LABELS[storeState]" type="readiness" show-icon />
      </template>
      <template v-if="view !== 'not_found'" #actions>
        <v-btn v-if="inMaropay && isMaropostStore" variant="text" class="text-none" append-icon="external-link" :href="storeHomeHref" target="_blank" rel="noopener">
          View store
        </v-btn>
        <v-btn v-else-if="!inMaropay && binding" variant="text" class="text-none" prepend-icon="wallet" :to="maropayStoreRoute">
          Open in Maropay
        </v-btn>
        <v-tooltip v-if="view === 'store' && !live" :disabled="!activateHint" :text="activateHint" location="bottom">
          <template #activator="{ props: tip }">
            <span v-bind="tip">
              <v-btn color="primary" variant="flat" class="text-none" prepend-icon="rocket" :disabled="!!activateHint" @click="activateOpen = true">
                Activate Maropay
              </v-btn>
            </span>
          </template>
        </v-tooltip>
        <MpRowActionsMenu v-if="inMaropay || (view === 'store' && live && canActivate)" ariaLabel="More store actions">
          <MpMenuItem v-if="inMaropay" icon="store" title="Open store editor" :to="storeEditorRoute" />
          <template v-if="view === 'store' && live && canActivate">
            <v-divider v-if="inMaropay" class="my-1" />
            <MpMenuItem icon="power" title="Stop using Maropay on this store" danger @click="deactivateOpen = true" />
          </template>
        </MpRowActionsMenu>
      </template>
    </MpPageHeader>

    <v-card v-if="view === 'not_found'" flat border rounded="lg">
      <MpErrorState
        icon="store"
        title="We couldn’t find this store"
        description="It may have been removed, or the link is incorrect."
        action-label="Back to overview"
        action-icon="arrow-left"
        @action="router.push(overviewRoute)"
      />
    </v-card>

    <!-- ── Not a Maropay store ──────────────────────────────────── -->
    <v-card v-else-if="view === 'pos'" flat border rounded="lg">
      <MpEmptyState
        icon="store"
        title="In-store payments are set up in Retail"
        :description="`Maropay online payments are for web stores. ${storeName} takes payments with your card terminals.`"
        action-label="Open Retail payments"
        :heading-level="2"
        @action="router.push({ name: 'RetailPayments', params: { accountId } })"
      />
    </v-card>

    <v-card v-else-if="view === 'other_platform'" flat border rounded="lg">
      <MpEmptyState
        icon="globe"
        :title="`${storeName} checks out on ${platformName}`"
        :description="`Maropay takes payments for Maropost web stores. ${storeName} keeps using ${platformCheckout}.`"
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

    <v-card v-else-if="view === 'no_account'" flat border rounded="lg">
      <MpEmptyState
        icon="wallet"
        :title="`Take payments on ${storeName} with Maropay`"
        :description="`Maropay is Maropost’s own payments. ${storeName} keeps its current payment setup until you choose to switch.`"
        action-label="See how Maropay works"
        action-icon="arrow-right"
        :heading-level="2"
        @action="router.push(overviewRoute)"
      />
    </v-card>

    <v-card v-else-if="view === 'setup'" flat border rounded="lg">
      <MpEmptyState
        icon="list-checks"
        title="Finish setting up Maropay"
        :description="`Once your business is verified, you can switch ${storeName} to Maropay here. Until then it keeps its current payment setup.`"
        :action-label="maropay.can('edit_onboarding') ? 'Continue setup' : undefined"
        action-icon="arrow-right"
        :heading-level="2"
        @action="router.push({ name: 'MaropaySetup', params: { accountId } })"
      />
    </v-card>

    <v-card v-else-if="view === 'unlinked'" flat border rounded="lg">
      <MpEmptyState
        icon="link"
        :title="`Link ${storeName} to Maropay`"
        :description="canActivate
          ? 'Your business is verified. Linking doesn’t change checkout — you’ll choose methods and run a test before anything switches.'
          : 'Your business is verified. Ask the business owner to link this store.'"
        :action-label="canActivate ? 'Link store' : undefined"
        action-icon="link"
        :heading-level="2"
        @action="linkStore"
      />
    </v-card>

    <template v-else-if="view === 'unavailable'">
      <MpAlert tone="info" live="off" :icon="maropay.overview.key === 'closed' ? 'archive' : 'ban'" :title="maropay.overview.headline">
        {{ maropay.overview.detail }}
        {{ previousName ? `${storeName} keeps taking payments with ${previousName}.` : `${storeName} keeps its current payment setup.` }}
        <template #actions>
          <v-btn size="small" variant="outlined" class="text-none" :to="overviewRoute">Open Maropay overview</v-btn>
        </template>
      </MpAlert>
    </template>

    <!-- ── The store's payments ─────────────────────────────────── -->
    <template v-else-if="binding">
      <div v-if="justActivated && live" ref="activatedAlert" tabindex="-1" class="store-payments__focus">
        <MpAlert tone="success" :title="`Maropay is live on ${storeName}`" dismissible @dismiss="justActivated = false">
          New checkouts use Maropay from now on. Payments show up in Transactions, and the money reaches your bank with a payout.
          <template #actions>
            <v-btn size="small" variant="outlined" class="text-none" :to="overviewRoute">Open overview</v-btn>
            <v-btn size="small" variant="text" class="text-none" append-icon="external-link" :href="storefrontHref" target="_blank" rel="noopener">Open your store</v-btn>
          </template>
        </MpAlert>
      </div>

      <MpAlert v-if="deactivatedAt" tone="info" live="off" :title="`Maropay was stopped on ${formatDay(deactivatedAt)}`">
        Payments taken while it was live — with their refunds, disputes and payouts — are still in Maropay.
      </MpAlert>

      <MaropayActivationChecklist v-if="!live && checklist" :checklist="checklist">
        <template #action="{ item }">
          <v-btn
            v-if="item.key === 'checkout_validated'"
            size="small"
            variant="outlined"
            class="text-none"
            :loading="testing"
            :disabled="!canManage"
            @click="runTestCheckout"
          >
            Run test checkout
          </v-btn>
          <v-btn v-else-if="item.key === 'methods_ready'" size="small" variant="text" class="text-none" @click="scrollToSection('maropay-store-methods')">Choose methods</v-btn>
          <v-btn v-else-if="item.key === 'impact_reviewed'" size="small" variant="text" class="text-none" @click="scrollToSection('maropay-store-impact')">Review changes</v-btn>
          <v-btn v-else-if="item.key === 'store_prerequisites' && captureConflicts.length" size="small" variant="text" class="text-none" @click="scrollToSection('maropay-store-capture')">Review capture</v-btn>
          <v-btn v-else-if="item.state === 'todo' && fixRoute(item)" size="small" variant="text" class="text-none" :to="fixRoute(item)!">{{ fixLabel(item) }}</v-btn>
        </template>
      </MaropayActivationChecklist>

      <!-- Settings beside what shoppers see; one column on a narrow page. -->
      <div class="store-payments__split">
        <div class="store-payments__settings">
          <StorePaymentMethodsCard id="maropay-store-methods" tabindex="-1" class="store-payments__section" :channel-id="channelId" :live="live" :can-manage="canManage" />
          <StoreCheckoutOptionsCard id="maropay-store-checkout" tabindex="-1" class="store-payments__section" :channel-id="channelId" :can-manage="canManage" />

          <v-card id="maropay-store-capture" flat border rounded="lg" class="mp-card-inset store-payments__section" tabindex="-1">
            <MpSectionHeader icon="hand-coins" title="Capture" description="When the shopper’s money is taken." :heading-level="2" />
            <div class="store-payments__capture">
              <MpSegmentedControl
                :model-value="binding.captureMode"
                :items="captureItems"
                ariaLabel="Capture"
                @update:model-value="setCapture"
              />
              <p class="store-payments__note">
                {{ binding.captureMode === 'automatic'
                  ? 'Payments are captured as soon as the shopper pays.'
                  : 'Payments are authorised at checkout. Capture each one from its order within 7 days, or the authorisation lapses.' }}
                {{ canManage ? '' : 'Only the business owner can change this.' }}
              </p>
            </div>
            <MpAlert v-if="captureConflicts.length" tone="warning" live="off" class="mt-4" :title="`${joinList(captureConflicts.map((m) => m.label))} can’t be used with manual capture`">
              Turn {{ captureConflicts.length === 1 ? 'it' : 'them' }} off or switch to automatic capture before you activate.
            </MpAlert>
          </v-card>
        </div>

        <div class="store-payments__preview">
          <StorePaymentsPreview :channel-id="channelId" :live="live" :cards-via="cardsVia" :domain="channel?.webStore?.domain" :storefront-href="storefrontHref" />
        </div>
      </div>

      <StoreActivationImpactCard
        v-if="!live"
        id="maropay-store-impact"
        v-model:cards-via="cardsVia"
        tabindex="-1"
        class="store-payments__section"
        :channel-id="channelId"
        :previous-name="previousName"
        :can-activate="canActivate"
      />

      <v-card v-if="inMaropay && otherProviders.length" flat border rounded="lg" class="mp-card-inset">
        <MpSectionHeader icon="plug" :title="`Other providers on ${storeName}`" description="Connected in the store editor, beside Maropay." :heading-level="2">
          <template #actions>
            <v-btn size="small" variant="text" class="text-none" append-icon="arrow-right" :to="providersRoute">Manage in the store editor</v-btn>
          </template>
        </MpSectionHeader>
        <div role="list">
          <MpListRow
            v-for="provider in otherProviders"
            :key="provider.kind"
            variant="divided"
            role="listitem"
            :title="provider.name"
            :subtitle="provider.offers.length ? provider.offers.join(', ') : 'Nothing at checkout — cards and wallets go through Maropay'"
          >
            <template #lead><MaropayMethodMark :mark="markForProvider(provider.kind)" size="md" decorative /></template>
          </MpListRow>
        </div>
      </v-card>

      <v-card flat border rounded="lg" class="mp-card-inset">
        <MpSectionHeader icon="history" title="Activity on this store" :heading-level="2" />
        <div v-if="activity.length" role="list">
          <MpListRow v-for="entry in activity" :key="entry.id" variant="divided" role="listitem" :title="entry.text" :subtitle="formatDay(entry.at)">
            <template #lead>
              <v-icon size="16" class="store-payments__activity-icon">{{ HISTORY_KIND_ICONS[entry.kind] }}</v-icon>
            </template>
          </MpListRow>
        </div>
        <MpEmptyState v-else icon="history" title="Nothing yet" description="Changes to this store’s payments show up here." :heading-level="3" />
      </v-card>

      <MaropayDemoPanel v-if="showDemo">
        <MpListRow v-for="method in pendingMethods" :key="method.id" variant="divided" :title="method.label" subtitle="Awaiting our payments partner’s approval">
          <template #trailing>
            <span class="d-flex flex-wrap ga-2">
              <v-btn size="small" variant="outlined" class="text-none" @click="decideMethod(method, true)">Approve</v-btn>
              <v-btn size="small" variant="text" class="text-none" @click="decideMethod(method, false)">Decline</v-btn>
            </span>
          </template>
        </MpListRow>
        <MpListRow v-if="!live" variant="divided" title="Test checkouts" subtitle="Make the next test checkout fail">
          <template #trailing>
            <v-checkbox-btn
              :model-value="maropay.failures.checkoutValidationFails"
              aria-label="Make test checkouts fail"
              @update:model-value="maropay.setFailure('checkoutValidationFails', Boolean($event))"
            />
          </template>
        </MpListRow>
      </MaropayDemoPanel>
    </template>

    <MaropayActivateDialog
      v-model="activateOpen"
      :store-name="storeName"
      :gateway="previousName"
      :consequences="activateConsequences"
      @confirm="activate"
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

<style scoped lang="scss">
/* The page is the container, so the split follows the page's width in either
   frame (Maropay's rail or the store editor's), not the window's. */
.store-payments {
  container: store-payments / inline-size;
}

.store-payments__section:focus-visible,
.store-payments__focus:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.store-payments__focus:focus {
  outline: none;
}

.store-payments__split,
.store-payments__settings {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
  min-width: 0;
}

/* Wide: settings | a sticky preview, capped to the visible frame so it never runs off screen. */
@container store-payments (min-width: #{$mp-layout-previewSplitWidth}) {
  .store-payments__split {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--mp-layout-previewPanelWidth);
    align-items: start;
  }

  .store-payments__preview {
    position: sticky;
    top: var(--mp-space-24);
    display: flex;
    flex-direction: column;
    max-height: calc(var(--mp-frame-height, 100vh) - 2 * var(--mp-space-24));
  }
}

.store-payments__capture {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-16);
}

.store-payments__note {
  flex: 1 1 var(--mp-component-state-measure);
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}

.store-payments__activity-icon {
  color: var(--icon-secondary);
}
</style>
