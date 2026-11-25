<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommerceStore } from '@/stores/useCommerce'
import { useDemoStores } from '@/stores/useDemoStores'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { useProductStores } from '@/composables/useProductStores'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import { parseDecimal } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { formatStorePrice } from '@/storefront/price'
import { deliverySummary, discountRange, fullPricePerDelivery, intervalLabel, optionsSummary, planErrors, pricePerDelivery, roundForDisplay } from '@/subscriptions/plans'
import type { IntervalUnit, PlanInput, PlanStatus, SubscriptionPlan } from '@/subscriptions/plans'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpAlert from '@/components/MpAlert.vue'

/**
 * Commerce › Subscriptions › Plans: the plans a store's shoppers can subscribe
 * on. A plan shows on the product page of each product it is attached to. There
 * are two kinds, listed together:
 * - a plan with delivery options ("Subscribe and save": every 1, 2 or 3 months,
 *   each with its own discount), made and edited on its own page
 *   (SubscriptionPlanEditor.vue);
 * - a plan of one fixed delivery (a "3-month supply": N units every N weeks or
 *   months at one discount), made and edited in the drawer here.
 * The rules are in src/subscriptions/plans.ts.
 */
const route = useRoute()
const router = useRouter()
const commerce = useCommerceStore()
const subscriptions = useSubscriptionsStore()
const demoStores = useDemoStores()
const toast = useToast()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

// Plans belong to a store that sells its own products. New ones only go to a store
// whose theme sells on subscription; a plan of another store still shows its name.
const productStores = useProductStores(accountId)
const stores = computed(() => productStores.stores.value)
const planStores = computed(() => stores.value.filter((s) => demoStores.blueprintOf(s.id)?.capabilities.subscriptions))
const storeName = (channelId: string) => stores.value.find((s) => s.id === channelId)?.name ?? '—'
const productsOf = (channelId: string) => commerce.products.filter((p) => p.channelIds?.includes(channelId))

/** Stores whose own plans are paused because another theme was applied to them: each says so, and how to switch them back on. */
const pausedByTheme = computed(() => stores.value.flatMap((store) => {
  const running = demoStores.blueprintOf(store.id)
  const original = store.webStore?.blueprint?.original
  if (!running || running.id === original) return []
  const brought = new Set(demoStores.snapshotOf(store.id)?.plans.map((plan) => plan.id) ?? [])
  const paused = subscriptions.plans.filter((plan) => plan.channelId === store.id && !brought.has(plan.id) && plan.status === 'Paused').length
  return paused ? [{ id: store.id, name: store.name, theme: running.card.name, paused }] : []
}))

function formatFor(channelId: string): (amount: Money) => string {
  const store = stores.value.find((s) => s.id === channelId)?.webStore
  return (amount) => formatStorePrice(roundForDisplay(amount), store?.locale)
}

// ── Table ────────────────────────────────────────────────────────────
const headers = [
  { title: 'Plan', key: 'name', sortable: true },
  { title: 'Delivery', key: 'delivery', sortable: false, hideBelow: 'sm' as const },
  { title: 'Discount', key: 'discountPct', sortable: true, align: 'end' as const },
  { title: 'Products', key: 'products', sortable: false, hideBelow: 'md' as const },
  { title: 'Active subscribers', key: 'subscribers', sortable: false, align: 'end' as const, hideBelow: 'lg' as const },
  { title: 'Store', key: 'store', sortable: false, hideBelow: 'lg' as const },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', headerProps: { class: 'mp-th-sr' }, sortable: false, width: 48 },
]
const { visibleHeaders, isVisible } = useResponsiveTableHeaders(headers)

// Status is this table's only filter, so it lives in the toolbar as a pill.
const STATUSES: PlanStatus[] = ['Active', 'Paused']
const statusQuickFilter = { key: 'status', label: 'Status', options: STATUSES.map((v) => ({ label: v, value: v })) }
const statusFilter = ref<string[]>([])
const search = ref('')
const activeFilters = computed(() => (statusFilter.value.length ? [{ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` }] : []))
const filtering = computed(() => !!search.value.trim() || statusFilter.value.length > 0)

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return subscriptions.plans.filter((plan) =>
    (!statusFilter.value.length || statusFilter.value.includes(plan.status))
    && (!q || plan.name.toLowerCase().includes(q) || !!plan.shopperLabel?.toLowerCase().includes(q) || storeName(plan.channelId).toLowerCase().includes(q)))
})

/** How a plan delivers, in one line: its options, or its one fixed delivery. */
const deliveryOf = (plan: SubscriptionPlan): string => (plan.options?.length ? optionsSummary(plan.options) : deliverySummary(plan))
/** The line under it: which option is selected first, or that a fixed delivery ships free. */
function deliveryNote(plan: SubscriptionPlan): string {
  const lead = plan.options?.find((option) => option.isDefault)
  if (lead) return plan.options!.length > 1 ? `Default: ${intervalLabel(lead)}` : ''
  return plan.freeShipping ? 'Free shipping' : ''
}

function productNames(plan: SubscriptionPlan): string[] {
  const inStore = productsOf(plan.channelId)
  return plan.productIds.map((id) => inStore.find((p) => p.id === id)?.name).filter((name): name is string => !!name)
}

// ── Create / edit drawer ─────────────────────────────────────────────
const UNITS: { title: string; value: IntervalUnit }[] = [{ title: 'Weeks', value: 'week' }, { title: 'Months', value: 'month' }]

const blank = (): PlanInput => ({
  name: '', intervalCount: 1, intervalUnit: 'month', unitsPerDelivery: 1, discountPct: 10,
  freeShipping: false, benefits: [], productIds: [], isDefault: false, status: 'Active',
})

const drawer = ref(false)
const editingId = ref<string | null>(null)
const formStore = ref('')
/** The Store picker: the stores that sell plans, and the edited plan's own store. */
const storeOptions = computed(() => stores.value.filter((s) => planStores.value.includes(s) || (!!editingId.value && s.id === formStore.value)))
const form = ref<PlanInput>(blank())
const attempted = ref(false)

const errors = computed(() => (attempted.value ? planErrors(form.value) : {}))
const productOptions = computed(() => productsOf(formStore.value).map((p) => ({ title: p.name, value: p.id })))

function openCreate() {
  editingId.value = null
  formStore.value = planStores.value[0]?.id ?? ''
  form.value = blank()
  attempted.value = false
  drawer.value = true
}

const editorRoute = (planId?: string) => (planId
  ? { name: 'SubscriptionPlanEdit', params: { accountId: accountId.value, planId } }
  : { name: 'SubscriptionPlanNew', params: { accountId: accountId.value } })

/** A plan with delivery options opens its own page; a plan of one fixed delivery, the drawer. */
function openEdit(plan: SubscriptionPlan) {
  if (plan.options?.length) {
    void router.push(editorRoute(plan.id))
    return
  }
  const { id, channelId, ...input } = plan
  editingId.value = id
  formStore.value = channelId
  form.value = { ...input, benefits: [...input.benefits], productIds: [...input.productIds] }
  attempted.value = false
  drawer.value = true
}

/** A product of another store cannot stay on the plan when the store changes. */
function onStoreChange() {
  const ids = new Set(productsOf(formStore.value).map((p) => p.id))
  form.value.productIds = form.value.productIds.filter((id) => ids.has(id))
}

/** What the plan does to a real price, while it is being typed. */
const example = computed(() => {
  const inStore = productsOf(formStore.value)
  const product = inStore.find((p) => form.value.productIds.includes(p.id)) ?? inStore[0]
  const currency = stores.value.find((s) => s.id === formStore.value)?.webStore?.currency
  const unit = product && currency ? parseDecimal(product.price, currency) : null
  if (!product || !unit || Object.keys(planErrors({ ...form.value, name: 'x', productIds: [product.id] })).length) return null
  const format = formatFor(formStore.value)
  return {
    product: product.name,
    price: format(pricePerDelivery(unit, form.value)),
    full: form.value.discountPct > 0 ? format(fullPricePerDelivery(unit, form.value)) : null,
    delivery: deliverySummary(form.value),
  }
})

function savePlan() {
  attempted.value = true
  if (Object.keys(planErrors(form.value)).length) return
  const input: PlanInput = { ...form.value, name: form.value.name.trim(), benefits: form.value.benefits.map((b) => b.trim()).filter(Boolean) }
  const pages = `${input.productIds.length} product ${input.productIds.length === 1 ? 'page' : 'pages'}`
  if (editingId.value) {
    subscriptions.updatePlan(editingId.value, input)
    toast.success(input.status === 'Active' ? `Plan updated. Shoppers see the change on ${pages}.` : 'Plan updated. It is paused, so shoppers do not see it.')
  } else {
    subscriptions.createPlan(formStore.value, input)
    toast.success(input.status === 'Active' ? `Plan created. Shoppers see it on ${pages}.` : 'Plan created. It is paused, so shoppers do not see it yet.')
  }
  drawer.value = false
}

function toggleStatus(plan: SubscriptionPlan) {
  const status: PlanStatus = plan.status === 'Active' ? 'Paused' : 'Active'
  subscriptions.setPlanStatus(plan.id, status)
  toast.success(status === 'Paused' ? `“${plan.name}” is paused. Shoppers no longer see it.` : `“${plan.name}” is active again.`)
}

// ── Delete ───────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<SubscriptionPlan | null>(null)

function askDelete(plan: SubscriptionPlan) {
  // A plan with delivery options that shoppers still hold is paused, not deleted.
  const holding = plan.options?.length ? subscriptions.activeSubscribers(plan.id) : 0
  if (holding) {
    toast.warning(`“${plan.name}” has ${holding} active ${holding === 1 ? 'subscriber' : 'subscribers'}, so it can’t be deleted. Pause it instead: shoppers stop seeing it, and subscribers keep their deliveries.`)
    return
  }
  pendingDelete.value = plan
  confirmDelete.value = true
}

function doDelete() {
  if (pendingDelete.value) {
    subscriptions.deletePlan(pendingDelete.value.id)
    toast.success('Plan deleted')
  }
  pendingDelete.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Commerce · Subscriptions"
      title="Subscription plans"
      subtitle="What shoppers can subscribe on: how often it is delivered, and the discount."
    >
      <template #actions>
        <v-menu v-if="planStores.length" location="bottom end">
          <template #activator="{ props: menu }">
            <v-btn v-bind="menu" color="primary" variant="flat" prepend-icon="plus" append-icon="chevron-down" class="text-none">New plan</v-btn>
          </template>
          <v-list role="menu" aria-label="Kinds of plan">
            <MpMenuItem icon="repeat" title="Plan with delivery options" subtitle="Shoppers pick how often. Each option has its own discount." :to="editorRoute()" />
            <MpMenuItem icon="package" title="Fixed delivery plan" subtitle="One size and frequency, such as a 3-month supply." @click="openCreate" />
          </v-list>
        </v-menu>
      </template>
    </MpPageHeader>

    <MpAlert v-for="store in pausedByTheme" :key="store.id" tone="info" :title="`${store.name} is a copy of ${store.theme}`">
      Its own {{ store.paused === 1 ? 'plan was' : 'plans were' }} paused when {{ store.theme }} was applied, and {{ store.paused === 1 ? 'stays' : 'stay' }}
      paused while it runs. Restoring the original store brings its own plans back.
      <template #actions>
        <v-btn variant="text" size="small" class="text-none" :to="{ name: 'StoreThemes', params: { accountId, channelId: store.id } }">Open its themes</v-btn>
      </template>
    </MpAlert>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="statusFilter"
        v-model:search="search"
        title="All plans"
        search-placeholder="Search plans"
        :total-count="rows.length"
        :quick-filter="statusQuickFilter"
        :active-filters="activeFilters"
        @remove-filter="statusFilter = []"
        @clear-filters="statusFilter = []"
      />

      <v-data-table :headers="visibleHeaders" :items="rows" :items-per-page="15" hover density="comfortable" fixed-header class="flex-grow-1">
        <template #item.name="{ item }">
          <div class="py-2">
            <div class="d-flex align-center flex-wrap ga-2">
              <button type="button" class="mp-link text-body-2 font-weight-medium sp-name" @click="openEdit(item)">{{ item.name }}</button>
              <v-chip v-if="item.isDefault" size="x-small" variant="tonal" color="primary" label>Preselected</v-chip>
            </div>
            <!-- What shoppers read over a plan's delivery options. -->
            <div v-if="item.shopperLabel" class="text-caption text-medium-emphasis">{{ item.shopperLabel }}</div>
            <!-- A dropped Delivery column folds in here rather than disappearing. -->
            <div v-if="!isVisible('delivery')" class="text-caption text-medium-emphasis">{{ deliveryOf(item) }}</div>
          </div>
        </template>
        <template #item.delivery="{ item }">
          <div class="text-body-2">{{ deliveryOf(item) }}</div>
          <div v-if="deliveryNote(item)" class="text-caption text-medium-emphasis">{{ deliveryNote(item) }}</div>
        </template>
        <template #item.discountPct="{ item }">
          <span class="text-body-2 text-no-wrap">{{ discountRange(item) }}</span>
        </template>
        <template #item.subscribers="{ item }">
          <span class="text-body-2">{{ subscriptions.activeSubscribers(item.id) }}</span>
        </template>
        <template #item.products="{ item }">
          <v-tooltip v-if="productNames(item).length" location="top" :text="productNames(item).join(', ')">
            <template #activator="{ props: tip }">
              <v-chip v-bind="tip" size="x-small" variant="tonal" label tabindex="0">
                {{ productNames(item).length }} {{ productNames(item).length === 1 ? 'product' : 'products' }}
              </v-chip>
            </template>
          </v-tooltip>
          <span v-else class="text-body-2 text-medium-emphasis">None</span>
        </template>
        <template #item.store="{ item }">
          <span class="text-body-2">{{ storeName(item.channelId) }}</span>
        </template>
        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Plan actions" :item-label="item.name">
            <MpMenuItem icon="pencil" title="Edit" @click="openEdit(item)" />
            <MpMenuItem :icon="item.status === 'Active' ? 'pause' : 'play'" :title="item.status === 'Active' ? 'Pause' : 'Make active'" @click="toggleStatus(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template #no-data>
          <MpEmptyState
            :icon="filtering ? 'search-x' : 'repeat'"
            :title="filtering ? 'No plans match your filters' : 'No subscription plans'"
            :description="filtering
              ? 'Try a different search term or clear the status filter.'
              : planStores.length
                ? 'Create a plan to let shoppers subscribe to a product at a discount.'
                : 'Plans are sold by a store that has products of its own. This account has no such store yet.'"
            :action-label="filtering || !planStores.length ? undefined : 'New plan'"
            :action-icon="filtering || !planStores.length ? undefined : 'plus'"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFormDrawer
      v-model="drawer"
      :title="editingId ? 'Edit plan' : 'New fixed delivery plan'"
      subtitle="Shown as a purchase option on the product page"
    >
      <MpFormGrid :cols="2">
        <v-text-field v-model="form.name" label="Plan name *" placeholder="Monthly subscription" class="mp-form-grid__full" :error-messages="errors.name" />
        <v-select
          v-if="storeOptions.length > 1"
          v-model="formStore"
          :items="storeOptions"
          item-title="name"
          item-value="id"
          label="Store"
          class="mp-form-grid__full"
          :disabled="!!editingId"
          @update:model-value="onStoreChange"
        />
        <v-text-field v-model.number="form.intervalCount" label="Deliver every *" type="number" min="1" max="12" :error-messages="errors.intervalCount" />
        <v-select v-model="form.intervalUnit" :items="UNITS" label="Period" />
        <v-text-field v-model.number="form.unitsPerDelivery" label="Units per delivery *" type="number" min="1" max="12" :error-messages="errors.unitsPerDelivery" />
        <v-text-field v-model.number="form.discountPct" label="Discount" type="number" min="0" max="90" suffix="%" :error-messages="errors.discountPct" />
      </MpFormGrid>

      <div v-if="example" class="sp-example" role="status">
        <span class="sp-example__label">Example</span>
        <span>
          {{ example.product }}: <strong>{{ example.price }}</strong> per delivery<template v-if="example.full">, instead of {{ example.full }}</template>
          ({{ example.delivery }}).
        </span>
      </div>

      <MpFormSection title="Products" description="The plan shows on the product page of each product you pick." />
      <v-select
        v-model="form.productIds"
        :items="productOptions"
        label="Products *"
        multiple
        chips
        closable-chips
        :error-messages="errors.productIds"
      />

      <MpFormSection title="On the product page" />
      <MpFormGrid>
        <v-combobox
          v-model="form.benefits"
          label="Benefits"
          placeholder="Skip or cancel anytime"
          hint="Short lines under the option. Type one and press Enter."
          persistent-hint
          multiple
          chips
          closable-chips
        />
        <v-switch v-model="form.freeShipping" label="Free shipping" hint="Shows a “Free shipping” badge on the option." persistent-hint />
        <v-switch v-model="form.isDefault" label="Preselected" hint="Chosen when the product page opens. One plan per store." persistent-hint />
        <v-select v-model="form.status" :items="STATUSES" label="Status" hint="A paused plan is not offered to shoppers." persistent-hint />
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="savePlan">
          {{ editingId ? 'Save changes' : 'Create plan' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete this plan?"
      :message="`Shoppers will no longer be offered “${pendingDelete?.name}”. Orders already placed on it keep their plan.`"
      confirm-label="Delete plan"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
/* A plan's name opens its drawer: a button that reads as the table's link. */
.sp-name {
  padding: 0;
  border: 0;
  background: none;
  text-align: start;
  cursor: pointer;
}

.sp-example {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  padding: var(--mp-space-12);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-10);
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}

.sp-example__label {
  font-size: var(--mp-fontSize-12);
  font-weight: 600;
  color: var(--muted);
}

.sp-example strong {
  color: rgb(var(--v-theme-on-surface));
}
</style>
