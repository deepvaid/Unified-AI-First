<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayDemoPanel from '@/components/maropay/MaropayDemoPanel.vue'
import MaropayLedgerBreakdown from '@/components/maropay/MaropayLedgerBreakdown.vue'
import MaropaySupportAlert from '@/components/maropay/MaropaySupportAlert.vue'
import MaropayTimeline from '@/components/maropay/MaropayTimeline.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { formatMoney, negate } from '@/maropay/money'
import { DISPUTE_REASON_LABELS, DISPUTE_STATUS_LABELS } from '@/maropay/model'
import type { EvidenceItem, MockDocument } from '@/maropay/model'
import { deadlineLabel, missingEvidence } from '@/maropay/disputes'
import { formatDay } from '@/maropay/readiness'

// Maropay → Disputes → one dispute: what the shopper's bank says, the deadline
// in words, and the response — evidence items plus a written explanation,
// saved as a draft until submitted (plan §3G). Submitting is final; accepting
// concedes the payment. Won, lost and accepted each say what it cost.

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()
const toast = useToast()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})
const disputeId = computed(() => {
  const id = Array.isArray(route.params.disputeId) ? route.params.disputeId[0] : route.params.disputeId
  return id ?? ''
})
const disputesRoute = computed(() => ({ name: 'MaropayDisputes', params: { accountId: accountId.value } }))

const canView = computed(() => maropay.can('view_disputes'))
const dispute = computed(() => maropay.disputeById(disputeId.value) ?? null)
const payment = computed(() => (dispute.value ? maropay.paymentById(dispute.value.paymentId) ?? null : null))
const open = computed(() => dispute.value?.status === 'needs_response')
const overdue = computed(() => Boolean(dispute.value && Date.parse(dispute.value.respondBy) <= maropay.now))
const canRespond = computed(() => Boolean(dispute.value && open.value && !overdue.value && maropay.can('respond_dispute', dispute.value.channelId)))
const canAccept = computed(() => Boolean(dispute.value && open.value && !overdue.value && maropay.can('accept_dispute', dispute.value.channelId)))
const missing = computed(() => (dispute.value ? missingEvidence(dispute.value) : []))

const paymentRoute = computed(() => (dispute.value ? { name: 'MaropayPaymentDetail', params: { accountId: accountId.value, paymentId: dispute.value.paymentId } } : null))
const orderRoute = computed(() => (dispute.value?.orderId ? { name: 'OrderDetail', params: { accountId: accountId.value, orderId: dispute.value.orderId } } : null))

// ── The written response ───────────────────────────────────────────

const summary = ref('')
watch(() => dispute.value?.id, () => { summary.value = dispute.value?.summary ?? '' }, { immediate: true })

/** Saved as the merchant types; the draft stays until it's submitted. */
watch(summary, (text) => {
  if (!dispute.value || !canRespond.value || text === dispute.value.summary) return
  maropay.saveDisputeDraft(dispute.value.id, { summary: text })
})

const DRAFT_TIME = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const draftSaved = computed(() => (dispute.value?.draftUpdatedAt ? `Draft saved ${DRAFT_TIME.format(new Date(dispute.value.draftUpdatedAt))}` : null))

// ── Evidence ───────────────────────────────────────────────────────

const evidenceOpen = ref(false)
const evidenceItem = ref<EvidenceItem | null>(null)
const evidenceNote = ref('')
const evidenceDocument = ref<MockDocument | null>(null)
const evidenceFile = ref<File | File[] | null>(null)

watch(evidenceFile, (value) => {
  const file = Array.isArray(value) ? value[0] : value
  if (file) evidenceDocument.value = { name: file.name, sizeLabel: file.size >= 1_000_000 ? `${(file.size / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1_000))} KB`, status: 'received' }
})

function openEvidence(item: EvidenceItem): void {
  evidenceItem.value = item
  evidenceNote.value = item.note
  evidenceDocument.value = item.document
  evidenceFile.value = null
  evidenceOpen.value = true
}

function saveEvidence(): void {
  if (!dispute.value || !evidenceItem.value) return
  const result = maropay.saveDisputeDraft(dispute.value.id, { evidence: { key: evidenceItem.value.key, note: evidenceNote.value.trim(), document: evidenceDocument.value } })
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  evidenceOpen.value = false
}

// ── Submit and accept ──────────────────────────────────────────────

const submitOpen = ref(false)
const acceptOpen = ref(false)
const submitHint = computed(() => (missing.value.length ? `Add the required evidence first: ${missing.value.map((e) => e.label).join(', ')}.` : ''))

function submit(): void {
  if (!dispute.value) return
  const result = maropay.submitEvidence(dispute.value.id)
  if (result.ok) toast.success('Evidence submitted. The shopper’s bank will decide.')
  else toast.error(result.error.message)
}

function accept(): void {
  if (!dispute.value) return
  const result = maropay.acceptDispute(dispute.value.id)
  if (result.ok) toast.info('Dispute accepted.')
  else toast.error(result.error.message)
}

function simulate(outcome: 'won' | 'lost'): void {
  if (!dispute.value) return
  const result = maropay.simulateDisputeOutcome(dispute.value.id, outcome)
  if (result.ok) toast.info(outcome === 'won' ? 'Simulated: the bank sided with you.' : 'Simulated: the bank sided with the shopper.')
  else toast.error(result.error.message)
}

// ── Money and history ──────────────────────────────────────────────

const ledger = computed(() => {
  const d = dispute.value
  if (!d) return null
  const lines = [
    { label: 'Disputed amount', amount: negate(d.amount), hint: 'Held from your balance when the dispute opened' },
    { label: 'Dispute fee', amount: negate(d.fee), hint: 'Charged by the card network; not refunded' },
  ]
  if (d.status === 'won') lines.push({ label: 'Returned — you won', amount: d.amount, hint: `Back in your balance ${d.resolvedAt ? formatDay(d.resolvedAt) : ''}`.trim() })
  const total = d.status === 'won' ? negate(d.fee) : negate({ amount: d.amount.amount + d.fee.amount, currency: d.amount.currency })
  return { lines, total: { label: d.status === 'won' || d.status === 'lost' || d.status === 'accepted' ? 'Effect on your balance' : 'Held so far', amount: total } }
})

const disputeEvents = computed(() => (payment.value?.timeline ?? []).filter((e) => e.kind.startsWith('dispute_')))

const supportReferences = computed(() => {
  const d = dispute.value
  if (!d) return []
  return [
    { label: 'Dispute', value: d.id },
    { label: 'Payment', value: d.paymentId },
    { label: 'Order', value: d.orderNumber ?? '—' },
  ]
})
</script>

<template>
  <div v-if="canView && dispute" class="d-flex flex-column gap-5">
    <MpPageHeader
      eyebrow="Dispute"
      :title="formatMoney(dispute.amount)"
      :subtitle="[DISPUTE_REASON_LABELS[dispute.reason], dispute.orderNumber ?? dispute.paymentId, `opened ${formatDay(dispute.openedAt)}`].join(' · ')"
      :back-to="disputesRoute"
    >
      <template #title-append>
        <MpStatusChip :status="DISPUTE_STATUS_LABELS[dispute.status]" type="dispute" show-icon />
      </template>
      <template v-if="open" #actions>
        <v-btn v-if="canAccept" variant="text" class="text-none" @click="acceptOpen = true">Accept dispute</v-btn>
        <v-tooltip v-if="canRespond" :disabled="!submitHint" :text="submitHint" location="bottom">
          <template #activator="{ props: tip }">
            <span v-bind="tip">
              <v-btn color="primary" variant="flat" class="text-none" prepend-icon="send" :disabled="!!submitHint" @click="submitOpen = true">Submit evidence</v-btn>
            </span>
          </template>
        </v-tooltip>
      </template>
    </MpPageHeader>

    <MpAlert v-if="open && overdue" tone="error" title="The response deadline has passed">
      The shopper’s bank decides without your evidence, so the payment is likely to be lost.
    </MpAlert>
    <MpAlert v-else-if="open" tone="warning" live="off" :title="`Respond by ${formatDay(dispute.respondBy)} — ${deadlineLabel(dispute.respondBy, maropay.now).toLowerCase()}`">
      Send the evidence that shows the payment was valid. If you don’t respond, the shopper’s bank decides without your side and {{ formatMoney(dispute.amount) }} is lost.
    </MpAlert>
    <MpAlert v-else-if="dispute.status === 'under_review'" tone="info" live="off" :title="`Evidence submitted ${dispute.submittedAt ? formatDay(dispute.submittedAt) : ''}`.trim()">
      The shopper’s bank is reviewing it. They usually decide within 60 to 75 days, and we’ll let you know.
    </MpAlert>
    <MpAlert v-else-if="dispute.status === 'won'" tone="success" title="You won this dispute">
      {{ formatMoney(dispute.amount) }} is back in your balance. The {{ formatMoney(dispute.fee) }} dispute fee isn’t refunded.
    </MpAlert>
    <MpAlert v-else-if="dispute.status === 'lost'" tone="warning" live="off" title="The shopper’s bank sided with the shopper">
      {{ formatMoney(dispute.amount) }} and the {{ formatMoney(dispute.fee) }} dispute fee stay deducted.
    </MpAlert>
    <MpAlert v-else-if="dispute.status === 'accepted'" tone="info" live="off" title="You accepted this dispute">
      {{ formatMoney(dispute.amount) }} and the {{ formatMoney(dispute.fee) }} dispute fee stay deducted.
    </MpAlert>

    <div class="maropay-dispute">
      <div class="maropay-dispute__side">
        <v-card flat border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Details" :heading-level="2" />
          <dl class="mp-label-value mp-label-value--inline">
            <div><dt>Reason</dt><dd>{{ DISPUTE_REASON_LABELS[dispute.reason] }}</dd></div>
            <div>
              <dt>Payment</dt>
              <dd><router-link v-if="paymentRoute" :to="paymentRoute" class="mp-link">{{ dispute.paymentId }}</router-link></dd>
            </div>
            <div>
              <dt>Order</dt>
              <dd>
                <router-link v-if="orderRoute" :to="orderRoute" class="mp-link">{{ dispute.orderNumber }}</router-link>
                <template v-else>—</template>
              </dd>
            </div>
            <div><dt>Customer</dt><dd>{{ payment?.customer.name ?? '—' }}</dd></div>
            <div><dt>Store</dt><dd>{{ maropay.channelName(dispute.channelId) }}</dd></div>
            <div><dt>Opened</dt><dd>{{ formatDay(dispute.openedAt) }}</dd></div>
            <div><dt>Respond by</dt><dd>{{ formatDay(dispute.respondBy) }}</dd></div>
          </dl>
        </v-card>

        <MaropayLedgerBreakdown v-if="ledger" title="Money" :lines="ledger.lines" :total="ledger.total" />
        <MaropaySupportAlert :references="supportReferences" />
      </div>

      <div class="maropay-dispute__body">
        <v-card flat border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="What the shopper’s bank says" :heading-level="2" />
          <p class="maropay-dispute__claim">{{ dispute.claim }}</p>
        </v-card>

        <v-card flat border rounded="lg" class="mp-card-inset">
          <MpSectionHeader
            title="Evidence"
            :description="open ? (missing.length ? `${missing.length} required ${missing.length === 1 ? 'item' : 'items'} still missing` : 'Everything required is added') : 'Sent to the shopper’s bank'"
            :heading-level="2"
          />
          <div role="list">
            <MpListRow
              v-for="item in dispute.evidence"
              :key="item.key"
              variant="divided"
              role="listitem"
              :title="item.label"
              :subtitle="[item.required ? 'Required' : 'Optional', item.document ? `${item.document.name} · ${item.document.sizeLabel}` : item.required ? 'missing' : null, item.note].filter(Boolean).join(' · ')"
            >
              <template #lead>
                <v-icon size="16" :class="item.document ? 'maropay-dispute__done' : 'maropay-dispute__todo'">{{ item.document ? 'file-check' : 'file-plus' }}</v-icon>
              </template>
              <template v-if="canRespond" #trailing>
                <v-btn size="small" variant="text" class="text-none" :aria-label="`${item.document || item.note ? 'Edit' : 'Add'} ${item.label}`" @click="openEvidence(item)">
                  {{ item.document || item.note ? 'Edit' : 'Add' }}
                </v-btn>
              </template>
            </MpListRow>
          </div>
        </v-card>

        <v-card flat border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Your response" :description="open ? (draftSaved ?? 'Saved as a draft as you type') : undefined" :heading-level="2" />
          <v-textarea
            v-if="canRespond"
            v-model="summary"
            label="Explain why the payment was valid"
            placeholder="e.g. The order was delivered on 12 September and signed for at the shopper’s address."
            rows="5"
            hint="This goes to the shopper’s bank with your evidence. Plain facts work best."
            persistent-hint
          />
          <p v-else class="maropay-dispute__claim">{{ dispute.summary || 'No written response.' }}</p>
        </v-card>

        <MaropayTimeline v-if="disputeEvents.length" title="Dispute history" :events="disputeEvents" />
      </div>
    </div>

    <MaropayDemoPanel v-if="dispute.status === 'under_review'">
      <MpListRow variant="divided" title="The shopper’s bank decides" subtitle="Settle the dispute either way">
        <template #trailing>
          <span class="d-flex flex-wrap ga-2">
            <v-btn size="small" variant="outlined" class="text-none" @click="simulate('won')">You win</v-btn>
            <v-btn size="small" variant="text" class="text-none" @click="simulate('lost')">The shopper wins</v-btn>
          </span>
        </template>
      </MpListRow>
    </MaropayDemoPanel>

    <MpFormDrawer v-model="evidenceOpen" :title="evidenceItem?.label ?? 'Evidence'" :subtitle="evidenceItem?.required ? 'Required for this dispute' : 'Optional — it strengthens your case'" size="sm">
      <MpFormGrid>
        <MpListRow v-if="evidenceDocument" variant="boxed" :title="evidenceDocument.name" :subtitle="evidenceDocument.sizeLabel">
          <template #lead><v-icon size="16" class="maropay-dispute__done">file-check</v-icon></template>
          <template #trailing>
            <v-btn size="small" variant="text" class="text-none" :aria-label="`Remove ${evidenceDocument.name}`" @click="evidenceDocument = null; evidenceFile = null">Remove</v-btn>
          </template>
        </MpListRow>
        <v-file-input v-else v-model="evidenceFile" label="Document" accept="image/*,application/pdf" prepend-icon="" prepend-inner-icon="paperclip" hint="Only the file name is kept in this prototype." persistent-hint />
        <v-textarea v-model="evidenceNote" label="What this shows" rows="3" placeholder="e.g. Tracking confirms delivery on 12 September." />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="evidenceOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveEvidence">Save</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="submitOpen"
      title="Submit your evidence?"
      message="You can’t change it after submitting."
      :consequences="['It goes to the shopper’s bank, which usually decides within 60 to 75 days.', `${formatMoney(dispute.amount)} stays held until then.`]"
      confirm-label="Submit evidence"
      @confirm="submit"
    />
    <MpConfirmDialog
      v-model="acceptOpen"
      title="Accept this dispute?"
      message="You’re agreeing that the shopper keeps the money."
      :consequences="[`${formatMoney(dispute.amount)} stays deducted from your balance.`, `The ${formatMoney(dispute.fee)} dispute fee isn’t refunded.`, 'You can’t respond or reopen it afterwards.']"
      confirm-label="Accept dispute"
      danger
      @confirm="accept"
    />
  </div>

  <!-- No access or not found: the page keeps its header and back link. -->
  <div v-else class="d-flex flex-column gap-5">
    <MpPageHeader eyebrow="Dispute" title="Dispute" :back-to="disputesRoute" />
    <v-card flat border rounded="lg">
      <MpEmptyState
        v-if="!canView"
        icon="lock"
        title="Disputes are for owners and finance"
        description="Store operations users can see payments for their stores, but not disputes."
        :heading-level="2"
      />
      <MpErrorState
        v-else
        icon="file-x"
        title="We couldn’t find this dispute"
        description="It may belong to another account, or the link is incorrect."
        action-label="Back to disputes"
        action-icon="arrow-left"
        @action="router.push(disputesRoute)"
      />
    </v-card>
  </div>
</template>

<style scoped lang="scss">
.maropay-dispute {
  display: grid;
  grid-template-columns: minmax(0, var(--mp-layout-detailSidebarWidth)) minmax(0, 1fr);
  gap: var(--mp-space-20);
  align-items: start;
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .maropay-dispute {
    grid-template-columns: minmax(0, 1fr);
  }
}

.maropay-dispute__side,
.maropay-dispute__body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
  min-width: 0;
}

.maropay-dispute__claim {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-primary);
  white-space: pre-wrap;
}

.maropay-dispute__done {
  color: var(--pos-ink);
}

.maropay-dispute__todo {
  color: var(--icon-secondary);
}
</style>
