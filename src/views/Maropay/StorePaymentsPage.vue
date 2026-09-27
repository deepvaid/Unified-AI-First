<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayActingRoleBanner from '@/components/maropay/MaropayActingRoleBanner.vue'
import MaropayActivationChecklist from '@/components/maropay/MaropayActivationChecklist.vue'
import MaropayMethodRow from '@/components/maropay/MaropayMethodRow.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { METHOD_CATEGORY_LABELS, PROVIDER_LABELS, STORE_ACTIVATION_LABELS } from '@/maropay/model'
import type { CaptureMode, MethodCategory, MethodStatus, PaymentMethodCatalogEntry } from '@/maropay/model'
import { formatDay, payoutScheduleLabel, taskTarget } from '@/maropay/readiness'
import type { ActivationCheckItem, MigrationRow } from '@/maropay/readiness'

// Store editor → Payments: how one store takes money online, and the switch to
// Maropay (plan §3D–3E). The business is verified once; each store activates on
// its own — after its checklist, its methods, a test checkout and the owner's
// review of what changes. Activation and deactivation only change where new
// checkouts go: payments already taken stay with the provider that took them.

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
const overviewRoute = computed(() => ({ name: 'MaropayOverview', params: { accountId: accountId.value } }))

const binding = computed(() => maropay.bindingFor(channelId.value))
const live = computed(() => binding.value?.activation === 'live')
const previousName = computed(() => (binding.value?.previousProvider ? PROVIDER_LABELS[binding.value.previousProvider.provider] : null))

const canManage = computed(() => maropay.can('manage_methods', channelId.value))
const canActivate = computed(() => maropay.can('activate_store', channelId.value))
const ownerOnly = 'Only the business owner can change this.'

const assignedStoreNames = computed(() => (maropay.assignedChannelIds ?? []).map((id) => maropay.channelName(id)))

/** English list: "Cards, Apple Pay and Google Pay". */
function list(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

// ── Which page this is ─────────────────────────────────────────────

type View = 'pos' | 'other_platform' | 'restricted' | 'no_account' | 'setup' | 'unavailable' | 'unlinked' | 'store'

const view = computed<View>(() => {
  const c = channel.value
  if (c?.type !== 'web_store') return 'pos'
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

const routing = computed(() => {
  const b = binding.value
  if (b?.activation === 'live') {
    const since = b.activatedAt ? ` since ${formatDay(b.activatedAt)}` : ''
    return `New checkouts on ${storeName.value} have used Maropay${since}.${previousName.value ? ` Payments taken before then stay with ${previousName.value}.` : ''}`
  }
  if (previousName.value) {
    return `New checkouts on ${storeName.value} use ${previousName.value} until you activate Maropay. Payments already taken stay with the provider that took them.`
  }
  return `${storeName.value} keeps its current payment setup until you activate Maropay.`
})

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
  if (item.key === 'store_prerequisites' && channel.value?.status === 'draft') {
    return { name: 'SalesChannelDetail', params: { accountId: accountId.value, channelId: channelId.value } }
  }
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

// ── Methods ────────────────────────────────────────────────────────

type StoreMethod = PaymentMethodCatalogEntry & { status: MethodStatus }

const CATEGORY_ORDER: MethodCategory[] = ['cards', 'wallets', 'bnpl', 'local']
const storeMethods = computed(() => maropay.methodsForStore(channelId.value))
const methodGroups = computed(() =>
  CATEGORY_ORDER
    .map((category) => ({ category, label: METHOD_CATEGORY_LABELS[category], methods: storeMethods.value.filter((m) => m.category === category && m.status !== 'unavailable') }))
    .filter((group) => group.methods.length),
)
const unavailableCount = computed(() => storeMethods.value.filter((m) => m.status === 'unavailable').length)
const checkoutMethods = computed(() => maropay.checkoutMethodsFor(channelId.value))
const pendingMethods = computed(() => storeMethods.value.filter((m) => m.status === 'pending_approval'))

function methodDisabledReason(method: StoreMethod): string | null {
  if (!canManage.value) return ownerOnly
  const lastReady = live.value && checkoutMethods.value.length === 1 && checkoutMethods.value[0]!.id === method.id
  return lastReady ? 'A live store needs at least one payment method.' : null
}

function toggleMethod(method: StoreMethod, enabled: boolean): void {
  const result = maropay.setMethodEnabled(channelId.value, method.id, enabled)
  if (!result.ok) toast.error(result.error.message)
}

const setupOpen = ref(false)
const setupMethod = ref<StoreMethod | null>(null)
/** Answers go to our payments partner's review; the prototype doesn't keep them. */
const setupAnswers = ref<string[]>([])
const setupAttempted = ref(false)

function openMethodSetup(method: StoreMethod): void {
  setupMethod.value = method
  setupAnswers.value = method.requirements.map(() => '')
  setupAttempted.value = false
  setupOpen.value = true
}

function submitMethodSetup(): void {
  const method = setupMethod.value
  if (!method) return
  setupAttempted.value = true
  if (setupAnswers.value.some((answer) => !answer.trim())) return
  const result = maropay.setMethodEnabled(channelId.value, method.id, true)
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  setupOpen.value = false
  toast.success(`${method.label} requested. It turns on at checkout once our payments partner approves it.`)
}

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

// ── What changes ───────────────────────────────────────────────────

const impact = computed(() => maropay.migrationImpactFor(channelId.value))
const payoutDestination = computed(() => maropay.account?.payoutDestination ?? null)
const payoutSchedule = computed(() => (maropay.account ? payoutScheduleLabel(maropay.account.payoutSchedule) : null))

const feeSummary = computed(() => {
  const byRate = new Map<string, string[]>()
  for (const m of checkoutMethods.value) byRate.set(m.rate.label, [...(byRate.get(m.rate.label) ?? []), m.label])
  return [...byRate].map(([rate, labels]) => `${rate} for ${list(labels)}`).join(' · ')
})

const CHANGE: Record<MigrationRow['change'], { label: string; icon: string }> = {
  lower: { label: 'Lower fee', icon: 'arrow-down' },
  higher: { label: 'Higher fee', icon: 'arrow-up' },
  same: { label: 'Same fee', icon: 'equal' },
  stays: { label: 'Not moving', icon: 'minus' },
}

function markReviewed(): void {
  const result = maropay.markImpactReviewed(channelId.value)
  if (!result.ok) toast.error(result.error.message)
}

// ── Activate and deactivate ────────────────────────────────────────

const activateOpen = ref(false)
const deactivateOpen = ref(false)
const justActivated = ref(false)
const activatedAlert = ref<HTMLElement | null>(null)

const activateHint = computed(() => {
  if (!canActivate.value) return 'Only the business owner can activate Maropay.'
  const left = checklist.value?.blockedBy.length ?? 0
  return left ? `Finish the checklist first — ${left} left` : ''
})

const activateConsequences = computed(() => {
  const ready = checkoutMethods.value.map((m) => m.label)
  const pending = pendingMethods.value.map((m) => m.label)
  // Methods with no Maropay equivalent (PayPal Checkout) stay connected through the previous provider.
  const staying = (binding.value?.previousProvider?.methods ?? []).filter((m) => m.keepSeparately || !m.maropayMethodId).map((m) => m.label)
  const lines = [
    `Shoppers can pay with ${list(ready)}.${pending.length ? ` ${list(pending)} turns on once it’s approved.` : ''}`,
    previousName.value
      ? `New checkouts on ${storeName.value} go through Maropay instead of ${previousName.value}${staying.length ? ` — ${list(staying)} stays connected through ${previousName.value}` : ''}. Earlier payments, refunds and payouts stay with ${previousName.value}.`
      : `The current payment setup on ${storeName.value} stops taking new checkouts.`,
  ]
  if (payoutDestination.value && payoutSchedule.value) {
    lines.push(`Money is paid out to ${payoutDestination.value.bankName} •••• ${payoutDestination.value.last4} — ${payoutSchedule.value.toLowerCase()}.`)
  }
  if (binding.value?.captureMode === 'manual') lines.push('Payments are authorised at checkout — capture each one from its order.')
  return lines
})

const deactivateConsequences = computed(() => [
  previousName.value
    ? `New checkouts on ${storeName.value} go back to ${previousName.value} straight away.`
    : `${storeName.value} won’t take online payments until you activate Maropay again or connect another provider.`,
  'Payments already taken — with their refunds, disputes and payouts — stay in Maropay.',
  'To switch back, you’ll review the changes again first.',
])

async function activate(): Promise<void> {
  const result = maropay.activateStore(channelId.value)
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  justActivated.value = true
  await nextTick()
  activatedAlert.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  activatedAlert.value?.focus({ preventScroll: true })
}

function deactivate(): void {
  const result = maropay.deactivateStore(channelId.value)
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  justActivated.value = false
  toast.info(`Maropay stopped on ${storeName.value}. New checkouts use ${previousName.value ?? 'no online payment provider'}.`)
}

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
  <div class="d-flex flex-column gap-5">
    <MaropayActingRoleBanner :role="maropay.actingRole" :store-names="assignedStoreNames" @reset="maropay.setActingRole('owner')" />

    <MpPageHeader title="Payments" :subtitle="`How ${storeName} takes payments at checkout`">
      <template v-if="view === 'store'" #actions>
        <MpRowActionsMenu v-if="live && canActivate" ariaLabel="More payment actions">
          <MpMenuItem icon="power" title="Stop using Maropay on this store" danger @click="deactivateOpen = true" />
        </MpRowActionsMenu>
        <v-tooltip v-else-if="!live" :disabled="!activateHint" :text="activateHint" location="bottom">
          <template #activator="{ props: tip }">
            <span v-bind="tip">
              <v-btn color="primary" variant="flat" class="text-none" prepend-icon="rocket" :disabled="!!activateHint" @click="activateOpen = true">
                Activate Maropay
              </v-btn>
            </span>
          </template>
        </v-tooltip>
      </template>
    </MpPageHeader>

    <!-- ── Not a Maropay store ──────────────────────────────────── -->
    <v-card v-if="view === 'pos'" flat border rounded="lg">
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
      <div v-if="justActivated && live" ref="activatedAlert" tabindex="-1" class="maropay-store__focus">
        <MpAlert tone="success" :title="`Maropay is live on ${storeName}`" dismissible @dismiss="justActivated = false">
          New checkouts use Maropay from now on. Payments show up in Transactions, and the money reaches your bank with a payout.
          <template #actions>
            <v-btn size="small" variant="outlined" class="text-none" :to="overviewRoute">Open overview</v-btn>
            <v-btn size="small" variant="text" class="text-none" :to="{ name: 'MaropayCheckoutPreview', params: { accountId }, query: { store: channelId } }">Try checkout preview</v-btn>
          </template>
        </MpAlert>
      </div>

      <v-card flat border rounded="lg" class="maropay-store__card">
        <MpSectionHeader title="Checkout provider" :heading-level="2" />
        <dl class="mp-label-value">
          <div>
            <dt>New checkouts use</dt>
            <dd>{{ live ? 'Maropay' : previousName ?? 'Current payment setup' }}</dd>
          </div>
          <div>
            <dt>Maropay on this store</dt>
            <dd><MpStatusChip :status="STORE_ACTIVATION_LABELS[storeState]" type="readiness" size="sm" show-icon /></dd>
          </div>
        </dl>
        <p class="maropay-store__note">{{ routing }}</p>
      </v-card>

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

      <v-card id="maropay-store-methods" flat border rounded="lg" class="maropay-store__card" tabindex="-1">
        <MpSectionHeader
          title="Payment methods"
          :description="live ? 'Changes apply to new checkouts straight away.' : 'Changing methods means running the test checkout and reviewing the changes again.'"
          :heading-level="2"
        />
        <MpAlert v-if="pendingMethods.length && checkoutMethods.length" tone="info" live="off" class="mb-4">
          {{ list(checkoutMethods.map((m) => m.label)) }} can go live while {{ list(pendingMethods.map((m) => m.label)) }} {{ pendingMethods.length === 1 ? 'awaits' : 'await' }} approval.
        </MpAlert>
        <div v-for="group in methodGroups" :key="group.category" class="maropay-store__group">
          <h3 class="mp-meta-label maropay-store__group-label">{{ group.label }}</h3>
          <MaropayMethodRow
            v-for="method in group.methods"
            :key="method.id"
            :method="method"
            :disabled-reason="methodDisabledReason(method)"
            @toggle="toggleMethod(method, $event)"
            @setup="openMethodSetup(method)"
          />
        </div>
        <p v-if="unavailableCount" class="maropay-store__note">
          {{ unavailableCount }} {{ unavailableCount === 1 ? 'method isn’t' : 'methods aren’t' }} available for {{ maropay.account?.currency ?? 'USD' }} accounts.
        </p>
      </v-card>

      <v-card id="maropay-store-capture" flat border rounded="lg" class="maropay-store__card" tabindex="-1">
        <MpSectionHeader title="Capture" description="When the shopper’s money is taken." :heading-level="2" />
        <div class="maropay-store__capture">
          <MpSegmentedControl
            :model-value="binding.captureMode"
            :items="captureItems"
            ariaLabel="Capture"
            @update:model-value="setCapture"
          />
          <p class="maropay-store__note mt-0">
            {{ binding.captureMode === 'automatic'
              ? 'Payments are captured as soon as the shopper pays.'
              : 'Payments are authorised at checkout. Capture each one from its order within 7 days, or the authorisation lapses.' }}
            {{ canManage ? '' : ownerOnly }}
          </p>
        </div>
        <MpAlert v-if="captureConflicts.length" tone="warning" live="off" class="mt-4" :title="`${list(captureConflicts.map((m) => m.label))} can’t be used with manual capture`">
          Turn {{ captureConflicts.length === 1 ? 'it' : 'them' }} off or switch to automatic capture before you activate.
        </MpAlert>
      </v-card>

      <v-card v-if="!live" id="maropay-store-impact" flat border rounded="lg" class="maropay-store__card" tabindex="-1">
        <MpSectionHeader title="What changes when you activate" description="The business owner confirms this before the store switches." :heading-level="2" />
        <dl class="mp-label-value">
          <div>
            <dt>Checkout provider</dt>
            <dd>{{ previousName ? `${previousName} → Maropay` : 'Maropay' }}</dd>
          </div>
          <div>
            <dt>Shoppers can pay with</dt>
            <dd>{{ checkoutMethods.length ? list(checkoutMethods.map((m) => m.label)) : 'Nothing yet — turn on a method' }}</dd>
          </div>
          <div>
            <dt>Fees</dt>
            <dd>{{ feeSummary || '—' }}</dd>
          </div>
          <div>
            <dt>Payouts</dt>
            <dd>{{ payoutDestination ? `${payoutDestination.bankName} •••• ${payoutDestination.last4} · ${payoutSchedule}` : 'No payout account yet' }}</dd>
          </div>
          <div>
            <dt>Capture</dt>
            <dd>{{ binding.captureMode === 'automatic' ? 'Automatic' : 'Manual — from each order' }}</dd>
          </div>
          <div v-if="pendingMethods.length">
            <dt>Awaiting approval</dt>
            <dd>{{ list(pendingMethods.map((m) => m.label)) }}</dd>
          </div>
        </dl>

        <template v-if="impact && previousName">
          <h3 class="maropay-store__subhead">Switching from {{ previousName }}</h3>
          <v-table density="compact" class="maropay-store__table">
            <thead>
              <tr>
                <th scope="col">Method</th>
                <th scope="col" class="text-end">With {{ previousName }}</th>
                <th scope="col">With Maropay</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in impact.rows" :key="row.label">
                <td class="maropay-store__method">{{ row.label }}</td>
                <td class="text-end maropay-store__rate">{{ row.currentRate }}</td>
                <td>{{ row.maropayLabel ? `${row.maropayLabel} · ${row.maropayRate}` : `Stays with ${previousName}` }}</td>
                <td>
                  <span class="maropay-store__change" :class="`maropay-store__change--${row.change}`">
                    <v-icon size="14">{{ CHANGE[row.change].icon }}</v-icon>{{ CHANGE[row.change].label }}
                  </span>
                </td>
              </tr>
            </tbody>
          </v-table>
          <p class="maropay-store__note">Fees compared on a $100.00 card payment. Illustrative Maropay rates.</p>

          <div class="maropay-store__lists">
            <div>
              <h4 class="mp-meta-label">Moves to Maropay</h4>
              <ul><li v-for="line in impact.transfers" :key="line">{{ line }}</li></ul>
            </div>
            <div>
              <h4 class="mp-meta-label">Stays with {{ previousName }}</h4>
              <ul><li v-for="line in impact.staysWithPrevious" :key="line">{{ line }}</li></ul>
            </div>
            <div v-if="impact.needsSetup.length">
              <h4 class="mp-meta-label">Worth knowing</h4>
              <ul><li v-for="line in impact.needsSetup" :key="line">{{ line }}</li></ul>
            </div>
          </div>
          <MpAlert v-if="impact.blocking.length" tone="error" live="off" title="This store can’t switch yet" class="mt-4">
            <ul class="maropay-store__plain-list"><li v-for="line in impact.blocking" :key="line">{{ line }}</li></ul>
          </MpAlert>
        </template>

        <div class="maropay-store__review">
          <template v-if="binding.impactReviewedAt">
            <v-icon size="18" class="maropay-store__reviewed-icon">circle-check</v-icon>
            <span>Reviewed on {{ formatDay(binding.impactReviewedAt) }}</span>
          </template>
          <template v-else>
            <v-btn variant="outlined" class="text-none" prepend-icon="list-checks" :disabled="!canActivate" @click="markReviewed">
              I’ve reviewed these changes
            </v-btn>
            <span v-if="!canActivate" class="maropay-store__note mt-0">Only the business owner confirms this.</span>
          </template>
        </div>
      </v-card>

      <v-card flat border rounded="lg" class="maropay-store__card">
        <MpSectionHeader title="Activity on this store" :heading-level="2" />
        <MpListRow v-for="entry in activity" :key="entry.id" variant="divided">
          <span class="maropay-store__row-sub">{{ formatDay(entry.at) }}</span>
          <span class="maropay-store__row-title">{{ entry.text }}</span>
        </MpListRow>
        <p v-if="!activity.length" class="maropay-store__note mt-0">Nothing yet.</p>
      </v-card>

      <v-card v-if="showDemo" flat border rounded="lg" class="maropay-store__card">
        <MpSectionHeader icon="flask-conical" title="Simulate our payments partner" description="Demo controls — not part of the product." :heading-level="2" />
        <MpListRow v-for="method in pendingMethods" :key="method.id" variant="divided">
          <span class="maropay-store__row-title">{{ method.label }} is awaiting approval</span>
          <template #trailing>
            <span class="d-flex ga-2">
              <v-btn size="small" variant="outlined" class="text-none" @click="decideMethod(method, true)">Approve</v-btn>
              <v-btn size="small" variant="text" class="text-none" @click="decideMethod(method, false)">Decline</v-btn>
            </span>
          </template>
        </MpListRow>
        <v-checkbox
          v-if="!live"
          :model-value="maropay.failures.checkoutValidationFails"
          label="Make test checkouts fail"
          @update:model-value="maropay.setFailure('checkoutValidationFails', Boolean($event))"
        />
      </v-card>
    </template>

    <MpFormDrawer v-model="setupOpen" :title="`Set up ${setupMethod?.label ?? 'payment method'}`" subtitle="Our payments partner reviews this before shoppers see it." size="sm">
      <template v-if="setupMethod">
        <MpFormGrid>
          <v-text-field
            v-for="(requirement, index) in setupMethod.requirements"
            :key="requirement"
            v-model="setupAnswers[index]"
            :label="`${requirement} *`"
            :error-messages="setupAttempted && !setupAnswers[index]?.trim() ? 'Answer this so the review can start.' : undefined"
          />
        </MpFormGrid>
        <MpAlert tone="info" live="off">
          Your other methods keep working while {{ setupMethod.label }} is reviewed. It turns on at checkout once it’s approved.
        </MpAlert>
      </template>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="setupOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="submitMethodSetup">Submit for review</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="activateOpen"
      :title="`Activate Maropay on ${storeName}?`"
      message="New checkouts start using Maropay straight away."
      :consequences="activateConsequences"
      confirm-label="Activate Maropay"
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
.maropay-store__card {
  padding: var(--mp-component-card-padding);
}

.maropay-store__card:focus-visible,
.maropay-store__focus:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.maropay-store__focus:focus {
  outline: none;
}

.maropay-store__note {
  margin: var(--mp-space-12) 0 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}

.maropay-store__group + .maropay-store__group {
  margin-top: var(--mp-space-16);
}

.maropay-store__group-label {
  margin: 0 0 var(--mp-space-4);
  color: var(--muted);
}

.maropay-store__capture {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-16);
}

.maropay-store__capture .maropay-store__note {
  flex: 1 1 var(--mp-component-state-measure);
}

.maropay-store__subhead {
  margin: var(--mp-space-24) 0 var(--mp-space-8);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.maropay-store__table {
  background: transparent;
}

.maropay-store__method {
  font-weight: var(--mp-fontWeight-medium);
  white-space: nowrap;
}

.maropay-store__rate {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.maropay-store__change {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  font-size: var(--mp-fontSize-13);
  white-space: nowrap;
  color: var(--text-secondary);
}

.maropay-store__change--lower {
  color: var(--pos-ink);
}

.maropay-store__change--higher {
  color: var(--warn-ink);
}

/* One column per list, side by side; stacked below the split breakpoint. */
.maropay-store__lists {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: var(--mp-space-16) var(--mp-space-32);
  margin-top: var(--mp-space-20);
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .maropay-store__lists {
    grid-auto-flow: row;
  }
}

.maropay-store__lists ul,
.maropay-store__plain-list {
  margin: var(--mp-space-8) 0 0;
  padding-inline-start: var(--mp-space-20);
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-primary);
}

.maropay-store__lists li + li {
  margin-top: var(--mp-space-4);
}

.maropay-store__review {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-12);
  margin-top: var(--mp-space-24);
  font-size: var(--mp-fontSize-14);
  color: var(--text-primary);
}

.maropay-store__reviewed-icon {
  color: var(--pos-ink);
}

.maropay-store__row-title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: var(--mp-lineHeight-snug);
  color: var(--text-primary);
}

.maropay-store__row-sub {
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}
</style>
