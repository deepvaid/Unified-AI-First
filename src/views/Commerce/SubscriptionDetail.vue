<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommerceStore } from '@/stores/useCommerce'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { useProductStores } from '@/composables/useProductStores'
import { useToast } from '@/composables/useToast'
import { parseDecimal } from '@/maropay/money'
import { localDateKey } from '@/maropay/model'
import { formatStorePrice } from '@/storefront/price'
import { lineVariantText } from '@/storefront/shopperOrders'
import { CANCEL_REASONS, allowedActions, chargeAmount, contractUnitPrice, dayLabel, rescheduleError } from '@/subscriptions/contracts'
import type { ContractAction, ContractEvent } from '@/subscriptions/contracts'
import { deliverySummary, nextChargeDate, planTitle, pricePerDelivery } from '@/subscriptions/plans'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpErrorState from '@/components/MpErrorState.vue'

/**
 * One subscription, as the merchant sees it: who holds it, what they get, when
 * they are charged next, how they pay, and everything that has happened to it.
 * The actions are the same ones the shopper has on the store's /account page,
 * plus the merchant's own: move the charge date, and charge now (which places a
 * renewal order). Rules: src/subscriptions/contracts.ts.
 */
const route = useRoute()
const router = useRouter()
const commerce = useCommerceStore()
const subscriptions = useSubscriptionsStore()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId ?? '2000290'))
const contract = computed(() => subscriptions.contractById(String(route.params.subscriptionId)))
const listRoute = computed(() => ({ name: 'Subscribers', params: { accountId: accountId.value } }))

const stores = useProductStores(accountId).stores
const store = computed(() => stores.value.find((s) => s.id === contract.value?.channelId))
const product = computed(() => commerce.products.find((p) => p.id === contract.value?.productId))
const price = computed(() => (contract.value ? formatStorePrice(chargeAmount(contract.value), store.value?.webStore?.locale) : ''))
/** The choice it was bought in, as an order line reads it ("Can"); empty when it had none. */
const choice = computed(() => (contract.value?.variantTitle
  ? lineVariantText(product.value, { sku: contract.value.sku, variantTitle: contract.value.variantTitle })
  : ''))

function can(action: ContractAction): boolean {
  return !!contract.value && allowedActions(contract.value).includes(action)
}

const facts = computed(() => {
  const c = contract.value
  if (!c) return []
  return [
    { label: 'Next charge', value: c.status === 'Active' ? dayLabel(c.nextChargeOn!) : c.status === 'Payment failed' ? `Failed ${dayLabel(c.nextChargeOn!)}` : c.status === 'Paused' ? 'Paused' : 'None' },
    { label: 'Per delivery', value: price.value },
    { label: 'Delivery', value: deliverySummary(c.plan) },
    { label: 'Started', value: dayLabel(c.startedOn) },
    { label: 'Store', value: store.value?.name ?? '—' },
  ]
})

const address = computed(() => {
  const a = contract.value?.customer.address
  if (!a) return []
  // An address with a state reads "San Francisco, CA 94105"; one without (Sweden) "114 51 Stockholm", as it is written there.
  const place = a.region ? `${a.city}, ${[a.region, a.postalCode].filter(Boolean).join(' ')}` : [a.postalCode, a.city].filter(Boolean).join(' ')
  return [a.line1, place, a.country].filter(Boolean)
})

const WHO: Record<ContractEvent['actor'], string> = { customer: 'By the customer', merchant: 'By the store' }

function orderRoute(event: ContractEvent) {
  return event.order ? { name: 'OrderDetail', params: { accountId: accountId.value, orderId: String(event.order.id) } } : undefined
}

function nextDate(): string {
  return dayLabel(subscriptions.contractById(contract.value!.id)!.nextChargeOn!)
}

// ── Skip, pause, resume ──────────────────────────────────────────────
function skip(): void {
  if (contract.value && subscriptions.skipNext(contract.value.id, 'merchant')) toast.success(`Next delivery skipped. Next charge ${nextDate()}.`)
}

function pause(): void {
  if (contract.value && subscriptions.pause(contract.value.id, 'merchant')) toast.success('Subscription paused. Nothing is charged or sent until it is resumed.')
}

function resume(): void {
  if (contract.value && subscriptions.resume(contract.value.id, 'merchant')) toast.success(`Subscription resumed. Next charge ${nextDate()}.`)
}

// ── Change date ──────────────────────────────────────────────────────
const dateDrawer = ref(false)
const newDate = ref('')
const dateTried = ref(false)
const today = (): string => localDateKey(Date.now())
const dateError = computed(() => (dateTried.value ? rescheduleError(newDate.value, today()) : null))

function openDate(): void {
  newDate.value = contract.value?.nextChargeOn ?? ''
  dateTried.value = false
  dateDrawer.value = true
}

function saveDate(): void {
  dateTried.value = true
  if (!contract.value || dateError.value) return
  subscriptions.reschedule(contract.value.id, newDate.value, 'merchant')
  dateDrawer.value = false
  toast.success(`Next charge moved to ${nextDate()}.`)
}

// ── Change plan ──────────────────────────────────────────────────────
const planDrawer = ref(false)
const newPlanId = ref('')
const otherPlans = computed(() => (contract.value ? subscriptions.plansToChangeTo(contract.value) : []))
const planOptions = computed(() => otherPlans.value.map((plan) => {
  // Priced on the variant it was bought on, as the change itself is.
  const unit = product.value && contract.value ? parseDecimal(contractUnitPrice(product.value, contract.value), contract.value.currency) : null
  const each = unit ? formatStorePrice(pricePerDelivery(unit, plan), store.value?.webStore?.locale) : null
  // A delivery option is named by how often it comes, so its second line is the price alone.
  const parts = [plan.optionOf ? '' : deliverySummary(plan), each ? `${each} per delivery` : ''].filter(Boolean)
  return { title: planTitle(plan), value: plan.id, subtitle: parts.join(' · ') }
}))

function openPlan(): void {
  newPlanId.value = otherPlans.value[0]?.id ?? ''
  planDrawer.value = true
}

function savePlan(): void {
  if (!contract.value || !subscriptions.changePlan(contract.value.id, newPlanId.value, 'merchant')) return
  planDrawer.value = false
  toast.success(`Plan changed to ${contract.value.plan.name}: ${price.value} per delivery.`)
}

// ── Charge now / retry ───────────────────────────────────────────────
const chargeDialog = ref(false)
const retrying = computed(() => contract.value?.status === 'Payment failed')
const afterCharge = computed(() => {
  const c = contract.value
  if (!c?.nextChargeOn) return ''
  // Charged before it is due, the following charge keeps its place; a retry counts from today.
  return dayLabel(nextChargeDate(c.nextChargeOn > today() ? c.nextChargeOn : today(), c.plan))
})

function charge(): void {
  if (!contract.value) return
  const result = subscriptions.chargeNow(contract.value.id, 'merchant')
  if (!result.ok) return void toast.error(result.message)
  const order = result.order
  toast.success(`Charged ${price.value} to ${contract.value.paymentMethod}. Renewal order ${order.number} is placed.`, {
    action: { label: 'View order', onClick: () => void router.push({ name: 'OrderDetail', params: { accountId: accountId.value, orderId: String(order.id) } }) },
    durationMs: 10000,
  })
}

// ── Cancel ───────────────────────────────────────────────────────────
const cancelDialog = ref(false)
const REASONS: string[] = [...CANCEL_REASONS]
const reason = ref<string>(CANCEL_REASONS[0])

function openCancel(): void {
  reason.value = CANCEL_REASONS[0]
  cancelDialog.value = true
}

function confirmCancel(): void {
  if (!contract.value || !subscriptions.cancel(contract.value.id, reason.value, 'merchant')) return
  cancelDialog.value = false
  toast.success('Subscription cancelled. Nothing more will be charged.')
}
</script>

<template>
  <div v-if="contract" class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Commerce · Subscribers"
      :title="`Subscription ${contract.number}`"
      :subtitle="`${contract.customer.name} · ${contract.product}, ${contract.plan.name}`"
      :back-to="listRoute"
    >
      <template #title-append>
        <MpStatusChip :status="contract.status" type="subscription" />
      </template>
      <template #actions>
        <v-btn v-if="can('skip')" variant="outlined" prepend-icon="skip-forward" class="text-none" @click="skip">Skip next delivery</v-btn>
        <v-btn v-if="can('pause')" variant="outlined" prepend-icon="pause" class="text-none" @click="pause">Pause</v-btn>
        <v-btn v-if="can('resume')" color="primary" variant="flat" prepend-icon="play" class="text-none" @click="resume">Resume</v-btn>
        <v-btn v-if="can('charge')" color="primary" variant="flat" prepend-icon="credit-card" class="text-none" @click="chargeDialog = true">Charge now</v-btn>
        <v-btn v-if="can('retry')" color="primary" variant="flat" prepend-icon="rotate-cw" class="text-none" @click="chargeDialog = true">Retry payment</v-btn>
        <MpRowActionsMenu v-if="can('cancel')" ariaLabel="More subscription actions" :item-label="contract.number">
          <MpMenuItem v-if="can('reschedule')" icon="calendar" title="Change next charge date" @click="openDate" />
          <MpMenuItem v-if="can('changePlan') && otherPlans.length" icon="repeat" title="Change plan" @click="openPlan" />
          <v-divider v-if="can('reschedule')" class="my-1" />
          <MpMenuItem icon="circle-x" title="Cancel subscription" danger @click="openCancel" />
        </MpRowActionsMenu>
      </template>
    </MpPageHeader>

    <MpAlert v-if="contract.status === 'Payment failed'" tone="error" title="The last renewal payment failed">
      {{ contract.paymentMethod }} was declined on {{ dayLabel(contract.nextChargeOn!) }}, so the delivery is on hold. Retry the payment, or ask the customer to pay again from their account page.
    </MpAlert>
    <MpAlert v-else-if="contract.status === 'Paused'" tone="warning" title="This subscription is paused">
      Nothing is charged or sent until it is resumed. The customer can resume it from their account page.
    </MpAlert>
    <MpAlert v-else-if="contract.status === 'Cancelled'" tone="info" title="This subscription is cancelled">
      Cancelled on {{ dayLabel(contract.history[0]!.date) }}<template v-if="contract.cancelReason">. Reason: {{ contract.cancelReason }}</template>. Nothing more is charged.
    </MpAlert>

    <div class="d-flex ga-5 sd-layout">
      <!-- Who and how they pay -->
      <div class="sd-layout__side d-flex flex-column ga-4">
        <v-card variant="flat" border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Customer" :heading-level="2" />
          <p class="text-body-2 font-weight-medium mb-1">{{ contract.customer.name }}</p>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ contract.customer.email }}</p>
          <template v-if="address.length">
            <v-divider class="my-4" />
            <p class="mp-meta-label mb-1">Delivers to</p>
            <p v-for="line in address" :key="line" class="text-body-2 mb-0">{{ line }}</p>
          </template>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Payment method" :heading-level="2" />
          <div class="d-flex align-center ga-3">
            <v-icon size="20" class="text-medium-emphasis">credit-card</v-icon>
            <div>
              <p class="text-body-2 font-weight-medium mb-0">{{ contract.paymentMethod }}</p>
              <p class="text-caption text-medium-emphasis mb-0">Saved at checkout for the repeat charges</p>
            </div>
          </div>
        </v-card>
      </div>

      <!-- What they get, and what has happened -->
      <div class="sd-layout__body min-width-0 d-flex flex-column ga-4">
        <v-card variant="flat" border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Subscription" :heading-level="2" />
          <div class="d-flex align-center ga-3 mb-4">
            <v-avatar :size="48" rounded="lg" class="border flex-shrink-0" color="surface-variant">
              <v-img v-if="product?.imageUrls?.length" :src="product.imageUrls[0]" alt="" cover />
              <v-icon v-else size="20">package</v-icon>
            </v-avatar>
            <div class="min-width-0">
              <p class="text-body-2 font-weight-medium mb-0">
                <RouterLink v-if="product" :to="{ name: 'ProductEdit', params: { accountId, productId: product.id } }" class="mp-link">{{ contract.product }}</RouterLink>
                <template v-else>{{ contract.product }}</template>
                <template v-if="choice"> · {{ choice }}</template>
              </p>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ contract.sku }} · {{ contract.plan.name }}<template v-if="contract.qty > 1"> · {{ contract.qty }} per delivery</template>
              </p>
            </div>
          </div>
          <dl class="mp-label-value sd-facts">
            <div v-for="fact in facts" :key="fact.label">
              <dt>{{ fact.label }}</dt>
              <dd>{{ fact.value }}</dd>
            </div>
          </dl>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="mp-card-inset">
          <MpSectionHeader :title="`History (${contract.history.length})`" :heading-level="2" />
          <div role="list">
            <MpListRow
              v-for="(event, index) in contract.history"
              :key="`${event.date}-${index}`"
              role="listitem"
              variant="divided"
              :title="event.text"
              :subtitle="`${dayLabel(event.date)} · ${WHO[event.actor]}`"
            >
              <template v-if="event.order" #trailing>
                <v-btn size="small" variant="text" class="text-none" append-icon="arrow-right" :to="orderRoute(event)">Order {{ event.order.number }}</v-btn>
              </template>
            </MpListRow>
          </div>
        </v-card>
      </div>
    </div>

    <MpFormDrawer v-model="dateDrawer" title="Change next charge date" :subtitle="`${contract.customer.name} · ${contract.product}`" size="sm">
      <!-- The grid keeps a lone field at its own height: a field placed straight in the drawer's column stretches to fill it. -->
      <MpFormGrid>
        <v-text-field
          v-model="newDate"
          label="Next charge *"
          type="date"
          :min="today()"
          :hint="dateError ? undefined : 'Later charges follow from this date.'"
          persistent-hint
          :error-messages="dateError ?? undefined"
        />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="dateDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="saveDate">Save date</v-btn>
      </template>
    </MpFormDrawer>

    <MpFormDrawer v-model="planDrawer" title="Change plan" :subtitle="[contract.customer.name, contract.product, choice].filter(Boolean).join(' · ')" size="sm">
      <MpFormGrid>
        <v-select
          v-model="newPlanId"
          :items="planOptions"
          :item-props="(item: { subtitle: string }) => ({ subtitle: item.subtitle })"
          label="New plan *"
          :hint="contract.nextChargeOn ? `Now on ${contract.plan.name}. The new plan starts with the next charge, on ${dayLabel(contract.nextChargeOn)}.` : undefined"
          persistent-hint
        />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="planDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="savePlan">Change plan</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="chargeDialog"
      :title="retrying ? `Retry the payment of ${price}?` : `Charge ${price} now?`"
      :message="`${contract.paymentMethod} is charged and a renewal order is placed for ${contract.customer.name}.`"
      :consequences="afterCharge ? [`The next charge moves to ${afterCharge}.`] : undefined"
      :confirm-label="retrying ? 'Retry payment' : 'Charge now'"
      @confirm="charge"
    />

    <MpDialog v-model="cancelDialog" title="Cancel this subscription?" :subtitle="`${contract.customer.name} · ${contract.product}`" icon="circle-x" tone="error" size="sm">
      <p class="text-body-2 mb-0">Every future charge stops and nothing more is sent. This can’t be undone: the customer would have to subscribe again.</p>
      <v-select v-model="reason" :items="REASONS" label="Reason *" />
      <template #footer>
        <v-btn variant="text" class="text-none" @click="cancelDialog = false">Keep subscription</v-btn>
        <v-btn color="error" variant="flat" class="text-none" @click="confirmCancel">Cancel subscription</v-btn>
      </template>
    </MpDialog>
  </div>

  <MpErrorState
    v-else
    title="Subscription not found"
    description="It may belong to a store that was restored to its original data."
    action-label="Back to subscribers"
    action-icon="arrow-left"
    @action="router.push(listRoute)"
  />
</template>

<style scoped>
/* The two columns stack on the page's own width, like the detail archetype. */
.sd-layout {
  flex-wrap: wrap;
}

.sd-layout__side {
  flex: 1 1 var(--mp-layout-detailSidebarWidth);
}

.sd-layout__body {
  flex: 999 1 var(--mp-layout-formMaxWidth);
}

.sd-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--mp-component-card-gap);
}
</style>
