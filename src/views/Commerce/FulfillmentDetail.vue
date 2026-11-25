<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommerceStore, type OrderLineItem } from '@/stores/useCommerce'
import {
  FULFILLMENT_STEPS, STEP_LABELS, canFulfill, carriersFor, fulfillmentNumber, nextStep, parcelProblems, stepPosition, suggestedTracking,
} from '@/commerce/fulfillment'
import type { FulfillmentStep, Parcel } from '@/commerce/fulfillment'
import { lineImage, placeLine, variantLine } from './orderLines'
import { formatMoneyParts } from '@/utils/formatMoneyParts'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpErrorState from '@/components/MpErrorState.vue'

// One fulfillment (/commerce/:accountId/fulfillments/:fulfillmentId): what to send,
// where to, and the next step to take. The steps are rules in src/commerce/fulfillment.ts.

const route = useRoute()
const router = useRouter()
const store = useCommerceStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const item = computed(() => store.fulfillmentById(Number(route.params.fulfillmentId)))
const order = computed(() => (item.value ? store.getOrderById(item.value.orderId) : undefined))
const listRoute = computed(() => ({ name: 'Fulfillments', params: { accountId: accountId.value } }))
const orderRoute = computed(() => ({ name: 'OrderDetail', params: { accountId: accountId.value, orderId: String(item.value?.orderId) } }))

const number = computed(() => (item.value ? fulfillmentNumber(item.value.id) : ''))
/** A cancelled or refunded order is not sent, whatever its fulfillment says. */
const stopped = computed(() => !!order.value && !canFulfill(order.value.status))
const step = computed<FulfillmentStep | null>(() => (item.value && !stopped.value ? nextStep(item.value.status) : null))

const STEP_ICONS: Record<FulfillmentStep, string> = { pack: 'package', carrier: 'tag', ship: 'truck', deliver: 'package-check' }
const STEP_HINTS: Record<FulfillmentStep, string> = {
  pack: 'The items are picked. Pack them, then choose a carrier.',
  carrier: 'The parcel is packed. Choose a carrier to create its label.',
  ship: 'The label is ready. Mark the parcel shipped when the carrier has it.',
  deliver: 'The parcel is on its way. Mark it delivered once it arrives.',
}

const dayFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
/** A day, with the time when the moment has one (a seeded fulfillment only knows its day). */
function when(at: string): string {
  return at.includes('T') ? timeFmt.format(new Date(at)) : dayFmt.format(new Date(`${at}T00:00:00`))
}

function money(value: string | number): string {
  return formatMoneyParts(Number(value) || 0, order.value?.currency ?? 'USD').formatted
}
function lineAmount(li: OrderLineItem): string {
  return money(li.qty * parseFloat(li.price) * (1 - li.discountPct / 100))
}

const eventsNewestFirst = computed(() => (item.value ? [...item.value.events].reverse() : []))
const packageSize = computed(() => {
  const p = item.value?.parcel
  if (!p) return []
  return [
    p.lengthCm !== undefined ? { label: 'Length', value: `${p.lengthCm} cm` } : null,
    p.widthCm !== undefined ? { label: 'Width', value: `${p.widthCm} cm` } : null,
    p.heightCm !== undefined ? { label: 'Height', value: `${p.heightCm} cm` } : null,
    p.weightG !== undefined ? { label: 'Weight', value: `${p.weightG} g` } : null,
  ].filter((row): row is { label: string; value: string } => row !== null)
})

// ── Steps ─────────────────────────────────────────────────────────
function takeStep(): void {
  if (!item.value || !step.value) return
  const id = item.value.id
  if (step.value === 'carrier') {
    openCarrier()
  } else if (step.value === 'pack') {
    if (store.packFulfillment(id)) toast.success('Packed. Next, choose a carrier.')
  } else if (step.value === 'ship') {
    if (store.shipFulfillment(id)) toast.success(`Shipped with ${item.value.parcel?.carrier}. The customer can now follow tracking ${item.value.parcel?.trackingNumber}.`)
  } else if (store.deliverFulfillment(id)) {
    toast.success('Delivered. The order is complete.')
  }
}

// ── Pick carrier ──────────────────────────────────────────────────
const SERVICES = ['Standard', 'Express']
const carriers = computed(() => carriersFor(order.value?.shippingAddress.country ?? ''))
const carrierDrawer = ref(false)
const tried = ref(false)
const form = ref({ carrier: '', service: 'Standard', trackingNumber: '', lengthCm: '', widthCm: '', heightCm: '', weightG: '' })

function openCarrier(): void {
  if (!item.value) return
  const carrier = carriers.value[0]!
  form.value = { carrier, service: 'Standard', trackingNumber: suggestedTracking(carrier, item.value.orderId), lengthCm: '', widthCm: '', heightCm: '', weightG: '' }
  tried.value = false
  carrierDrawer.value = true
}

/** A tracking number nobody typed follows the carrier; one the merchant typed stays. */
function chooseCarrier(carrier: string): void {
  if (!item.value) return
  if (form.value.trackingNumber === suggestedTracking(form.value.carrier, item.value.orderId)) {
    form.value.trackingNumber = suggestedTracking(carrier, item.value.orderId)
  }
  form.value.carrier = carrier
}

/** An empty size field is left out; anything typed is a number. */
const size = (value: string | number): number | undefined => (value === '' || value === null ? undefined : Number(value))
const parcel = computed<Parcel>(() => {
  const sizes = { lengthCm: size(form.value.lengthCm), widthCm: size(form.value.widthCm), heightCm: size(form.value.heightCm), weightG: size(form.value.weightG) }
  return {
    carrier: form.value.carrier,
    service: form.value.service,
    trackingNumber: form.value.trackingNumber,
    ...Object.fromEntries(Object.entries(sizes).filter(([, value]) => value !== undefined)),
  }
})
const problems = computed(() => (tried.value ? parcelProblems(parcel.value) : {}))

function saveCarrier(): void {
  if (!item.value) return
  tried.value = true
  if (Object.keys(parcelProblems(parcel.value)).length) return
  if (!store.pickFulfillmentCarrier(item.value.id, parcel.value)) return
  carrierDrawer.value = false
  toast.success(`Label created with ${item.value.parcel?.carrier}. Mark it shipped when the carrier has the parcel.`)
}

async function copyTracking(): Promise<void> {
  const tracking = item.value?.parcel?.trackingNumber
  if (!tracking) return
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
    await navigator.clipboard.writeText(tracking)
    toast.success('Tracking number copied')
  } catch {
    toast.info(`Tracking number: ${tracking}`)
  }
}
</script>

<template>
  <div v-if="item && order" class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Commerce · Fulfillment"
      :title="`Fulfillment ${number}`"
      :subtitle="`Order ${order.orderNumber} · ${order.customer.name} · ${order.salesChannel}`"
      :back-to="listRoute"
    >
      <template #title-append>
        <MpStatusChip :status="item.status" type="fulfillment" />
      </template>
      <template #actions>
        <v-btn variant="outlined" prepend-icon="receipt" class="text-none" :to="orderRoute">View order</v-btn>
        <v-btn v-if="step" color="primary" variant="flat" :prepend-icon="STEP_ICONS[step]" class="text-none" @click="takeStep">{{ STEP_LABELS[step] }}</v-btn>
      </template>
    </MpPageHeader>

    <MpAlert v-if="stopped" tone="warning" :title="`This order is ${order.status.toLowerCase()}`">
      Nothing more is sent for it. If the parcel has already left, arrange the return with the customer.
    </MpAlert>

    <div class="d-flex ga-5 fd-layout">
      <!-- What to send, how far it is, and where it goes -->
      <div class="fd-layout__body d-flex flex-column ga-4">
        <v-card variant="flat" border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Progress" :heading-level="2" />
          <MpWizardSteps :steps="[...FULFILLMENT_STEPS]" :current="stepPosition(item.status)" />
          <p v-if="step" class="text-body-2 text-medium-emphasis mt-4 mb-0">{{ STEP_HINTS[step] }}</p>
          <p v-else-if="item.status === 'Delivered'" class="text-body-2 text-medium-emphasis mt-4 mb-0">Delivered on {{ when(item.deliveredAt!) }}. Nothing is left to do.</p>
          <v-divider class="my-4" />
          <dl class="mp-label-value">
            <div>
              <dt>Fulfilled from</dt>
              <dd>{{ item.location }}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{{ when(item.createdAt) }}</dd>
            </div>
            <div v-if="item.shippedAt">
              <dt>Shipped</dt>
              <dd>{{ when(item.shippedAt) }}</dd>
            </div>
          </dl>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="overflow-hidden">
          <div class="mp-card-inset pb-0">
            <MpSectionHeader :title="`Products (${order.lineItems.length})`" :heading-level="2" />
          </div>
          <v-table>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col" class="text-end">Unit price</th>
                <th scope="col" class="text-end">Qty</th>
                <th scope="col">Location</th>
                <th scope="col" class="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="li in order.lineItems" :key="li.sku + li.product + (li.plan?.id ?? '')">
                <td>
                  <div class="d-flex align-center ga-3 py-2">
                    <v-avatar :size="40" rounded="lg" class="border flex-shrink-0" color="surface-variant">
                      <v-img v-if="lineImage(store.products, li)" :src="lineImage(store.products, li)" alt="" cover />
                      <v-icon v-else size="18">package</v-icon>
                    </v-avatar>
                    <div class="min-width-0">
                      <div class="text-body-2 font-weight-medium">{{ li.product }}</div>
                      <div v-if="variantLine(store.products, li)" class="text-body-2">{{ variantLine(store.products, li) }}</div>
                      <div class="text-caption text-medium-emphasis">SKU {{ li.sku }}</div>
                    </div>
                  </div>
                </td>
                <td class="text-end text-no-wrap fd-num">{{ money(li.price) }}</td>
                <td class="text-end fd-num">{{ li.qty }}</td>
                <td class="text-no-wrap">{{ item.location }}</td>
                <td class="text-end text-no-wrap font-weight-medium fd-num">{{ lineAmount(li) }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Shipping" :heading-level="2" />
          <dl class="mp-label-value">
            <div>
              <dt>Ship to</dt>
              <dd>
                {{ order.shippingAddress.name }}<br>
                {{ order.shippingAddress.line1 }}<br>
                {{ placeLine(order.shippingAddress) }}<br>
                {{ order.shippingAddress.country }}
              </dd>
            </div>
            <div>
              <dt>Shipping charged</dt>
              <dd class="fd-num">{{ money(order.shipping) }}</dd>
            </div>
          </dl>

          <template v-if="item.parcel">
            <v-divider class="my-4" />
            <p class="mp-meta-label mb-3">Tracking</p>
            <dl class="mp-label-value">
              <div>
                <dt>Carrier</dt>
                <dd>{{ item.parcel.carrier }}</dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>{{ item.parcel.service }}</dd>
              </div>
              <div>
                <dt>Tracking number</dt>
                <dd class="d-flex align-center ga-1">
                  <span class="fd-num">{{ item.parcel.trackingNumber }}</span>
                  <v-btn icon="copy" variant="text" size="small" density="comfortable" aria-label="Copy tracking number" @click="copyTracking" />
                </dd>
              </div>
              <div v-for="row in packageSize" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd class="fd-num">{{ row.value }}</dd>
              </div>
            </dl>
          </template>
        </v-card>
      </div>

      <!-- Where it stands, and what has happened -->
      <div class="fd-layout__side d-flex flex-column ga-4">
        <v-card variant="flat" border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Summary" :heading-level="2" />
          <div class="d-flex flex-column ga-3">
            <div class="d-flex align-center justify-space-between ga-3">
              <span class="text-body-2 text-medium-emphasis">Fulfillment</span>
              <MpStatusChip :status="item.status" type="fulfillment" size="sm" />
            </div>
            <div class="d-flex align-center justify-space-between ga-3">
              <span class="text-body-2 text-medium-emphasis">Payment</span>
              <MpStatusChip :status="order.paymentStatus" type="payment" size="sm" />
            </div>
            <div class="d-flex align-center justify-space-between ga-3">
              <span class="text-body-2 text-medium-emphasis">Order</span>
              <MpStatusChip :status="order.status" type="order" size="sm" />
            </div>
            <v-divider />
            <div class="d-flex align-center justify-space-between ga-3">
              <span class="text-body-2 text-medium-emphasis">Order total</span>
              <span class="text-body-1 font-weight-bold fd-num">{{ money(order.total) }}</span>
            </div>
          </div>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Customer" :heading-level="2" />
          <p class="text-body-2 font-weight-medium mb-1">{{ order.customer.name }}</p>
          <p class="text-body-2 text-medium-emphasis mb-3">{{ order.customer.email }}</p>
          <RouterLink :to="orderRoute" class="mp-link text-body-2">Order {{ order.orderNumber }}</RouterLink>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="mp-card-inset">
          <MpSectionHeader :title="`Timeline (${item.events.length})`" :heading-level="2" />
          <div role="list">
            <MpListRow
              v-for="(event, index) in eventsNewestFirst"
              :key="`${event.at}-${index}`"
              role="listitem"
              variant="divided"
              :title="event.text"
              :subtitle="when(event.at)"
            />
          </div>
        </v-card>
      </div>
    </div>

    <MpFormDrawer v-model="carrierDrawer" title="Pick carrier" :subtitle="`${number} · ${order.customer.name}, ${order.shippingAddress.country}`" size="sm">
      <MpFormSection title="Label" />
      <MpFormGrid>
        <v-select
          :model-value="form.carrier"
          :items="carriers"
          label="Carrier *"
          :error-messages="problems.carrier"
          @update:model-value="chooseCarrier"
        />
        <v-select v-model="form.service" :items="SERVICES" label="Service" />
        <v-text-field
          v-model="form.trackingNumber"
          label="Tracking number *"
          placeholder="e.g. 123456789SE"
          :hint="problems.trackingNumber ? undefined : 'The customer sees it on their order page once the parcel ships.'"
          persistent-hint
          :error-messages="problems.trackingNumber"
        />
      </MpFormGrid>
      <MpFormSection title="Package" description="Optional. Carriers price a label by size and weight." />
      <MpFormGrid :cols="2">
        <v-text-field v-model="form.lengthCm" label="Length" type="number" min="0" suffix="cm" placeholder="e.g. 20" :error-messages="problems.lengthCm" />
        <v-text-field v-model="form.widthCm" label="Width" type="number" min="0" suffix="cm" placeholder="e.g. 16" :error-messages="problems.widthCm" />
        <v-text-field v-model="form.heightCm" label="Height" type="number" min="0" suffix="cm" placeholder="e.g. 4" :error-messages="problems.heightCm" />
        <v-text-field v-model="form.weightG" label="Weight" type="number" min="0" suffix="g" placeholder="e.g. 450" :error-messages="problems.weightG" />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="carrierDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="tag" @click="saveCarrier">Create label</v-btn>
      </template>
    </MpFormDrawer>
  </div>

  <MpErrorState
    v-else
    title="Fulfillment not found"
    description="Its order may have been removed, or the link is incorrect."
    action-label="Back to fulfillment"
    action-icon="arrow-left"
    @action="router.push(listRoute)"
  />
</template>

<style scoped>
/* The two columns stack on the page's own width, like the detail archetype. */
.fd-layout {
  flex-wrap: wrap;
}

.fd-layout__body {
  flex: 999 1 var(--mp-layout-formMaxWidth);
  /* Without this the column is as wide as its widest child, and the products table pushes it past a phone's edge. */
  min-width: 0;
}

.fd-layout__side {
  flex: 1 1 var(--mp-layout-detailSidebarWidth);
}

.fd-num {
  font-variant-numeric: tabular-nums;
}
</style>
