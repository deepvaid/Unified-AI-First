<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import DashboardChartWidget from '@/components/dashboards/widgets/DashboardChartWidget.vue'
import MaropayBalanceSummary from '@/components/maropay/MaropayBalanceSummary.vue'
import MaropayMoney from '@/components/maropay/MaropayMoney.vue'
import MaropayRatesTable from '@/components/maropay/MaropayRatesTable.vue'
import MaropayReadinessCard from '@/components/maropay/MaropayReadinessCard.vue'
import MaropaySupportAlert from '@/components/maropay/MaropaySupportAlert.vue'
import MaropayTaskList from '@/components/maropay/MaropayTaskList.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { toDecimal } from '@/maropay/money'
import { MAROPAY_BENEFITS } from '@/maropay/benefits'
import { PROVIDER_LABELS, STORE_ACTIVATION_LABELS } from '@/maropay/model'
import { activeConnections, cardGateway, connectionOfferedMethods, providerLabel } from '@/maropay/providers'
import { formatDay, storeCheckoutNote, storePaymentsTarget, taskTarget } from '@/maropay/readiness'
import { dayLabel, volumeSeries } from '@/maropay/volume'
import type { DashboardSeriesData } from '@/stores/dashboards/types'

// Maropay → Overview: "Can I trade, and where is my money?" (plan §2). Before
// setup it is the discovery page — value, cost, what's needed and what happens
// to the current provider (plan §3B). After that it leads with one instruction
// (a quiet row once the business is trading), then tasks, then the money — gross
// volume beside the balance, Stripe-style — then stores and recent activity.

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

const storeRows = computed(() => maropay.bindings.map((binding) => {
  const state = maropay.storeStateFor(binding.channelId) ?? 'inactive'
  return {
    id: binding.channelId,
    name: maropay.channelName(binding.channelId),
    status: STORE_ACTIVATION_LABELS[state],
    note: storeCheckoutNote(state, maropay.storeProvidersFor(binding.channelId)),
    to: maropay.routeFor(storePaymentsTarget(binding.channelId)),
  }
}))

/** Trading: the status is good news, so it's one quiet row. */
const readinessDensity = computed(() => (maropay.overview.key === 'active' || maropay.overview.key === 'activate_more' ? 'compact' : 'default'))

// ── Money ──────────────────────────────────────────────────────────

const currency = computed(() => maropay.account?.currency ?? 'USD')
const volume = computed(() => volumeSeries(maropay.payments, maropay.now, 30, currency.value))
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

    <MaropayTaskList v-if="taskItems.length" :items="taskItems" :now="maropay.now" />

    <div v-if="hasMoney" class="maropay-overview__money">
      <!-- The balance comes first in reading order, so it leads on a phone and for screen readers. -->
      <div class="maropay-overview__balance">
        <template v-if="maropay.can('view_balances')">
          <MaropayBalanceSummary
            v-for="balance in maropay.balances"
            :key="balance.currency"
            :balance="balance"
            :upcoming="maropay.upcomingPayout"
            :destination="payoutDestination"
            :description="`${balance.currency} · estimated from what has settled`"
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
      </div>

      <v-card flat border rounded="lg" class="mp-card-inset maropay-overview__volume">
        <MpSectionHeader title="Gross volume" :description="`Last 30 days · ${currency}`" :heading-level="2">
          <template #actions>
            <v-btn size="small" variant="text" class="text-none" append-icon="arrow-right" :to="{ name: 'MaropayTransactions', params }">Transactions</v-btn>
          </template>
        </MpSectionHeader>
        <template v-if="volume.count">
          <div class="maropay-overview__total">
            <MaropayMoney :amount="volume.total" emphasis="prominent" />
            <span class="maropay-overview__caption">{{ volume.count }} {{ volume.count === 1 ? 'payment' : 'payments' }} captured</span>
          </div>
          <DashboardChartWidget :data="volumeChart" widget-type="timeseries" chart-variant="stacked-column" />
        </template>
        <MpEmptyState
          v-else
          icon="chart-line"
          title="No payments in the last 30 days"
          :description="liveStoreHref ? 'Payments show up here as soon as a shopper pays.' : 'Payments show up here once a store is live on Maropay.'"
          :action-label="liveStoreHref ? 'Open your store' : undefined"
          action-icon="external-link"
          :heading-level="3"
          @action="openStore"
        />
      </v-card>
    </div>

    <div class="maropay-overview__split">
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
          <template #lead><v-icon size="16" class="maropay-overview__icon">globe</v-icon></template>
          <template #trailing>
            <MpStatusChip :status="store.status" type="readiness" size="sm" show-icon />
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
      </v-card>

      <v-card flat border rounded="lg" class="mp-card-inset">
        <MpSectionHeader title="Recent activity" :heading-level="2" />
        <MpListRow v-for="entry in activity" :key="entry.id" variant="divided" :title="entry.text" :subtitle="formatDay(entry.at)" />
        <MpEmptyState v-if="!activity.length" icon="history" title="Nothing yet" :heading-level="3" />
      </v-card>
    </div>
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

/* Gross volume beside the balance; the balance leads the DOM, the grid puts volume first on wide screens. */
.maropay-overview__money {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  grid-template-areas: 'volume balance';
  gap: var(--mp-space-20);
  align-items: start;
}

.maropay-overview__balance {
  grid-area: balance;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
  min-width: 0;
}

.maropay-overview__volume {
  grid-area: volume;
  min-width: 0;
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .maropay-overview__split {
    grid-template-columns: minmax(0, 1fr);
  }

  .maropay-overview__money {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'balance' 'volume';
  }
}

.maropay-overview__total {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--mp-space-4) var(--mp-space-12);
  margin-bottom: var(--mp-space-8);
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
