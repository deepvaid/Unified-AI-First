<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayBankAccountDrawer from '@/components/maropay/MaropayBankAccountDrawer.vue'
import MaropayLedgerBreakdown from '@/components/maropay/MaropayLedgerBreakdown.vue'
import MaropayMoney from '@/components/maropay/MaropayMoney.vue'
import MaropaySupportAlert from '@/components/maropay/MaropaySupportAlert.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { formatMoney } from '@/maropay/money'
import { PAYOUT_STATUS_LABELS } from '@/maropay/model'
import type { BalanceMovement, MovementKind } from '@/maropay/model'
import { UPCOMING_PAYOUT_ID, payoutLines } from '@/maropay/payouts'
import { formatDay } from '@/maropay/readiness'

// Maropay → Payouts → one payout: where it went, when, and exactly what's in it
// (plan §3G). Every line of the breakdown is a sum of balance movements, so it
// adds up to the payout. The next payout opens here too, clearly as an
// estimate. A failed payout is fixed here: change the bank account, then retry.

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()
const toast = useToast()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})
const payoutId = computed(() => {
  const id = Array.isArray(route.params.payoutId) ? route.params.payoutId[0] : route.params.payoutId
  return id ?? ''
})
const payoutsRoute = computed(() => ({ name: 'MaropayPayouts', params: { accountId: accountId.value } }))

const canView = computed(() => maropay.can('view_payouts'))
const isUpcoming = computed(() => payoutId.value === UPCOMING_PAYOUT_ID)
const payout = computed(() => (isUpcoming.value ? null : maropay.payoutById(payoutId.value) ?? null))
const upcoming = computed(() => (isUpcoming.value ? maropay.upcomingPayout : null))
const currency = computed(() => payout.value?.amount.currency ?? upcoming.value?.amount.currency ?? maropay.account?.currency ?? 'USD')

const movements = computed<BalanceMovement[]>(() => {
  if (payout.value) return maropay.movementsForPayout(payout.value.id)
  const ids = upcoming.value?.movementIds ?? []
  return maropay.state.movements.filter((m) => ids.includes(m.id))
})

const ledger = computed(() => {
  const amount = payout.value?.amount ?? upcoming.value?.amount
  if (!amount) return null
  const payoutQuery = payout.value ? { payout: payout.value.id } : undefined
  return {
    lines: payoutLines(movements.value, currency.value).map((line) => ({
      label: line.label,
      amount: line.amount,
      hint: line.count ? `${line.count} ${line.count === 1 ? 'item' : 'items'}` : undefined,
      to: line.key === 'payments' && payoutQuery ? { name: 'MaropayTransactions', params: { accountId: accountId.value }, query: payoutQuery } : undefined,
    })),
    total: {
      label: isUpcoming.value ? 'Estimated payout'
        : payout.value?.status === 'paid' ? 'Paid out'
          : payout.value?.status === 'failed' ? 'Returned to your balance' : 'On its way',
      amount,
    },
  }
})

const KIND_LABELS: Record<MovementKind, string> = {
  charge: 'Payment',
  refund: 'Refund',
  refund_reversal: 'Refund returned',
  dispute: 'Dispute',
  dispute_reversal: 'Dispute won',
}

const items = computed(() => [...movements.value]
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  .map((m) => {
    const payment = m.paymentId ? maropay.paymentById(m.paymentId) : undefined
    return { ...m, kindLabel: KIND_LABELS[m.kind], orderNumber: payment?.orderNumber ?? null, customer: payment?.customer.name ?? '' }
  }))

function paymentRoute(paymentId: string) {
  return { name: 'MaropayPaymentDetail', params: { accountId: accountId.value, paymentId } }
}

// ── History ────────────────────────────────────────────────────────

const history = computed(() => {
  const p = payout.value
  if (!p) return []
  const rows: Array<{ id: string; at: string; icon: string; text: string; to?: ReturnType<typeof detailRoute> }> = [
    { id: 'created', at: p.createdAt, icon: 'send', text: `${p.retryOf ? 'Retried' : 'Created'} — ${formatMoney(p.amount)} to ${p.destination.bankName} •••• ${p.destination.last4}` },
  ]
  if (p.paidAt) rows.push({ id: 'paid', at: p.paidAt, icon: 'circle-check', text: 'Sent to bank — the transfer was confirmed as sent' })
  if (p.failure) rows.push({ id: 'failed', at: p.failure.at, icon: 'circle-x', text: `Returned by the bank — ${p.failure.message}` })
  if (p.retriedBy) {
    const retry = maropay.payoutById(p.retriedBy)
    if (retry) rows.push({ id: 'retry', at: retry.createdAt, icon: 'rotate-ccw', text: `Retried as ${retry.id}`, to: detailRoute(retry.id) })
  }
  return rows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
})

function detailRoute(id: string) {
  return { name: 'MaropayPayoutDetail', params: { accountId: accountId.value, payoutId: id } }
}

// ── Failed payouts ─────────────────────────────────────────────────

const destination = computed(() => maropay.account?.payoutDestination ?? null)
const isOwner = computed(() => maropay.actingRole === 'owner')
/** Retrying needs an account changed after the failure — the old one just bounced. */
const accountUpdated = computed(() => {
  const failure = payout.value?.failure
  return Boolean(failure && destination.value && Date.parse(destination.value.addedAt) > Date.parse(failure.at))
})
const canRetry = computed(() => Boolean(payout.value?.status === 'failed' && !payout.value.retriedBy && maropay.can('retry_payout')))
const bankOpen = ref(false)

function onBankSaved(): void {
  toast.success(`Bank account changed. You can retry the payout now.`)
}

function retry(): void {
  if (!payout.value) return
  const result = maropay.retryPayout(payout.value.id)
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  toast.success(`Retried as ${result.value.id} — on its way to ${result.value.destination.bankName} •••• ${result.value.destination.last4}.`)
  void router.push(detailRoute(result.value.id))
}

// ── Demo ───────────────────────────────────────────────────────────

function confirmSent(): void {
  if (!payout.value) return
  const result = maropay.markPayoutPaid(payout.value.id)
  if (result.ok) toast.info('Simulated: the transfer was confirmed as sent.')
  else toast.error(result.error.message)
}

function bankReturns(): void {
  if (!payout.value) return
  const result = maropay.failPayout(payout.value.id, 'account_closed')
  if (result.ok) toast.info('Simulated: the bank returned the payout.')
  else toast.error(result.error.message)
}

const supportReferences = computed(() => {
  const p = payout.value
  if (!p) return []
  return [
    { label: 'Payout', value: p.id },
    { label: 'Destination', value: `${p.destination.bankName} •••• ${p.destination.last4}` },
    { label: 'Maropay account', value: maropay.account?.processorAccountRef ?? '—' },
  ]
})
</script>

<template>
  <v-card v-if="!canView" flat border rounded="lg">
    <MpEmptyState icon="lock" title="Payouts are for owners and finance" description="Store operations users can see payments for their stores, but not balances or payouts." :heading-level="2" />
  </v-card>

  <!-- ── The next payout (an estimate) ───────────────────────────── -->
  <div v-else-if="isUpcoming && upcoming && ledger" class="d-flex flex-column gap-5">
    <MpPageHeader eyebrow="Payout" :title="`≈ ${formatMoney(upcoming.amount)}`" subtitle="Your next payout — an estimate of what’s in your balance now" :back-to="payoutsRoute">
      <template #tabs>
        <div class="d-flex align-center flex-wrap ga-2 mt-1">
          <MpStatusChip status="Upcoming" type="payout" size="sm" show-icon />
          <span class="text-caption text-medium-emphasis">{{ upcoming.blocked ? 'Paused until payouts are fixed' : `Estimated ${formatDay(upcoming.estimatedAt)}` }}</span>
        </div>
      </template>
    </MpPageHeader>
    <MpAlert v-if="upcoming.blocked" tone="warning" live="off" title="This payout is waiting">
      Payouts are paused, so this money stays in your balance until they resume.
      <template #actions>
        <v-btn size="small" variant="outlined" class="text-none" :to="payoutsRoute">See why</v-btn>
      </template>
    </MpAlert>
    <MpAlert v-else tone="info" live="off" title="An estimate, not a promise">
      New payments, refunds and disputes before the payout date change the amount. The date moves if a payment settles later.
    </MpAlert>
    <div class="maropay-payout">
      <MaropayLedgerBreakdown title="What’s in it so far" :lines="ledger.lines" :total="ledger.total" />
      <v-card flat border rounded="lg" class="maropay-payout__card">
        <MpSectionHeader title="Included" :description="`${items.length} ${items.length === 1 ? 'item' : 'items'}`" :heading-level="2" />
        <MpListRow v-for="item in items" :key="item.id" variant="divided" :to="item.paymentId ? paymentRoute(item.paymentId) : undefined">
          <span class="maropay-payout__row-title">{{ item.kindLabel }}{{ item.orderNumber ? ` · ${item.orderNumber}` : '' }}</span>
          <span class="maropay-payout__sub">{{ item.customer ? `${item.customer} · ` : '' }}{{ formatDay(item.createdAt) }}</span>
          <template #trailing><MaropayMoney :amount="item.net" signed /></template>
        </MpListRow>
      </v-card>
    </div>
  </div>

  <!-- ── A payout that happened ──────────────────────────────────── -->
  <div v-else-if="payout && ledger" class="d-flex flex-column gap-5">
    <MpPageHeader
      eyebrow="Payout"
      :title="formatMoney(payout.amount)"
      :subtitle="`${payout.id} · ${payout.destination.bankName} •••• ${payout.destination.last4} · ${formatDay(payout.createdAt)}`"
      :back-to="payoutsRoute"
    >
      <template v-if="payout.status === 'failed'" #actions>
        <v-btn v-if="isOwner" variant="outlined" class="text-none" prepend-icon="landmark" @click="bankOpen = true">Update bank account</v-btn>
        <v-tooltip v-if="canRetry" :disabled="accountUpdated" text="Update the bank account first — the old one just bounced." location="bottom">
          <template #activator="{ props: tip }">
            <span v-bind="tip">
              <v-btn color="primary" variant="flat" class="text-none" prepend-icon="rotate-ccw" :disabled="!accountUpdated" @click="retry">Retry payout</v-btn>
            </span>
          </template>
        </v-tooltip>
      </template>
      <template #tabs>
        <div class="d-flex align-center flex-wrap ga-2 mt-1">
          <MpStatusChip :status="PAYOUT_STATUS_LABELS[payout.status]" type="payout" size="sm" show-icon />
          <span class="text-caption text-medium-emphasis">
            {{ payout.status === 'paid' && payout.paidAt ? `Sent ${formatDay(payout.paidAt)}` : payout.status === 'in_transit' && payout.arrivalEstimate ? `Estimated arrival ${formatDay(payout.arrivalEstimate)}` : payout.failure ? `Returned ${formatDay(payout.failure.at)}` : '' }}
          </span>
        </div>
      </template>
    </MpPageHeader>

    <MpAlert v-if="payout.status === 'in_transit'" tone="info" live="off" :title="`On its way to ${payout.destination.bankName} •••• ${payout.destination.last4}`">
      Estimated arrival {{ payout.arrivalEstimate ? formatDay(payout.arrivalEstimate) : 'in a few business days' }}. It’s marked Sent to bank once the transfer is confirmed as sent.
    </MpAlert>
    <MpAlert v-else-if="payout.status === 'paid'" tone="success" live="off" :title="`Sent to bank on ${payout.paidAt ? formatDay(payout.paidAt) : '—'}`">
      The transfer left Maropay. Banks usually show it the same or the next business day. If it hasn’t arrived after 3 business days, contact support with the references below.
    </MpAlert>
    <MpAlert v-else-if="payout.status === 'failed' && payout.failure" tone="error" title="This payout failed">
      {{ payout.failure.message }} {{ formatMoney(payout.amount) }} is back in your Maropay balance and goes out again once the bank account is fixed.
      <template v-if="payout.retriedBy">It was retried as {{ payout.retriedBy }}.</template>
      <template v-else-if="!isOwner && !accountUpdated">The business owner needs to update the bank account before it can be retried.</template>
      <template v-if="payout.retriedBy" #actions>
        <v-btn size="small" variant="outlined" class="text-none" :to="detailRoute(payout.retriedBy)">Open the retry</v-btn>
      </template>
    </MpAlert>
    <MpAlert v-if="payout.retryOf" tone="info" live="off" :title="`Retry of ${payout.retryOf}`">
      The same money, sent again after the bank account was updated.
      <template #actions>
        <v-btn size="small" variant="text" class="text-none" :to="detailRoute(payout.retryOf)">Open the original</v-btn>
      </template>
    </MpAlert>

    <div class="maropay-payout">
      <div class="maropay-payout__side">
        <MaropayLedgerBreakdown title="Breakdown" :lines="ledger.lines" :total="ledger.total" caption="Every line adds up the balance movements listed under Included." />
        <v-card flat border rounded="lg" class="maropay-payout__card">
          <MpSectionHeader title="History" :heading-level="2" />
          <MpListRow v-for="row in history" :key="row.id" variant="divided" :to="row.to">
            <template #lead><v-icon size="18" class="maropay-payout__icon">{{ row.icon }}</v-icon></template>
            <span class="maropay-payout__row-title">{{ row.text }}</span>
            <span class="maropay-payout__sub">{{ formatDay(row.at) }}</span>
          </MpListRow>
        </v-card>
        <MaropaySupportAlert :references="supportReferences" />
      </div>

      <div class="maropay-payout__body">
        <v-card flat border rounded="lg" class="maropay-payout__card">
          <MpSectionHeader title="Included" :description="`${items.length} ${items.length === 1 ? 'item' : 'items'}`" :heading-level="2" />
          <MpListRow v-for="item in items" :key="item.id" variant="divided" :to="item.paymentId ? paymentRoute(item.paymentId) : undefined">
            <span class="maropay-payout__row-title">{{ item.kindLabel }}{{ item.orderNumber ? ` · ${item.orderNumber}` : '' }}</span>
            <span class="maropay-payout__sub">
              {{ item.customer ? `${item.customer} · ` : '' }}{{ formatDay(item.createdAt) }}{{ item.fee.amount ? ` · fee ${formatMoney(item.fee)}` : '' }}
            </span>
            <template #trailing><MaropayMoney :amount="item.net" signed /></template>
          </MpListRow>
        </v-card>

        <v-card v-if="payout.status === 'in_transit' && isOwner" flat border rounded="lg" class="maropay-payout__card">
          <MpSectionHeader icon="flask-conical" title="Simulate the bank" description="Demo controls — not part of the product." :heading-level="2" />
          <div class="d-flex flex-wrap ga-2">
            <v-btn size="small" variant="outlined" class="text-none" @click="confirmSent">Confirm sent to bank</v-btn>
            <v-btn size="small" variant="text" class="text-none" @click="bankReturns">Bank returns it</v-btn>
          </div>
        </v-card>
      </div>
    </div>

    <MaropayBankAccountDrawer
      v-model="bankOpen"
      :current="destination"
      :country="maropay.account?.country ?? 'US'"
      :default-holder="maropay.business?.legalName ?? ''"
      @saved="onBankSaved"
    />
  </div>

  <MpErrorState
    v-else
    icon="file-x"
    :title="isUpcoming ? 'No payout is coming up' : 'Payout not found'"
    :description="isUpcoming ? 'Everything in your balance has already been paid out.' : 'This payout may belong to another account, or the link is incorrect.'"
    action-label="Back to payouts"
    action-icon="arrow-left"
    @action="router.push(payoutsRoute)"
  />
</template>

<style scoped lang="scss">
.maropay-payout {
  display: grid;
  grid-template-columns: minmax(0, var(--mp-layout-detailSidebarWidth)) minmax(0, 1fr);
  gap: var(--mp-space-20);
  align-items: start;
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .maropay-payout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.maropay-payout__side,
.maropay-payout__body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
  min-width: 0;
}

.maropay-payout__card {
  padding: var(--mp-component-card-padding);
}

.maropay-payout__icon {
  color: var(--icon-secondary);
}

.maropay-payout__row-title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: var(--mp-lineHeight-snug);
  color: var(--text-primary);
}

.maropay-payout__sub {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}
</style>
