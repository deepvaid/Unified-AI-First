<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import CheckoutPreviewFrame from '@/components/maropay/CheckoutPreviewFrame.vue'
import type { CheckoutStage } from '@/components/maropay/CheckoutPreviewFrame.vue'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMaropayStore } from '@/stores/useMaropay'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { formatMoney, parseDecimal, zero } from '@/maropay/money'
import { PAYMENT_STATUS_LABELS } from '@/maropay/model'
import type { MaropayError, ShopperFlow } from '@/maropay/model'
import { CHECKOUT_FLOWS, flowUnavailableReason, methodsForFlow } from '@/maropay/transactions'

// Maropay → Checkout preview: run a shopper's checkout on a live store and
// watch the merchant side react (plan §3F). Five outcomes cover the paths a
// real checkout can take. Each run creates a sample order and payment, so the
// result can be followed into Transactions, the order and, later, a payout.

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()
const commerce = useCommerceStore()
const salesChannels = useSalesChannelsStore()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

// ── Controls ───────────────────────────────────────────────────────

const liveStores = computed(() => maropay.bindings
  .filter((b) => b.activation === 'live' && maropay.can('view_transactions', b.channelId))
  .map((b) => ({ value: b.channelId, title: maropay.channelName(b.channelId) })))

const queryStore = typeof route.query.store === 'string' ? route.query.store : null
const storeId = ref<string | null>(liveStores.value.find((s) => s.value === queryStore)?.value ?? liveStores.value[0]?.value ?? null)
const domain = computed(() => (storeId.value ? salesChannels.getChannel(accountId.value, storeId.value)?.webStore?.domain ?? null : null))

const products = computed(() => commerce.products.filter((p) => p.publishStatus === 'Published').slice(0, 12))
const productId = ref<number | null>(products.value[0]?.id ?? null)
const product = computed(() => products.value.find((p) => p.id === productId.value) ?? null)
const currency = computed(() => maropay.account?.currency ?? 'USD')
const productItems = computed(() => products.value.map((p) => ({ value: p.id, title: `${p.name} · ${formatMoney(parseDecimal(p.price, currency.value) ?? zero(currency.value))}` })))
const price = computed(() => (product.value ? parseDecimal(product.value.price, currency.value) : null) ?? zero(currency.value))

const checkoutMethods = computed(() => (storeId.value ? maropay.checkoutMethodsFor(storeId.value) : []))
const flows = computed(() => CHECKOUT_FLOWS.map((f) => ({ ...f, reason: flowUnavailableReason(f.flow, checkoutMethods.value) })))
const availableFlows = computed(() => flows.value.filter((f) => !f.reason))
const unavailableFlows = computed(() => flows.value.filter((f) => f.reason))

const flow = ref<ShopperFlow>('success')
const usable = computed(() => methodsForFlow(flow.value, checkoutMethods.value).map((m) => m.id))
const methodId = ref<string | null>(null)

const device = ref<'desktop' | 'mobile'>('desktop')
const DEVICES = [
  { value: 'desktop', label: 'Desktop', icon: 'monitor' },
  { value: 'mobile', label: 'Mobile', icon: 'smartphone' },
]

const SHOPPERS = [
  { name: 'Harper Clark', email: 'harper.clark@email.com' },
  { name: 'Mia Chen', email: 'mia.chen@email.com' },
  { name: 'Noah Patel', email: 'noah.patel@email.com' },
  { name: 'Ava Rossi', email: 'ava.rossi@email.com' },
]
const run = ref(0)
const customer = computed(() => SHOPPERS[run.value % SHOPPERS.length]!)

// ── The run ────────────────────────────────────────────────────────

const sessionId = ref<string | null>(null)
const busy = ref(false)
const problem = ref<MaropayError | null>(null)

const session = computed(() => (sessionId.value ? maropay.state.sessions.find((s) => s.id === sessionId.value) ?? null : null))
const payment = computed(() => (session.value?.paymentId ? maropay.paymentById(session.value.paymentId) ?? null : null))

const stage = computed<CheckoutStage>(() => {
  switch (session.value?.state) {
    case 'requires_action': return 'authenticate'
    case 'redirected': return 'redirect'
    case 'processing': return 'processing'
    case 'complete': return 'complete'
    case 'failed': return 'declined'
    default: return 'checkout'
  }
})

/** A change to the setup starts a fresh checkout; the chosen method follows the flow. */
function startOver(): void {
  sessionId.value = null
  problem.value = null
  if (!methodId.value || !usable.value.includes(methodId.value)) methodId.value = usable.value[0] ?? null
}

watch([storeId, productId, flow], startOver, { immediate: true })
watch(availableFlows, (available) => {
  if (!available.some((f) => f.flow === flow.value)) flow.value = available[0]?.flow ?? 'success'
}, { immediate: true })

async function pay(): Promise<void> {
  if (busy.value || !storeId.value || !product.value || !methodId.value) return
  busy.value = true
  problem.value = null
  await delay(700)
  const started = maropay.startCheckout({
    channelId: storeId.value,
    methodId: methodId.value,
    flow: flow.value,
    amount: price.value,
    customer: { ...customer.value },
    lineItem: { product: product.value.name, sku: product.value.sku, price: product.value.price },
  })
  if (!started.ok) {
    busy.value = false
    problem.value = started.error
    return
  }
  sessionId.value = started.value.id
  const step = maropay.confirmCheckout(started.value.id)
  busy.value = false
  if (!step.ok) problem.value = step.error
}

async function authenticate(outcome: 'completed' | 'abandoned'): Promise<void> {
  if (busy.value || !sessionId.value) return
  busy.value = true
  await delay(600)
  const step = maropay.completeCheckoutAction(sessionId.value, outcome)
  busy.value = false
  if (!step.ok) problem.value = step.error
}

function nextRun(): void {
  run.value += 1
  startOver()
}

// ── What the merchant sees ─────────────────────────────────────────

const orderRoute = computed(() => (payment.value?.orderId ? { name: 'OrderDetail', params: { accountId: accountId.value, orderId: payment.value.orderId } } : null))
const paymentRoute = computed(() => (payment.value ? { name: 'MaropayPaymentDetail', params: { accountId: accountId.value, paymentId: payment.value.id } } : null))

const outcome = computed(() => {
  const p = payment.value
  if (!p || stage.value === 'authenticate' || stage.value === 'redirect') return null
  switch (p.status) {
    case 'captured':
      return { tone: 'success' as const, title: `Order ${p.orderNumber} created — payment succeeded`, body: 'It’s in Transactions now, and the money joins your next payout once it settles.' }
    case 'authorised':
      return { tone: 'success' as const, title: `Order ${p.orderNumber} created — payment authorised`, body: 'This store captures manually: capture the payment from the order within 7 days.' }
    case 'processing':
      return { tone: 'info' as const, title: `Order ${p.orderNumber} is pending`, body: 'The shopper’s bank hasn’t confirmed yet, so the order stays Pending. Deliver the bank’s answer from the payment’s page.' }
    case 'failed':
      return { tone: 'warning' as const, title: 'No payment was taken', body: `${p.failure?.message ?? 'The payment didn’t complete.'} The attempt is kept in Transactions as ${PAYMENT_STATUS_LABELS.failed.toLowerCase()}.` }
    default:
      return null
  }
})
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <MpPageHeader title="Checkout preview" subtitle="See checkout the way shoppers do. Each run creates a sample order and payment you can follow through Maropay." />

    <v-card v-if="!liveStores.length" flat border rounded="lg">
      <MpEmptyState
        icon="monitor-smartphone"
        title="No store is taking Maropay payments yet"
        description="Activate Maropay on a store to preview its checkout."
        action-label="Go to overview"
        action-icon="arrow-right"
        :heading-level="2"
        @action="router.push({ name: 'MaropayOverview', params: { accountId } })"
      />
    </v-card>

    <div v-else class="maropay-preview">
      <v-card flat border rounded="lg" class="maropay-preview__controls">
        <MpFormSection title="Checkout" :heading-level="2">
          <MpFormGrid>
            <v-select v-model="storeId" :items="liveStores" label="Store" />
            <v-select v-model="productId" :items="productItems" label="Product" />
          </MpFormGrid>
        </MpFormSection>

        <MpFormSection title="What happens when the shopper pays" :heading-level="2">
          <div class="maropay-preview__flows" role="group" aria-label="Shopper flow">
            <MpOptionCard
              v-for="option in availableFlows"
              :key="option.flow"
              :selected="flow === option.flow"
              :icon="option.icon"
              :title="option.label"
              :description="option.description"
              @click="flow = option.flow"
            />
          </div>
          <ul v-if="unavailableFlows.length" class="maropay-preview__unavailable">
            <li v-for="option in unavailableFlows" :key="option.flow"><strong>{{ option.label }}</strong> — {{ option.reason }}</li>
          </ul>
        </MpFormSection>

        <MpFormSection title="Device" :heading-level="2">
          <MpSegmentedControl v-model="device" :items="DEVICES" ariaLabel="Preview device" />
        </MpFormSection>
      </v-card>

      <div class="maropay-preview__stage">
        <MpAlert v-if="problem" tone="error" title="Checkout couldn’t start">{{ problem.message }}</MpAlert>
        <MpAlert v-else-if="outcome" :tone="outcome.tone" :title="outcome.title">
          {{ outcome.body }}
          <template #actions>
            <v-btn v-if="orderRoute" size="small" variant="outlined" class="text-none" :to="orderRoute">View order</v-btn>
            <v-btn v-if="paymentRoute" size="small" variant="outlined" class="text-none" :to="paymentRoute">View payment</v-btn>
            <v-btn size="small" variant="text" class="text-none" prepend-icon="rotate-ccw" @click="nextRun">Run another checkout</v-btn>
          </template>
        </MpAlert>

        <CheckoutPreviewFrame
          v-if="product && storeId"
          v-model:method="methodId"
          :store-name="maropay.channelName(storeId)"
          :domain="domain"
          :product="{ name: product.name, price }"
          :customer="customer"
          :methods="checkoutMethods"
          :usable="usable"
          :stage="stage"
          :busy="busy"
          :order-number="payment?.orderNumber ?? session?.order?.orderNumber ?? null"
          :decline-message="payment?.failure?.message ?? null"
          :device="device"
          @pay="pay"
          @authenticate="authenticate"
          @retry="startOver"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.maropay-preview {
  display: grid;
  grid-template-columns: minmax(0, var(--mp-layout-detailSidebarWidth)) minmax(0, 1fr);
  gap: var(--mp-space-20);
  align-items: start;
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .maropay-preview {
    grid-template-columns: minmax(0, 1fr);
  }
}

.maropay-preview__controls {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
  padding: var(--mp-component-card-padding);
}

.maropay-preview__flows {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

.maropay-preview__unavailable {
  margin: 0;
  padding-inline-start: var(--mp-space-16);
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}

.maropay-preview__stage {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-16);
  min-width: 0;
}
</style>
