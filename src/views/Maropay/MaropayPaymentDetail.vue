<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayDemoPanel from '@/components/maropay/MaropayDemoPanel.vue'
import MaropayLedgerBreakdown from '@/components/maropay/MaropayLedgerBreakdown.vue'
import MaropayMethodMark from '@/components/maropay/MaropayMethodMark.vue'
import MaropayMoney from '@/components/maropay/MaropayMoney.vue'
import MaropayRefundDrawer from '@/components/maropay/MaropayRefundDrawer.vue'
import MaropaySupportAlert from '@/components/maropay/MaropaySupportAlert.vue'
import MaropayTimeline from '@/components/maropay/MaropayTimeline.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { markFor, methodCaption } from '@/maropay/methodMarks'
import { formatMoney, isPositive, negate } from '@/maropay/money'
import { PAYMENT_STATUS_LABELS, PROVIDER_LABELS } from '@/maropay/model'
import type { Refund } from '@/maropay/model'
import { formatDay } from '@/maropay/readiness'
import type { FailurePlan, RefundResult } from '@/services/maropay/mockAdapter'

// Maropay → Transactions → a payment: what happened to the shopper's money,
// what it cost and what's left to refund (plan §3F). Capture, cancel and
// refund act here; payments an earlier provider took say so, and their
// refunds go back through that provider.

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()
const toast = useToast()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})
const paymentId = computed(() => {
  const id = Array.isArray(route.params.paymentId) ? route.params.paymentId[0] : route.params.paymentId
  return id ?? ''
})
const transactionsRoute = computed(() => ({ name: 'MaropayTransactions', params: { accountId: accountId.value } }))

const payment = computed(() => maropay.paymentById(paymentId.value) ?? null)
const canView = computed(() => (payment.value ? maropay.can('view_transactions', payment.value.channelId) : false))
const storeName = computed(() => (payment.value ? maropay.channelName(payment.value.channelId) : ''))
const ours = computed(() => payment.value?.provider === 'maropay')
const providerName = computed(() => (payment.value ? PROVIDER_LABELS[payment.value.provider] : ''))
const breakdown = computed(() => (payment.value ? maropay.breakdownFor(payment.value.id) : null))
const dispute = computed(() => (payment.value?.disputeId ? maropay.disputeById(payment.value.disputeId) ?? null : null))

const statusLabel = computed(() => (payment.value ? PAYMENT_STATUS_LABELS[payment.value.status] : ''))
const orderRoute = computed(() => (payment.value?.orderId ? { name: 'OrderDetail', params: { accountId: accountId.value, orderId: payment.value.orderId } } : null))

/** The payout this payment's money went out in, once it has. */
const payoutId = computed(() => (payment.value ? maropay.state.movements.find((m) => m.paymentId === payment.value!.id && m.kind === 'charge')?.payoutId ?? null : null))

// ── Actions ────────────────────────────────────────────────────────

const canCapture = computed(() => payment.value?.status === 'authorised' && maropay.can('capture', payment.value.channelId))
const canVoid = computed(() => payment.value?.status === 'authorised' && maropay.can('void', payment.value.channelId))
const canRefund = computed(() => Boolean(payment.value && breakdown.value
  && payment.value.status !== 'disputed'
  && isPositive(breakdown.value.remainingRefundable)
  && maropay.can('refund', payment.value.channelId)))

const captureOpen = ref(false)
const voidOpen = ref(false)
const refundOpen = ref(false)

function capture(): void {
  const p = payment.value
  if (!p) return
  const result = maropay.capture(p.id, `capture_${p.id}`)
  if (result.ok) toast.success(`Captured ${formatMoney(p.amount)}. The order is now Paid.`)
  else toast.error(result.error.message)
}

function cancelAuthorisation(): void {
  const p = payment.value
  if (!p) return
  const result = maropay.voidPayment(p.id)
  if (result.ok) toast.success('Authorisation cancelled. The shopper won’t be charged.')
  else toast.error(result.error.message)
}

function onRefunded({ refund }: RefundResult): void {
  const via = refund.provider === 'maropay' ? '' : ` through ${PROVIDER_LABELS[refund.provider]}`
  toast.success(refund.status === 'pending'
    ? `Refund of ${formatMoney(refund.amount)} started${via}. It can take a few days to complete.`
    : `Refunded ${formatMoney(refund.amount)}${via}.`)
}

// ── Money ──────────────────────────────────────────────────────────

const ledger = computed(() => {
  const b = breakdown.value
  if (!b || !isPositive(b.gross)) return null
  const lines = [{ label: 'Amount captured', amount: b.gross }]
  if (ours.value) lines.push({ label: 'Processing fee', amount: negate(b.fee) })
  if (isPositive(b.refunded)) lines.push({ label: 'Refunded', amount: negate(b.refunded) })
  if (isPositive(b.disputed)) lines.push({ label: 'Lost to dispute', amount: negate(b.disputed) })
  if (isPositive(b.disputeFee)) lines.push({ label: 'Dispute fee', amount: negate(b.disputeFee) })
  return {
    lines,
    total: { label: ours.value ? 'Net to you' : `Net before ${providerName.value}’s fees`, amount: b.net },
    caption: `${formatMoney(b.remainingRefundable)} left to refund.${ours.value ? ' Processing fees aren’t returned on refunds.' : ` ${providerName.value} charged its own fees, which aren’t shown here.`}`,
  }
})

const refundRows = computed(() => [...(payment.value?.refunds ?? [])].reverse())
/** General-chip keys: a completed refund is good news, not the order-level red 'Refunded'. */
const REFUND_STATUS: Record<Refund['status'], string> = { pending: 'Pending', succeeded: 'Completed', failed: 'Failed' }

const supportReferences = computed(() => {
  const p = payment.value
  if (!p) return []
  return [
    { label: 'Payment', value: p.id },
    { label: 'Order', value: p.orderNumber ?? '—' },
    { label: 'Store', value: storeName.value },
    { label: 'Processor reference', value: p.processorRef },
  ]
})

// ── Demo ───────────────────────────────────────────────────────────

const wentThroughProcessing = computed(() => payment.value?.timeline.some((e) => e.kind === 'processing') ?? false)
const pendingRefunds = computed(() => payment.value?.refunds.filter((r) => r.status === 'pending') ?? [])
const REFUND_OUTCOMES = [
  { value: 'succeed', label: 'Succeeds' },
  { value: 'pending', label: 'Stays pending' },
  { value: 'fail', label: 'Fails' },
  { value: 'insufficient_balance', label: 'Balance too low' },
]
const showDemo = computed(() => Boolean(payment.value && (wentThroughProcessing.value || canRefund.value || pendingRefunds.value.length
  || (ours.value && (payment.value.status === 'captured' || payment.value.status === 'partially_refunded')))))

function deliver(kind: 'captured' | 'failed'): void {
  const p = payment.value
  if (!p) return
  const result = maropay.deliverEvent(p.id, kind)
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  const { applied, reason } = result.value
  toast.info(applied
    ? kind === 'captured' ? 'Delivered: the bank confirmed the payment.' : 'Delivered: the bank couldn’t complete the debit.'
    : reason === 'duplicate' ? 'Delivered again — ignored, it was already applied.' : 'Delivered late — ignored, the payment had already moved on.')
}

function settle(refund: Refund, outcome: 'succeeded' | 'failed'): void {
  const p = payment.value
  if (!p) return
  const result = maropay.settleRefund(p.id, refund.id, outcome)
  if (result.ok) toast.info(outcome === 'succeeded' ? 'Simulated: the refund completed.' : 'Simulated: the refund bounced back to your balance.')
  else toast.error(result.error.message)
}

function openDispute(): void {
  const p = payment.value
  if (!p) return
  const result = maropay.openDispute(p.id)
  if (result.ok) toast.info('Simulated: the shopper’s bank opened a dispute.')
  else toast.error(result.error.message)
}

function setRefundOutcome(value: string | null): void {
  if (value) maropay.setFailure('refundOutcome', value as FailurePlan['refundOutcome'])
}
</script>

<template>
  <div v-if="payment && canView" class="d-flex flex-column gap-5">
    <MpPageHeader
      eyebrow="Payment"
      :title="formatMoney(payment.amount)"
      :subtitle="`${payment.customer.name} · ${storeName} · ${formatDay(payment.createdAt)}`"
      :back-to="transactionsRoute"
    >
      <template #title-append>
        <MpStatusChip :status="statusLabel" type="payment" show-icon />
      </template>
      <template #actions>
        <v-btn v-if="canVoid" variant="text" class="text-none" prepend-icon="ban" @click="voidOpen = true">Cancel authorisation</v-btn>
        <v-btn v-if="canRefund" variant="outlined" class="text-none" prepend-icon="undo-2" @click="refundOpen = true">Refund</v-btn>
        <v-btn v-if="canCapture" color="primary" variant="flat" class="text-none" prepend-icon="circle-check" @click="captureOpen = true">Capture {{ formatMoney(payment.amount) }}</v-btn>
      </template>
    </MpPageHeader>

    <MpAlert v-if="payment.status === 'processing'" tone="info" live="polite" title="Payment processing">
      {{ payment.methodLabel }} can take a few business days to confirm{{ payment.expectedResolutionAt ? ` — expected by ${formatDay(payment.expectedResolutionAt)}` : '' }}.
      The order stays Pending until the shopper’s bank confirms.
    </MpAlert>
    <MpAlert v-else-if="payment.status === 'authorised'" tone="warning" live="off" :title="payment.authorisationExpiresAt ? `Capture by ${formatDay(payment.authorisationExpiresAt)}` : 'Waiting for capture'">
      This store captures manually. Capture the payment before then, or the authorisation lapses and the shopper isn’t charged.
    </MpAlert>
    <MpAlert v-else-if="payment.status === 'failed'" tone="warning" live="off" title="No payment was taken">
      {{ payment.failure?.message ?? 'The payment didn’t complete.' }}
    </MpAlert>
    <MpAlert v-else-if="payment.status === 'voided'" tone="info" live="off" title="Authorisation cancelled">
      The shopper wasn’t charged, and the hold on their card was released.
    </MpAlert>
    <MpAlert v-else-if="payment.status === 'disputed'" tone="warning" live="off" title="This payment is disputed">
      The shopper’s bank is holding {{ dispute ? formatMoney(dispute.amount) : 'the amount' }}{{ dispute ? ` — respond by ${formatDay(dispute.respondBy)}` : '' }}. It can’t be refunded while the dispute is open.
      <template v-if="dispute" #actions>
        <v-btn size="small" variant="outlined" class="text-none" :to="{ name: 'MaropayDisputeDetail', params: { accountId, disputeId: dispute.id } }">Respond to dispute</v-btn>
      </template>
    </MpAlert>

    <div class="maropay-payment">
      <div class="maropay-payment__side">
        <v-card flat border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Details" :heading-level="2" />
          <dl class="mp-label-value mp-label-value--inline">
            <div>
              <dt>Order</dt>
              <dd>
                <router-link v-if="orderRoute" :to="orderRoute" class="mp-link">{{ payment.orderNumber }}</router-link>
                <template v-else>—</template>
              </dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd class="maropay-payment__stack">{{ payment.customer.name }}<span class="maropay-payment__sub">{{ payment.customer.email }}</span></dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd class="maropay-payment__method">
                <MaropayMethodMark :mark="markFor(payment.methodId, payment.methodLabel)" size="sm" decorative />
                {{ methodCaption(payment.methodId, payment.methodLabel) }}
              </dd>
            </div>
            <div><dt>Amount</dt><dd><MaropayMoney :amount="payment.amount" /> {{ payment.amount.currency }}</dd></div>
            <div>
              <dt>Taken by</dt>
              <dd class="maropay-payment__stack">
                {{ ours ? 'Maropay' : payment.legacy ? `${providerName}, before Maropay` : providerName }}
                <span v-if="!ours" class="maropay-payment__sub">Refunds go back through {{ providerName }}; it isn’t part of your Maropay balance or payouts.</span>
              </dd>
            </div>
            <div><dt>Captured</dt><dd>{{ payment.capturedAt ? formatDay(payment.capturedAt) : 'Not captured' }}</dd></div>
            <div><dt>Capture</dt><dd>{{ payment.captureMode === 'manual' ? 'Manual' : 'Automatic' }}</dd></div>
            <div>
              <dt>Payout</dt>
              <dd>
                <router-link v-if="payoutId" :to="{ name: 'MaropayPayoutDetail', params: { accountId, payoutId } }" class="mp-link">{{ payoutId }}</router-link>
                <template v-else>{{ ours ? (payment.capturedAt ? 'Not paid out yet' : '—') : `Paid out by ${providerName}` }}</template>
              </dd>
            </div>
            <div><dt>Payment ID</dt><dd class="maropay-payment__mono">{{ payment.id }}</dd></div>
            <div><dt>Reference</dt><dd class="maropay-payment__mono">{{ payment.processorRef }}</dd></div>
          </dl>
        </v-card>

        <MaropayLedgerBreakdown v-if="ledger" title="Money" :lines="ledger.lines" :total="ledger.total" :caption="ledger.caption" />

        <MaropaySupportAlert :references="supportReferences" />
      </div>

      <div class="maropay-payment__body">
        <v-card v-if="refundRows.length" flat border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Refunds" :heading-level="2" />
          <MpListRow
            v-for="refund in refundRows"
            :key="refund.id"
            variant="divided"
            :subtitle="[formatDay(refund.at), refund.provider === 'maropay' ? 'Via Maropay' : `Through ${PROVIDER_LABELS[refund.provider]}`, refund.reason, refund.failureReason].filter(Boolean).join(' · ')"
          >
            <template #title><MaropayMoney :amount="refund.amount" /> refunded</template>
            <template #trailing>
              <MpStatusChip :status="REFUND_STATUS[refund.status]" type="general" size="sm" />
            </template>
          </MpListRow>
        </v-card>

        <MaropayTimeline :events="payment.timeline" />
      </div>
    </div>

    <MaropayDemoPanel v-if="showDemo">
      <MpListRow v-if="wentThroughProcessing" variant="divided" title="The shopper’s bank" subtitle="Confirm or fail the delayed debit">
        <template #trailing>
          <span class="d-flex flex-wrap ga-2">
            <v-btn size="small" variant="outlined" class="text-none" @click="deliver('captured')">Deliver confirmation</v-btn>
            <v-btn size="small" variant="outlined" class="text-none" @click="deliver('failed')">Deliver failure</v-btn>
          </span>
        </template>
      </MpListRow>
      <MpListRow v-if="canRefund" variant="divided" title="Next refund" subtitle="What happens when you refund this payment">
        <template #trailing>
          <div class="maropay-payment__demo-scroll">
            <MpSegmentedControl :model-value="maropay.failures.refundOutcome" :items="REFUND_OUTCOMES" size="sm" ariaLabel="Next refund outcome" @update:model-value="setRefundOutcome" />
          </div>
        </template>
      </MpListRow>
      <MpListRow v-for="refund in pendingRefunds" :key="refund.id" variant="divided" :title="`Pending refund of ${formatMoney(refund.amount)}`" subtitle="Settle it as the shopper’s bank would">
        <template #trailing>
          <span class="d-flex flex-wrap ga-2">
            <v-btn size="small" variant="outlined" class="text-none" @click="settle(refund, 'succeeded')">Complete</v-btn>
            <v-btn size="small" variant="text" class="text-none" @click="settle(refund, 'failed')">Bounce back</v-btn>
          </span>
        </template>
      </MpListRow>
      <MpListRow v-if="ours && (payment.status === 'captured' || payment.status === 'partially_refunded')" variant="divided" title="The shopper’s bank" subtitle="Open a dispute against this payment">
        <template #trailing>
          <v-btn size="small" variant="outlined" class="text-none" @click="openDispute">Open a dispute</v-btn>
        </template>
      </MpListRow>
      <MpListRow variant="divided" title="Next request times out" subtitle="One-shot — retrying is safe">
        <template #trailing>
          <v-checkbox-btn
            :model-value="maropay.failures.timeoutNext"
            aria-label="Next request times out"
            @update:model-value="maropay.setFailure('timeoutNext', Boolean($event))"
          />
        </template>
      </MpListRow>
    </MaropayDemoPanel>

    <MpConfirmDialog
      v-model="captureOpen"
      :title="`Capture ${formatMoney(payment.amount)}?`"
      message="The shopper is charged now."
      :consequences="['The payment moves to Succeeded and the order to Paid.', 'The money joins a payout once it settles, less the processing fee.']"
      confirm-label="Capture"
      @confirm="capture"
    />
    <MpConfirmDialog
      v-model="voidOpen"
      title="Cancel this authorisation?"
      message="The shopper won’t be charged, and the hold on their card is released."
      :consequences="['You can’t capture this payment afterwards.', 'The order stays open — cancel it separately if you won’t fulfil it.']"
      confirm-label="Cancel authorisation"
      danger
      @confirm="cancelAuthorisation"
    />
    <MaropayRefundDrawer
      v-if="breakdown"
      v-model="refundOpen"
      :payment="payment"
      :remaining="breakdown.remainingRefundable"
      :store-name="storeName"
      :refund="(amount, reason, key) => maropay.refund(payment!.id, amount, reason, key)"
      @refunded="onRefunded"
    />
  </div>

  <!-- No access or not found: the page keeps its header and back link. -->
  <div v-else class="d-flex flex-column gap-5">
    <MpPageHeader eyebrow="Payment" :title="payment ? 'Payment' : 'Payment not found'" :back-to="transactionsRoute" />
    <v-card flat border rounded="lg">
      <MpEmptyState
        v-if="payment"
        icon="lock"
        title="You don’t have access to this payment"
        description="Store operations users see payments for the stores they’re assigned to."
        :heading-level="2"
      />
      <MpErrorState
        v-else
        icon="file-x"
        title="We couldn’t find this payment"
        description="It may belong to another account, or the link is incorrect."
        action-label="Back to transactions"
        action-icon="arrow-left"
        @action="router.push(transactionsRoute)"
      />
    </v-card>
  </div>
</template>

<style scoped lang="scss">
.maropay-payment {
  display: grid;
  grid-template-columns: minmax(0, var(--mp-layout-detailSidebarWidth)) minmax(0, 1fr);
  gap: var(--mp-space-20);
  align-items: start;
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .maropay-payment {
    grid-template-columns: minmax(0, 1fr);
  }
}

.maropay-payment__side,
.maropay-payment__body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
  min-width: 0;
}

.maropay-payment__stack {
  display: flex;
  flex-direction: column;
}

.maropay-payment__method {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
}

.maropay-payment__sub {
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
}

.maropay-payment__mono {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
}

/* Four outcomes outgrow a phone-width card, so the control scrolls inside its row. */
.maropay-payment__demo-scroll {
  max-width: 100%;
  overflow-x: auto;
}
</style>
