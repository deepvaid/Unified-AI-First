<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import DashboardChartWidget from '@/components/dashboards/widgets/DashboardChartWidget.vue'
import MaropayMethodMark from '@/components/maropay/MaropayMethodMark.vue'
import MaropayMoney from '@/components/maropay/MaropayMoney.vue'
import MaropayMoneyPanel from '@/components/maropay/MaropayMoneyPanel.vue'
import MaropayRatesTable from '@/components/maropay/MaropayRatesTable.vue'
import MaropayReadinessCard from '@/components/maropay/MaropayReadinessCard.vue'
import MaropayStoreMark from '@/components/maropay/MaropayStoreMark.vue'
import MaropayStoreNag from '@/components/maropay/MaropayStoreNag.vue'
import MaropaySupportAlert from '@/components/maropay/MaropaySupportAlert.vue'
import MaropayTaskList from '@/components/maropay/MaropayTaskList.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { toDecimal } from '@/maropay/money'
import { MAROPAY_BENEFITS } from '@/maropay/benefits'
import { markFor } from '@/maropay/methodMarks'
import { PAYMENT_STATUS_LABELS, PROVIDER_LABELS, STORE_ACTIVATION_LABELS } from '@/maropay/model'
import { activeConnections, cardGateway, connectionOfferedMethods, providerLabel } from '@/maropay/providers'
import { deadlineLabel } from '@/maropay/disputes'
import { checklistProgress, formatDay, moneyNow, storeCheckoutNote, storeNag, storePaymentsTarget, taskTarget } from '@/maropay/readiness'
import { dayLabel, volumeDelta, volumeSeries } from '@/maropay/volume'
import type { DashboardSeriesData } from '@/stores/dashboards/types'

// Maropay → Overview: "Can I trade, and where is my money?" (plan §2). Before
// setup it is the discovery page — value, cost, what's needed and what happens
// to the current provider (plan §3B). After that it leads with one instruction
// (a quiet row once the business is trading), then the money — the next payout
// and where the balance sits, on the ink panel — then the store still to move,
// tasks, gross volume beside the stores, recent payments and activity.

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()
const toast = useToast()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})
const params = computed(() => ({ accountId: accountId.value }))

const discovering = computed(() => maropay.account === null)
const dismissed = computed(() => maropay.discoveryDismissedAt !== null)

// ── Discovery ──────────────────────────────────────────────────────

// The same list the store's Payments page sells from (src/maropay/benefits.ts).
const BENEFITS = MAROPAY_BENEFITS

/** "Pays through Stripe, Bank deposit today" — what each store runs on before Maropay. */
function storeProviderNote(channelId: string): string {
  const setup = maropay.storeProvidersFor(channelId)
  const names = activeConnections(setup).filter((c) => connectionOfferedMethods(c, setup).length > 0).map((c) => providerLabel(c.kind))
  return names.length ? `Pays through ${names.join(', ')} today` : 'No payment provider yet'
}

const NEEDS = [
  { icon: 'building-2', title: 'Business details', desc: 'Legal name, registration number and address.' },
  { icon: 'id-card', title: 'An owner or authorised representative', desc: 'Their contact details and a photo ID.' },
  { icon: 'landmark', title: 'A bank account for payouts', desc: 'Only the last four digits are shown once it’s saved.' },
]

function scrollToRates(): void {
  const el = document.getElementById('maropay-rates')
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el?.focus({ preventScroll: true })
}

// The store's Payments page links straight to the rates ("Compare with Stripe").
onMounted(() => {
  if (route.hash === '#maropay-rates') nextTick(scrollToRates)
})

function keepCurrentProvider(): void {
  maropay.dismissDiscovery()
  toast.success('Your current payment setup stays as it is. Maropay is here whenever you want it.')
}

// ── Set up / live ──────────────────────────────────────────────────

const actionTo = computed(() => (maropay.overview.action ? maropay.routeFor(maropay.overview.action.target) : null))
const taskItems = computed(() => maropay.openTasks.map((task) => ({ task, to: maropay.routeFor(taskTarget(task)) })))
const hasLiveStore = computed(() => maropay.bindings.some((b) => b.activation === 'live'))
/** The first live store's storefront, where shoppers pay with Maropay. */
const liveStoreHref = computed(() => {
  const live = maropay.bindings.find((b) => b.activation === 'live')
  return live ? router.resolve({ name: 'StorefrontHome', params: { ...params.value, channelId: live.channelId } }).href : null
})
const hasMoney = computed(() => hasLiveStore.value || maropay.state.movements.length > 0 || maropay.payouts.length > 0)
const businessName = computed(() => maropay.business?.legalName || maropay.onboarding.business.legalName || 'Your business')

const subtitle = computed(() => {
  const account = maropay.account
  if (!account || account.setup !== 'submitted') return `${businessName.value} · Setup in progress`
  const { liveStores, linkedStores } = maropay.dimensions
  return `${businessName.value} · ${account.currency} · ${liveStores} of ${linkedStores} ${linkedStores === 1 ? 'store' : 'stores'} live`
})

/** Each linked store: live since when, or what it still checks out with and how far along it is. */
const storeRows = computed(() => maropay.bindings.map((binding) => {
  const state = maropay.storeStateFor(binding.channelId) ?? 'inactive'
  const live = binding.activation === 'live'
  const gateway = cardGateway(maropay.storeProvidersFor(binding.channelId))
  const checklist = !live && state === 'needs_setup' ? maropay.checklistFor(binding.channelId) : null
  const progress = checklist ? checklistProgress(checklist) : null
  return {
    id: binding.channelId,
    name: maropay.channelName(binding.channelId),
    status: STORE_ACTIVATION_LABELS[state],
    progress,
    note: live && binding.activatedAt
      ? `On Maropay since ${formatDay(binding.activatedAt)}`
      : !live && gateway ? `Checks out with ${providerLabel(gateway.kind)}` : storeCheckoutNote(state, maropay.storeProvidersFor(binding.channelId)),
    to: maropay.routeFor(storePaymentsTarget(binding.channelId)),
  }
}))

/** The store still to move, once another is live. */
const nag = computed(() => {
  const n = storeNag(maropay.state, maropay.now, maropay.channelFacts)
  return n ? { ...n, name: maropay.channelName(n.channelId), to: maropay.routeFor(storePaymentsTarget(n.channelId)) } : null
})

/** Disputes waiting for a reply, soonest deadline first. */
const openDisputes = computed(() => [...maropay.disputes].filter((d) => d.status === 'needs_response').sort((a, b) => Date.parse(a.respondBy) - Date.parse(b.respondBy)))
const disputeTile = computed(() => {
  const first = openDisputes.value[0]
  if (!first) return null
  const payment = maropay.paymentById(first.paymentId)
  const count = openDisputes.value.length
  return {
    title: count === 1 ? '1 dispute needs a reply' : `${count} disputes need a reply`,
    detail: `${payment?.customer.name ?? 'A shopper'} · ${first.amount.currency} ${toDecimal(first.amount)} · ${deadlineLabel(first.respondBy, maropay.now).toLowerCase()}`,
    to: count === 1 ? { name: 'MaropayDisputeDetail', params: { ...params.value, disputeId: first.id } } : { name: 'MaropayDisputes', params: params.value },
  }
})

/** Trading: the status is good news, so it's one quiet row. */
const readinessDensity = computed(() => (maropay.overview.key === 'active' || maropay.overview.key === 'activate_more' ? 'compact' : 'default'))

// ── Money ──────────────────────────────────────────────────────────

const currency = computed(() => maropay.account?.currency ?? 'USD')
const RANGES = [{ value: 7, title: 'Last 7 days' }, { value: 30, title: 'Last 30 days' }, { value: 90, title: 'Last 90 days' }]
const days = ref(30)
const volume = computed(() => volumeSeries(maropay.payments, maropay.now, days.value, currency.value))
const delta = computed(() => volumeDelta(maropay.payments, maropay.now, days.value, currency.value))
const volumeChart = computed<DashboardSeriesData>(() => ({
  kind: 'series',
  unit: 'currency',
  labels: volume.value.days.map((d) => dayLabel(d.day)),
  series: [{ name: 'Gross volume', data: volume.value.days.map((d) => Number(toDecimal(d.amount))) }],
}))
const payoutDestination = computed(() => {
  const d = maropay.account?.payoutDestination
  return d ? `${d.bankName} •••• ${d.last4}` : null
})
const upcomingRoute = computed(() => ({ name: 'MaropayPayoutDetail', params: { ...params.value, payoutId: 'upcoming' } }))

// Store operations see their stores' payments; owners and finance see them all.
const recentPayments = computed(() => {
  const assigned = maropay.actingRole === 'store_ops' ? maropay.assignedChannelIds ?? [] : null
  return [...maropay.payments]
    .filter((p) => !assigned || assigned.includes(p.channelId))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5)
})
const PAYMENT_HEADERS = [
  { title: 'Customer', key: 'customer', sortable: false },
  { title: 'Amount', key: 'amount', align: 'end' as const, sortable: false },
  { title: 'Paid with', key: 'method', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Store', key: 'store', sortable: false },
  { title: 'Date', key: 'date', align: 'end' as const, sortable: false },
]
const DATE_TIME = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

function openStore(): void {
  if (liveStoreHref.value) window.open(liveStoreHref.value, '_blank', 'noopener')
}

const unlinkedStores = computed(() => maropay.eligibleChannels.filter((c) => !maropay.bindings.some((b) => b.channelId === c.id)))

// Store operations see what happened on their stores; account and payout history is for owners and finance.
const activity = computed(() => {
  const assigned = maropay.actingRole === 'store_ops' ? maropay.assignedChannelIds ?? [] : null
  return maropay.history.filter((entry) => !assigned || (entry.channelId !== null && assigned.includes(entry.channelId))).slice(0, 6)
})

/** Declined or unsupported: nothing to activate, and the stores keep their current setup. */
const unavailable = computed(() => maropay.overview.key === 'unavailable' || maropay.overview.key === 'declined')
const keptProviders = computed(() => [...new Set(maropay.bindings.flatMap((b) => {
  const gateway = cardGateway(maropay.storeProvidersFor(b.channelId))
  return gateway ? [PROVIDER_LABELS[gateway.kind]] : []
}))])
const supportReferences = computed(() => [
  { label: 'Maropost account', value: accountId.value },
  { label: 'Maropay account', value: maropay.account?.processorAccountRef ?? '—' },
  { label: 'Business', value: businessName.value },
])

// ── First payment / first payout (plan §3G) ───────────────────────

const RECENT_MS = 14 * 86_400_000

const firstPayment = computed(() => {
  const id = maropay.milestones.firstPaymentId
  if (!id || maropay.milestones.dismissed.includes('first_payment')) return null
  const payment = maropay.paymentById(id)
  return payment && maropay.now - Date.parse(payment.createdAt) < RECENT_MS ? payment : null
})

const firstPayout = computed(() => {
  const id = maropay.milestones.firstPayoutId
  if (!id || maropay.milestones.dismissed.includes('first_payout')) return null
  const payout = maropay.payoutById(id)
  return payout && maropay.now - Date.parse(payout.createdAt) < RECENT_MS ? payout : null
})

/** One celebration at a time: the first payment and first payout share an alert. */
const milestone = computed(() => {
  const payment = firstPayment.value
  const payout = firstPayout.value
  if (!payment && !payout) return null
  const title = payment && payout
    ? 'Your first payment and payout came through'
    : payment ? 'Your first Maropay payment came through'
      : payout!.status === 'paid' ? 'Your first payout was sent to your bank' : 'Your first payout is on its way'
  return { title, payment, payout }
})

function dismissMilestone(): void {
  if (firstPayment.value) maropay.dismissMilestone('first_payment')
  if (firstPayout.value) maropay.dismissMilestone('first_payout')
}

function openPayment(paymentId: string): void {
  void router.push({ name: 'MaropayPaymentDetail', params: { ...params.value, paymentId } })
}

function openPayout(payoutId: string): void {
  void router.push({ name: 'MaropayPayoutDetail', params: { ...params.value, payoutId } })
}
</script>

<template>
  <!-- ── Discovery: before setup starts ─────────────────────────── -->
  <div v-if="discovering" class="d-flex flex-column gap-5">
    <MpPageHeader
      title="Maropay"
      :emphasis="dismissed ? 'default' : 'prominent'"
      :subtitle="dismissed
        ? 'You’re keeping your current payment setup. Maropay is here whenever you want it.'
        : 'Accept payments and manage your money from Maropost.'"
    >
      <template #actions>
        <v-tooltip :disabled="maropay.can('edit_onboarding')" text="Only owners and finance users can set up Maropay" location="bottom">
          <template #activator="{ props: tip }">
            <span v-bind="tip">
              <v-btn
                color="primary"
                :variant="dismissed ? 'outlined' : 'flat'"
                class="text-none"
                prepend-icon="wallet"
                :disabled="!maropay.can('edit_onboarding')"
                :to="{ name: 'MaropaySetup', params }"
              >
                Set up Maropay
              </v-btn>
            </span>
          </template>
        </v-tooltip>
        <template v-if="!dismissed">
          <v-btn variant="outlined" class="text-none" @click="scrollToRates">View rates</v-btn>
          <v-btn variant="text" class="text-none" @click="keepCurrentProvider">Keep my current provider</v-btn>
        </template>
      </template>
    </MpPageHeader>

    <div class="maropay-overview__split">
      <v-card flat border rounded="lg" class="mp-card-inset">
        <MpSectionHeader title="What you get" :heading-level="2" />
        <MpListRow v-for="item in BENEFITS" :key="item.title" variant="divided" :title="item.title" :subtitle="item.desc">
          <template #lead><v-icon size="16" class="maropay-overview__icon">{{ item.icon }}</v-icon></template>
        </MpListRow>
      </v-card>

      <v-card flat border rounded="lg" class="mp-card-inset">
        <MpSectionHeader title="What you’ll need" description="About 10 minutes. Your progress is saved as you go." :heading-level="2" />
        <MpListRow v-for="item in NEEDS" :key="item.title" variant="divided" :title="item.title" :subtitle="item.desc">
          <template #lead><v-icon size="16" class="maropay-overview__icon">{{ item.icon }}</v-icon></template>
        </MpListRow>
      </v-card>
    </div>

    <v-card id="maropay-rates" flat border rounded="lg" class="mp-card-inset" tabindex="-1">
      <MpSectionHeader title="What it costs" description="You pay per transaction. There’s no monthly Maropay fee." :heading-level="2" />
      <MaropayRatesTable :methods="maropay.methods" hide-unavailable />
    </v-card>

    <div class="maropay-overview__split">
      <v-card flat border rounded="lg" class="mp-card-inset">
        <MpSectionHeader
          title="Your stores"
          description="Each store keeps its current payment setup until you activate Maropay on it."
          :heading-level="2"
        />
        <template v-if="maropay.eligibleChannels.length">
          <MpListRow
            v-for="store in maropay.eligibleChannels"
            :key="store.id"
            variant="divided"
            :title="store.name"
            :subtitle="storeProviderNote(store.id)"
            meta="Keeps its current setup"
            :to="{ name: 'StorePayments', params: { ...params, channelId: store.id } }"
          >
            <template #lead><v-icon size="16" class="maropay-overview__icon">globe</v-icon></template>
          </MpListRow>
        </template>
        <MpEmptyState
          v-else
          icon="store"
          title="No Maropost web stores yet"
          description="Maropay takes payments for Maropost web stores. Add one when you’re ready to sell online."
          :heading-level="3"
          action-label="Go to sales channels"
          @action="router.push({ name: 'SalesChannels', params })"
        />
      </v-card>

      <v-card flat border rounded="lg" class="mp-card-inset">
        <MpSectionHeader
          icon="shield-check"
          title="How verification works"
          description="Our payments partner verifies your business and the people behind it, and you’ll review their agreement before you submit. Submitting isn’t approval — once you’re verified, you choose when each store switches."
          :heading-level="2"
        />
      </v-card>
    </div>
  </div>

  <!-- ── Set up or live ─────────────────────────────────────────── -->
  <div v-else class="d-flex flex-column gap-5">
    <MpPageHeader title="Maropay" :subtitle="subtitle">
      <template #actions>
        <!-- hide-details: a toolbar control with no message of its own, kept flush at control height. -->
        <v-select
          v-if="hasMoney"
          v-model="days"
          :items="RANGES"
          aria-label="Volume window"
          density="compact"
          hide-details
          prepend-inner-icon="calendar"
          class="maropay-overview__range"
        />
        <v-btn
          v-if="liveStoreHref"
          variant="outlined"
          class="text-none"
          prepend-icon="store"
          append-icon="external-link"
          :href="liveStoreHref"
          target="_blank"
          rel="noopener"
        >
          View your store
        </v-btn>
      </template>
    </MpPageHeader>

    <MaropayReadinessCard :instruction="maropay.overview" :dimensions="maropay.dimensions" :action-to="actionTo" :density="readinessDensity">
      <template v-if="unavailable" #footer>
        <p class="maropay-overview__note">
          Nothing changed at checkout. {{ keptProviders.length
            ? `Your stores keep taking payments with ${keptProviders.join(' and ')}.`
            : 'Your stores keep their current payment setup.' }}
        </p>
      </template>
    </MaropayReadinessCard>

    <!-- Only a declined verification is a decision; an unsupported country is still the merchant's answer. -->
    <MaropaySupportAlert
      v-if="unavailable && maropay.account?.verification === 'rejected'"
      emphasis="prominent"
      title="Ask for this decision to be reviewed"
      message="Maropost support can ask our payments partner to look at the decision again. Approval isn’t guaranteed."
      :references="supportReferences"
    />

    <MpAlert v-if="milestone" tone="success" :title="milestone.title" dismissible @dismiss="dismissMilestone">
      <template v-if="milestone.payment">
        {{ milestone.payment.orderNumber ? `Order ${milestone.payment.orderNumber} · ` : '' }}<MaropayMoney :amount="milestone.payment.amount" /> · {{ milestone.payment.methodLabel }}.
      </template>
      <template v-if="milestone.payout">
        <MaropayMoney :amount="milestone.payout.amount" /> to {{ milestone.payout.destination.bankName }} •••• {{ milestone.payout.destination.last4 }}{{ milestone.payout.arrivalEstimate && milestone.payout.status === 'in_transit' ? ` — estimated arrival ${formatDay(milestone.payout.arrivalEstimate)}` : '' }}.
      </template>
      {{ milestone.payout ? '“Sent to bank” means we sent it; your bank shows it once it clears.' : 'The money reaches your bank with a payout, which happens separately.' }}
      <template #actions>
        <v-btn v-if="milestone.payment" size="small" variant="outlined" class="text-none" @click="openPayment(milestone.payment.id)">View payment</v-btn>
        <v-btn v-if="milestone.payout" size="small" variant="outlined" class="text-none" @click="openPayout(milestone.payout.id)">View payout</v-btn>
      </template>
    </MpAlert>

    <!-- The money leads once there is any: the next payout and where the balance sits, one panel per currency. -->
    <template v-if="hasMoney">
      <template v-if="maropay.can('view_balances')">
        <MaropayMoneyPanel
          v-for="balance in maropay.balances"
          :key="balance.currency"
          :balance="balance"
          :upcoming="maropay.upcomingPayout"
          :buckets="moneyNow(maropay.state, balance, maropay.now)"
          :destination="payoutDestination"
          :upcoming-to="upcomingRoute"
        />
      </template>
      <v-card v-else flat border rounded="lg" class="mp-card-inset">
        <MpSectionHeader title="Balance" :heading-level="2" />
        <MpEmptyState
          icon="lock"
          title="Balances are for owners and finance"
          description="You can still see payments for your stores in Transactions."
          :heading-level="3"
        />
      </v-card>
    </template>

    <MaropayStoreNag v-if="nag" :store-name="nag.name" :gateway="nag.gateway" :done="nag.done" :total="nag.total" :to="nag.to" />

    <MaropayTaskList v-if="taskItems.length" :items="taskItems" :now="maropay.now" />

    <div class="maropay-overview__split">
      <v-card flat border rounded="lg" class="mp-card-inset">
        <MpSectionHeader title="Gross volume" :description="`${RANGES.find((r) => r.value === days)?.title} · ${currency}`" :heading-level="2">
          <template #actions>
            <v-btn size="small" variant="text" class="text-none" append-icon="arrow-right" :to="{ name: 'MaropayTransactions', params }">Transactions</v-btn>
          </template>
        </MpSectionHeader>
        <template v-if="volume.count">
          <div class="maropay-overview__total">
            <MaropayMoney :amount="volume.total" emphasis="prominent" />
            <v-chip
              v-if="delta.pct !== null"
              size="x-small"
              variant="tonal"
              :color="delta.pct >= 0 ? 'success' : 'error'"
              :prepend-icon="delta.pct >= 0 ? 'trending-up' : 'trending-down'"
              class="maropay-overview__delta"
            >
              <span class="d-sr-only">{{ delta.pct >= 0 ? 'Up' : 'Down' }}</span>{{ Math.abs(delta.pct) }}%<span class="d-sr-only"> against the previous {{ days }} days</span>
            </v-chip>
            <span class="maropay-overview__caption">{{ volume.count }} {{ volume.count === 1 ? 'payment' : 'payments' }} captured</span>
          </div>
          <DashboardChartWidget :data="volumeChart" widget-type="timeseries" chart-variant="stacked-column" />
        </template>
        <MpEmptyState
          v-else
          icon="chart-line"
          :title="`No payments in the last ${days} days`"
          :description="liveStoreHref ? 'Payments show up here as soon as a shopper pays.' : 'Payments show up here once a store is live on Maropay.'"
          :action-label="liveStoreHref ? 'Open your store' : undefined"
          action-icon="external-link"
          :heading-level="3"
          @action="openStore"
        />
      </v-card>

      <v-card flat border rounded="lg" class="mp-card-inset">
        <MpSectionHeader title="Stores" :heading-level="2" description="Activation is per store — linking a store doesn’t switch its checkout." />
        <MpListRow
          v-for="store in storeRows"
          :key="store.id"
          variant="divided"
          :to="store.to"
          :title="store.name"
          :subtitle="store.note"
        >
          <template #lead><MaropayStoreMark :name="store.name" /></template>
          <template #trailing>
            <v-chip v-if="store.progress" size="small" variant="tonal" color="warning" class="maropay-overview__progress">{{ store.progress.done }} of {{ store.progress.total }}</v-chip>
            <MpStatusChip v-else :status="store.status" type="readiness" size="sm" show-icon />
            <v-icon size="16" class="ms-2 maropay-overview__icon">chevron-right</v-icon>
          </template>
        </MpListRow>
        <MpEmptyState v-if="!storeRows.length" icon="store" title="No stores linked yet" :heading-level="3" />
        <div v-if="unlinkedStores.length && maropay.account?.setup === 'submitted' && !unavailable && !maropay.account.closedAt && maropay.can('link_store')" class="maropay-overview__more">
          <span>{{ unlinkedStores.length }} more Maropost {{ unlinkedStores.length === 1 ? 'store can' : 'stores can' }} use Maropay.</span>
          <v-btn
            size="small"
            variant="text"
            class="text-none"
            append-icon="arrow-right"
            :to="{ name: 'MaropaySettings', params, query: { tab: 'stores' } }"
          >
            Link a store
          </v-btn>
        </div>
        <MpAlert v-if="disputeTile" tone="error" live="off" :title="disputeTile.title" class="maropay-overview__dispute">
          {{ disputeTile.detail }}
          <template #actions>
            <v-btn size="small" variant="text" class="text-none" append-icon="arrow-right" :to="disputeTile.to">Respond</v-btn>
          </template>
        </MpAlert>
      </v-card>
    </div>

    <v-card v-if="hasMoney" flat border rounded="lg" class="mp-card-inset">
      <MpSectionHeader title="Recent payments" :heading-level="2">
        <template #actions>
          <v-btn size="small" variant="text" class="text-none" append-icon="arrow-right" :to="{ name: 'MaropayTransactions', params }">View all</v-btn>
        </template>
      </MpSectionHeader>
      <v-data-table
        v-if="recentPayments.length"
        :headers="PAYMENT_HEADERS"
        :items="recentPayments"
        item-value="id"
        hide-default-footer
        class="maropay-overview__payments"
        @click:row="(_: unknown, row: { item: (typeof recentPayments)[number] }) => openPayment(row.item.id)"
      >
        <template #item.customer="{ item }"><span class="font-weight-medium">{{ item.customer.name }}</span></template>
        <template #item.amount="{ item }">
          <MaropayMoney :amount="item.amount" :class="{ 'mp-strike': item.status === 'refunded' }" />
        </template>
        <template #item.method="{ item }">
          <span class="d-inline-flex align-center ga-2">
            <MaropayMethodMark :mark="markFor(item.methodId, item.methodLabel)" size="sm" decorative />
            {{ item.methodLabel }}
          </span>
        </template>
        <template #item.status="{ item }"><MpStatusChip :status="PAYMENT_STATUS_LABELS[item.status]" type="payment" size="sm" /></template>
        <template #item.store="{ item }">{{ maropay.channelName(item.channelId) }}</template>
        <template #item.date="{ item }"><span class="text-medium-emphasis">{{ DATE_TIME.format(new Date(item.createdAt)) }}</span></template>
      </v-data-table>
      <MpEmptyState v-else icon="receipt" title="No payments yet" description="Payments show up here as soon as a shopper pays." :heading-level="3" />
    </v-card>

    <v-card flat border rounded="lg" class="mp-card-inset">
      <MpSectionHeader title="Recent activity" :heading-level="2" />
      <MpListRow v-for="entry in activity" :key="entry.id" variant="divided" :title="entry.text" :subtitle="formatDay(entry.at)" />
      <MpEmptyState v-if="!activity.length" icon="history" title="Nothing yet" :heading-level="3" />
    </v-card>
  </div>
</template>

<style scoped lang="scss">
/* Two cards side by side, stacking on their own below the split breakpoint. */
.maropay-overview__split {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: var(--mp-space-20);
  align-items: start;
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .maropay-overview__split {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* The window select is a toolbar control: control height, searchWidth-ish, no message headroom. */
.maropay-overview__range {
  flex: 0 1 auto;
  min-width: var(--mp-space-80);
  width: calc(var(--mp-component-toolbar-searchMinWidth) * 0.7);
}

.maropay-overview__total {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--mp-space-4) var(--mp-space-12);
  margin-bottom: var(--mp-space-8);
}

.maropay-overview__delta {
  align-self: center;
  font-variant-numeric: tabular-nums;
}

.maropay-overview__progress {
  font-variant-numeric: tabular-nums;
}

.maropay-overview__dispute {
  margin-top: var(--mp-space-16);
}

/* Rows open the payment; the cursor says so. */
.maropay-overview__payments :where(tbody tr) {
  cursor: pointer;
}

.maropay-overview__caption,
.maropay-overview__note {
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}

.maropay-overview__note {
  margin: 0;
}

.maropay-overview__icon {
  color: var(--icon-secondary);
}

.maropay-overview__more {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
  flex-wrap: wrap;
  margin-top: var(--mp-space-12);
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
}

#maropay-rates:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
</style>
