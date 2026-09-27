<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayBalanceCards from '@/components/maropay/MaropayBalanceCards.vue'
import MaropayMoney from '@/components/maropay/MaropayMoney.vue'
import MaropayRatesTable from '@/components/maropay/MaropayRatesTable.vue'
import MaropayReadinessCard from '@/components/maropay/MaropayReadinessCard.vue'
import MaropaySupportAlert from '@/components/maropay/MaropaySupportAlert.vue'
import MaropayTaskList from '@/components/maropay/MaropayTaskList.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { PROVIDER_LABELS, STORE_ACTIVATION_LABELS } from '@/maropay/model'
import { formatDay, taskTarget } from '@/maropay/readiness'

// Maropay → Overview: "Can I trade, and where is my money?" (plan §2). Before
// setup it is the discovery page — value, cost, what's needed and what happens
// to the current provider (plan §3B). After that it leads with one instruction,
// then tasks, balances, stores and recent activity.

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

const BENEFITS = [
  { icon: 'receipt', title: 'Payments beside your orders', desc: 'Capture, refund and investigate a payment from the order you’re already looking at.' },
  { icon: 'landmark', title: 'Payouts you can trace', desc: 'Every payout breaks down into the payments, fees, refunds and disputes inside it.' },
  { icon: 'shield-alert', title: 'Disputes with the deadline up front', desc: 'Respond with an evidence checklist before the shopper’s bank decides.' },
  { icon: 'store', title: 'One business, every store', desc: 'Verify your business once, then switch stores on one at a time.' },
  { icon: 'life-buoy', title: 'Maropost support first', desc: 'One place to ask about an order and the payment behind it.' },
]

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
const hasMoney = computed(() => hasLiveStore.value || maropay.state.movements.length > 0 || maropay.payouts.length > 0)
const businessName = computed(() => maropay.business?.legalName || maropay.onboarding.business.legalName || 'Your business')

const subtitle = computed(() => {
  const account = maropay.account
  if (!account || account.setup !== 'submitted') return `${businessName.value} · Setup in progress`
  const { liveStores, linkedStores } = maropay.dimensions
  return `${businessName.value} · ${account.currency} · ${liveStores} of ${linkedStores} ${linkedStores === 1 ? 'store' : 'stores'} live`
})

const storeRows = computed(() => maropay.bindings.map((binding) => {
  const channel = maropay.eligibleChannels.find((c) => c.id === binding.channelId)
  const state = maropay.storeStateFor(binding.channelId) ?? 'inactive'
  const provider = binding.previousProvider ? PROVIDER_LABELS[binding.previousProvider.provider] : null
  return {
    id: binding.channelId,
    name: maropay.channelName(binding.channelId),
    domain: channel?.domain ?? null,
    status: STORE_ACTIVATION_LABELS[state],
    note: state === 'live' ? 'Checkout uses Maropay' : provider ? `Checkout uses ${provider}` : 'Keeps its current payment setup',
    to: { name: 'StorePayments', params: { accountId: accountId.value, channelId: binding.channelId } },
  }
}))

const unlinkedStores = computed(() => maropay.eligibleChannels.filter((c) => !maropay.bindings.some((b) => b.channelId === c.id)))

// Store operations see what happened on their stores; account and payout history is for owners and finance.
const activity = computed(() => {
  const assigned = maropay.actingRole === 'store_ops' ? maropay.assignedChannelIds ?? [] : null
  return maropay.history.filter((entry) => !assigned || (entry.channelId !== null && assigned.includes(entry.channelId))).slice(0, 6)
})

/** Declined or unsupported: nothing to activate, and the stores keep their current setup. */
const unavailable = computed(() => maropay.overview.key === 'unavailable' || maropay.overview.key === 'declined')
const keptProviders = computed(() => [...new Set(maropay.bindings.flatMap((b) => (b.previousProvider ? [PROVIDER_LABELS[b.previousProvider.provider]] : [])))])
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
      <v-card flat border rounded="lg" class="maropay-card">
        <MpSectionHeader title="What you get" :heading-level="2" />
        <MpListRow v-for="item in BENEFITS" :key="item.title" variant="divided">
          <template #lead><v-icon size="18" class="maropay-overview__icon">{{ item.icon }}</v-icon></template>
          <span class="maropay-overview__row-title">{{ item.title }}</span>
          <span class="maropay-overview__row-sub">{{ item.desc }}</span>
        </MpListRow>
      </v-card>

      <v-card flat border rounded="lg" class="maropay-card">
        <MpSectionHeader title="What you’ll need" description="About 10 minutes. Your progress is saved as you go." :heading-level="2" />
        <MpListRow v-for="item in NEEDS" :key="item.title" variant="divided">
          <template #lead><v-icon size="18" class="maropay-overview__icon">{{ item.icon }}</v-icon></template>
          <span class="maropay-overview__row-title">{{ item.title }}</span>
          <span class="maropay-overview__row-sub">{{ item.desc }}</span>
        </MpListRow>
      </v-card>
    </div>

    <v-card id="maropay-rates" flat border rounded="lg" class="maropay-card" tabindex="-1">
      <MpSectionHeader title="What it costs" description="You pay per transaction. There’s no monthly Maropay fee." :heading-level="2" />
      <MaropayRatesTable :methods="maropay.methods" hide-unavailable />
    </v-card>

    <div class="maropay-overview__split">
      <v-card flat border rounded="lg" class="maropay-card">
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
            :eyebrow="store.domain ?? undefined"
            :title="store.name"
            meta="Keeps its current setup"
          >
            <template #lead><v-icon size="18" class="maropay-overview__icon">globe</v-icon></template>
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

      <MpAlert tone="info" live="off" icon="shield-check" title="How verification works">
        Our payments partner verifies your business and the people behind it, and you’ll review their agreement
        before you submit. Submitting isn’t approval — once you’re verified, you choose when each store switches.
      </MpAlert>
    </div>
  </div>

  <!-- ── Set up or live ─────────────────────────────────────────── -->
  <div v-else class="d-flex flex-column gap-5">
    <MpPageHeader title="Maropay" :subtitle="subtitle">
      <template #actions>
        <v-btn
          v-if="hasLiveStore"
          variant="outlined"
          class="text-none"
          prepend-icon="monitor-smartphone"
          :to="{ name: 'MaropayCheckoutPreview', params }"
        >
          Checkout preview
        </v-btn>
      </template>
    </MpPageHeader>

    <MaropayReadinessCard :instruction="maropay.overview" :dimensions="maropay.dimensions" :action-to="actionTo" />

    <template v-if="unavailable">
      <MpAlert tone="info" live="off" title="Nothing changed at checkout">
        {{ keptProviders.length
          ? `Your stores keep taking payments with ${keptProviders.join(' and ')}.`
          : 'Your stores keep their current payment setup.' }}
      </MpAlert>
      <!-- Only a declined verification is a decision; an unsupported country is still the merchant's answer. -->
      <MaropaySupportAlert
        v-if="maropay.account?.verification === 'rejected'"
        title="Ask for this decision to be reviewed"
        message="Maropost support can ask our payments partner to look at the decision again. Approval isn’t guaranteed."
        :references="supportReferences"
      />
    </template>

    <MpAlert v-if="firstPayment" tone="success" title="Your first Maropay payment came through" dismissible @dismiss="maropay.dismissMilestone('first_payment')">
      {{ firstPayment.orderNumber ? `Order ${firstPayment.orderNumber} · ` : '' }}<MaropayMoney :amount="firstPayment.amount" /> · {{ firstPayment.methodLabel }}.
      The money reaches your bank with a payout, which happens separately.
      <template #actions>
        <v-btn size="small" variant="outlined" class="text-none" @click="openPayment(firstPayment.id)">View payment</v-btn>
      </template>
    </MpAlert>

    <MpAlert v-if="firstPayout" tone="success" :title="firstPayout.status === 'paid' ? 'Your first payout was sent to your bank' : 'Your first payout is on its way'" dismissible @dismiss="maropay.dismissMilestone('first_payout')">
      <MaropayMoney :amount="firstPayout.amount" /> to {{ firstPayout.destination.bankName }} •••• {{ firstPayout.destination.last4 }}{{ firstPayout.arrivalEstimate && firstPayout.status === 'in_transit' ? ` — estimated arrival ${formatDay(firstPayout.arrivalEstimate)}` : '' }}.
      “Sent to bank” means we sent it; your bank shows it once it clears.
      <template #actions>
        <v-btn size="small" variant="outlined" class="text-none" @click="openPayout(firstPayout.id)">View payout</v-btn>
      </template>
    </MpAlert>

    <MaropayTaskList v-if="taskItems.length" :items="taskItems" :now="maropay.now" />

    <section v-if="hasMoney" aria-label="Balance" class="d-flex flex-column">
      <MpSectionHeader
        title="Balance"
        :description="maropay.account ? `${maropay.account.currency} · daily payouts, estimated from what has settled` : undefined"
        :heading-level="2"
      />
      <template v-if="maropay.can('view_balances')">
        <MaropayBalanceCards
          v-for="balance in maropay.balances"
          :key="balance.currency"
          :balance="balance"
          :upcoming="maropay.upcomingPayout"
        />
      </template>
      <MpAlert v-else tone="info" icon="lock" live="off">
        Balances and payouts are visible to owners and finance users. You can still see payments for your stores in Transactions.
      </MpAlert>
    </section>

    <div class="maropay-overview__split">
      <v-card flat border rounded="lg" class="maropay-card">
        <MpSectionHeader title="Stores" :heading-level="2" description="Activation is per store — linking a store doesn’t switch its checkout." />
        <MpListRow
          v-for="store in storeRows"
          :key="store.id"
          variant="divided"
          :to="store.to"
        >
          <template #lead><v-icon size="18" class="maropay-overview__icon">globe</v-icon></template>
          <span class="maropay-overview__row-title">{{ store.name }}</span>
          <span class="maropay-overview__row-sub">{{ store.note }}</span>
          <template #trailing>
            <MpStatusChip :status="store.status" type="readiness" size="sm" show-icon />
            <v-icon size="16" class="ms-2 maropay-overview__chevron">chevron-right</v-icon>
          </template>
        </MpListRow>
        <p v-if="!storeRows.length" class="maropay-overview__empty">No stores are linked to Maropay yet.</p>
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

      <v-card flat border rounded="lg" class="maropay-card">
        <MpSectionHeader title="Recent activity" :heading-level="2" />
        <MpListRow v-for="entry in activity" :key="entry.id" variant="divided">
          <span class="maropay-overview__row-sub mt-0">{{ formatDay(entry.at) }}</span>
          <span class="maropay-overview__row-title">{{ entry.text }}</span>
        </MpListRow>
        <p v-if="!activity.length" class="maropay-overview__empty">Nothing yet.</p>
      </v-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.maropay-card {
  padding: var(--mp-component-card-padding);
}

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

.maropay-overview__icon {
  color: var(--icon-secondary);
}

.maropay-overview__chevron {
  color: var(--muted);
}

.maropay-overview__row-title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: var(--mp-lineHeight-snug);
  color: var(--text-primary);
}

.maropay-overview__row-sub {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}

.maropay-overview__empty {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
}

.maropay-overview__more {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
  flex-wrap: wrap;
  margin-top: var(--mp-space-12);
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}

#maropay-rates:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
</style>
