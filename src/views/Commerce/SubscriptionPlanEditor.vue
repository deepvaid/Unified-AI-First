<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommerceStore } from '@/stores/useCommerce'
import { useDemoStores } from '@/stores/useDemoStores'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useProductStores } from '@/composables/useProductStores'
import { useToast } from '@/composables/useToast'
import { parseDecimal } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { lowestPrice } from '@/storefront/catalog'
import { formatStorePrice } from '@/storefront/price'
import { purchaseOptionsSettings } from '@/storefront/themeSections'
import {
  MAX_PLANS_PER_PRODUCT, MAX_PLAN_OPTIONS, hasOptionPlanErrors, intervalLabel, offeredRows, optionLayout, optionPlanErrors,
  planFromOptions, purchaseOptions, roundForDisplay, withOneDefault,
} from '@/subscriptions/plans'
import type { IntervalUnit, OptionPlanInput, PlanOption } from '@/subscriptions/plans'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * A plan with delivery options, on a page of its own
 * (/commerce/:accountId/subscriptions/plans/new and /:planId): what shoppers read,
 * how often it can come and what each frequency takes off, and the products it is
 * sold on, beside what the product page will show. The rules are in
 * src/subscriptions/plans.ts. A plan of one fixed delivery is edited in the drawer
 * on the plans list.
 */
const route = useRoute()
const router = useRouter()
const commerce = useCommerceStore()
const subscriptions = useSubscriptionsStore()
const demoStores = useDemoStores()
const themes = useStoreThemesStore()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const listRoute = computed(() => ({ name: 'SubscriptionPlans', params: { accountId: accountId.value } }))
const planId = computed(() => (typeof route.params.planId === 'string' ? route.params.planId : null))
const existing = computed(() => subscriptions.plans.find((plan) => plan.id === planId.value && !!plan.options?.length))
const missing = computed(() => !!planId.value && !existing.value)

// A plan belongs to a store that sells on subscription; an edited plan stays in its own.
const productStores = useProductStores(accountId)
const stores = computed(() => productStores.stores.value)
const planStores = computed(() => stores.value.filter((s) => demoStores.blueprintOf(s.id)?.capabilities.subscriptions))
const storeId = ref(existing.value?.channelId ?? planStores.value[0]?.id ?? '')
const store = computed(() => stores.value.find((s) => s.id === storeId.value))
const products = computed(() => commerce.products.filter((p) => p.channelIds?.includes(storeId.value)))

const UNITS: { title: string; value: IntervalUnit }[] = [{ title: 'Weeks', value: 'week' }, { title: 'Months', value: 'month' }]
const LABEL_EXAMPLE = 'Subscribe and save'

function startingForm(): OptionPlanInput {
  const plan = existing.value
  if (plan) {
    return { name: plan.name, shopperLabel: plan.shopperLabel ?? '', status: plan.status, options: plan.options!.map((o) => ({ ...o })), productIds: [...plan.productIds] }
  }
  return { name: '', shopperLabel: '', status: 'Active', options: [{ id: 'o1', intervalCount: 1, intervalUnit: 'month', discountPct: 10, isDefault: true }], productIds: [] }
}
const form = ref<OptionPlanInput>(startingForm())
const attempted = ref(false)

const saved = ref(JSON.stringify([storeId.value, form.value]))
const isDirty = computed(() => JSON.stringify([storeId.value, form.value]) !== saved.value)
const { confirmLeave, allowNextLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel } = useDirtyLeaveGuard(isDirty, {
  title: 'Discard this plan?',
  message: 'Your changes won’t be saved.',
  confirmLabel: 'Discard',
})

// ── Plan options ─────────────────────────────────────────────────────
const active = computed({
  get: () => form.value.status === 'Active',
  set: (on: boolean) => { form.value.status = on ? 'Active' : 'Paused' },
})

/** The option selected first. Choosing another takes it from the rest. */
const defaultId = computed({
  get: () => form.value.options.find((o) => o.isDefault)?.id ?? null,
  set: (id: string | null) => { form.value.options = form.value.options.map((o) => ({ ...o, isDefault: o.id === id })) },
})

function addOption(): void {
  const options = form.value.options
  const last = options[options.length - 1]
  const next = options.reduce((max, o) => Math.max(max, Number(/^o(\d+)$/.exec(o.id)?.[1] ?? 0)), 0) + 1
  // The next frequency along, at the last option's discount, so one more click is a sensible row.
  const taken = new Set(options.filter((o) => o.intervalUnit === (last?.intervalUnit ?? 'month')).map((o) => o.intervalCount))
  let count = (last?.intervalCount ?? 0) + 1
  while (taken.has(count) && count < 12) count += 1
  form.value.options = withOneDefault([...options, { id: `o${next}`, intervalCount: count, intervalUnit: last?.intervalUnit ?? 'month', discountPct: last?.discountPct ?? 10, isDefault: false }])
}

function removeOption(id: string): void {
  form.value.options = withOneDefault(form.value.options.filter((o) => o.id !== id))
}

/** "every 3 months", or "option 2" while its frequency is not a number yet. */
const optionName = (option: PlanOption, index: number): string => (Number.isInteger(option.intervalCount) && option.intervalCount > 0 ? intervalLabel(option) : `option ${index + 1}`)

// ── Products ─────────────────────────────────────────────────────────
const otherPlans = computed(() => subscriptions.plans.filter((plan) => plan.channelId === storeId.value && plan.id !== planId.value))
const productName = (id: number): string => products.value.find((p) => p.id === id)?.name ?? `Product ${id}`
const format = (amount: Money): string => formatStorePrice(amount, store.value?.webStore?.locale)

const search = ref('')
const shown = ref<string | null>('all')
const shownItems = computed(() => [
  { value: 'all', label: 'All products' },
  { value: 'selected', label: `Selected (${form.value.productIds.length})` },
])

const productHeaders = [
  { title: 'Product', key: 'name', sortable: true },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Price', key: 'price', sortable: false, align: 'end' as const },
  { title: 'Other plans', key: 'otherPlans', sortable: true, align: 'end' as const },
]

const productRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  const currency = store.value?.webStore?.currency ?? 'USD'
  return products.value
    .filter((p) => (shown.value !== 'selected' || form.value.productIds.includes(p.id)) && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
    .map((p) => {
      const on = otherPlans.value.filter((plan) => plan.productIds.includes(p.id)).length
      const unit = parseDecimal(lowestPrice(p), currency)
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        status: p.publishStatus,
        price: unit ? format(unit) : '—',
        otherPlans: on,
        // A product already on its limit can be taken off this plan, but not put on it.
        selectable: on < MAX_PLANS_PER_PRODUCT || form.value.productIds.includes(p.id),
      }
    })
})

/** A product of another store cannot stay on the plan when the store changes. */
function onStoreChange(): void {
  const ids = new Set(products.value.map((p) => p.id))
  form.value.productIds = form.value.productIds.filter((id) => ids.has(id))
}

// ── Errors ───────────────────────────────────────────────────────────
const errors = computed(() => (attempted.value ? optionPlanErrors(form.value, otherPlans.value, productName) : { rows: {} as Record<string, { intervalCount?: string; discountPct?: string }> }))

// ── Shopper preview ──────────────────────────────────────────────────
// What the product page shows for this plan, on one of its products. An option whose
// numbers are not valid yet is left out, so the preview never shows a wrong price.
/** The store's purchase options block: what its product page opens on, and the line under the options. */
const buyBox = computed(() => purchaseOptionsSettings(themes.themeForChannel(storeId.value)))
/**
 * The page opens on the plan's default option only when the theme's Default selection
 * is Subscription (Daybloom's). Otherwise it opens on One-time purchase (Vitaheal's), and
 * shoppers choose how often themselves, as defaultOptionId decides on the storefront.
 */
const subscriptionFirst = computed(() => !!buyBox.value?.subscriptionFirst)

const preview = computed(() => {
  const product = products.value.find((p) => form.value.productIds.includes(p.id)) ?? products.value[0]
  const currency = store.value?.webStore?.currency
  const unit = product && currency ? parseDecimal(lowestPrice(product), currency) : null
  if (!product || !unit) return null
  const invalid = optionPlanErrors(form.value).rows
  const options = form.value.options.filter((o) => !invalid[o.id])
  const plan = { ...planFromOptions({ ...form.value, shopperLabel: form.value.shopperLabel.trim() || LABEL_EXAMPLE, options }), id: 'preview', channelId: storeId.value }
  const shownAs = (amount: Money) => formatStorePrice(roundForDisplay(amount), store.value?.webStore?.locale)
  const group = optionLayout(purchaseOptions(unit, offeredRows(plan))).groups[0]
  // With no option to offer yet, the page opens on buying once whatever the theme says.
  const opensOnPlan = subscriptionFirst.value && !!group?.options.length
  return {
    product: product.name,
    oneTime: shownAs(unit),
    opensOnPlan,
    label: plan.shopperLabel,
    saving: group?.maxDiscountPct ? `Save up to ${group.maxDiscountPct}%` : '',
    rows: (group?.options ?? []).map((option) => ({
      id: option.id,
      title: intervalLabel(option.plan!).replace(/^e/, 'E'),
      note: [option.plan!.discountPct ? `${option.plan!.discountPct}% off` : '', opensOnPlan && option.plan!.isDefault ? 'Selected first' : ''].filter(Boolean).join(' · '),
      price: shownAs(option.price),
      full: option.compareAt ? shownAs(option.compareAt) : '',
      first: opensOnPlan && option.plan!.isDefault,
    })),
    policy: buyBox.value?.policyText || 'Pause or cancel any time.',
  }
})

// ── Save ─────────────────────────────────────────────────────────────
function save(): void {
  attempted.value = true
  if (hasOptionPlanErrors(optionPlanErrors(form.value, otherPlans.value, productName))) {
    toast.error('The plan can’t be saved yet. Check the fields marked in red.')
    return
  }
  const input = planFromOptions(form.value)
  const pages = `${input.productIds.length} product ${input.productIds.length === 1 ? 'page' : 'pages'}`
  const seen = input.status !== 'Active' ? 'It is paused, so shoppers do not see it.' : input.productIds.length ? `Shoppers see it on ${pages}.` : 'Add products to it, and shoppers will see it on their pages.'
  if (existing.value) {
    subscriptions.updatePlan(existing.value.id, input)
    toast.success(`Plan updated. ${seen}`)
  } else {
    subscriptions.createPlan(storeId.value, input)
    toast.success(`Plan created. ${seen}`)
  }
  allowNextLeave()
  void router.push(listRoute.value)
}
</script>

<template>
  <MpErrorState
    v-if="missing"
    title="Plan not found"
    description="It may have been deleted, or it belongs to a store that was restored to its original data."
    action-label="Back to plans"
    action-icon="arrow-left"
    @action="router.push(listRoute)"
  />

  <MpEmptyState
    v-else-if="!planStores.length && !existing"
    icon="repeat"
    title="No store sells on subscription yet"
    description="Plans are sold by a store that has products of its own. This account has no such store."
    action-label="Back to plans"
    action-icon="arrow-left"
    @action="router.push(listRoute)"
  />

  <div v-else class="d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Commerce · Subscription plans"
      :title="existing ? 'Edit plan' : 'Create plan'"
      :subtitle="existing ? existing.name : 'Let shoppers buy on a repeating schedule at a discount'"
      :back-to="listRoute"
    >
      <template #actions>
        <v-btn variant="text" class="text-none" :to="listRoute">Cancel</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="check" class="text-none" @click="save">{{ existing ? 'Save changes' : 'Create plan' }}</v-btn>
      </template>
    </MpPageHeader>

    <div class="d-flex ga-5 spe-layout">
      <div class="spe-layout__body d-flex flex-column ga-4">
        <!-- Plan details -->
        <v-card variant="flat" border rounded="lg" class="mp-card-inset">
          <MpSectionHeader title="Plan details" description="Name the plan and choose what shoppers see." :heading-level="2" />
          <MpFormGrid :cols="2">
            <v-text-field
              v-model="form.name"
              label="Plan name *"
              placeholder="e.g. Monthly subscribe and save"
              :hint="errors.name ? undefined : 'Only you see this. It must be unique in this store.'"
              persistent-hint
              :error-messages="errors.name"
            />
            <v-text-field
              v-model="form.shopperLabel"
              label="Shopper label *"
              :placeholder="LABEL_EXAMPLE"
              :hint="errors.shopperLabel ? undefined : 'Shown on the product page and in the cart.'"
              persistent-hint
              :error-messages="errors.shopperLabel"
            />
            <v-select
              v-if="planStores.length > 1 || existing"
              v-model="storeId"
              :items="existing ? stores.filter((s) => s.id === storeId) : planStores"
              item-title="name"
              item-value="id"
              label="Store"
              class="mp-form-grid__full"
              :disabled="!!existing"
              @update:model-value="onStoreChange"
            />
            <v-switch v-model="active" label="Active" hint="A paused plan is hidden on the store. Subscribers keep their deliveries." persistent-hint class="mp-form-grid__full" />
          </MpFormGrid>
        </v-card>

        <!-- Plan options -->
        <v-card variant="flat" border rounded="lg" class="mp-card-inset">
          <MpSectionHeader
            title="Plan options"
            :description="subscriptionFirst
              ? 'Shoppers pick one. Each option has its own discount off the selling price. The default is selected first.'
              : 'Shoppers pick one. Each option has its own discount off the selling price. This store’s product pages open on One-time purchase, so shoppers choose how often themselves. The default is selected first when the theme’s Default selection is Subscription.'"
            :heading-level="2"
          />
          <v-radio-group v-model="defaultId" hide-details aria-label="Default option">
            <div class="spe-options">
              <div class="spe-option spe-option--head" aria-hidden="true">
                <span class="spe-option__every">Deliver every</span>
                <span class="spe-option__discount">Discount</span>
                <span class="spe-option__default">Default</span>
                <span />
              </div>
              <!-- Each field is named after its row: the frequency's own two by the row's place, so a name never changes while it is typed in. -->
              <div v-for="(option, index) in form.options" :key="option.id" class="spe-option">
                <v-text-field
                  v-model.number="option.intervalCount"
                  type="number"
                  min="1"
                  max="12"
                  prefix="Every"
                  :aria-label="`Deliver every, option ${index + 1}`"
                  :error-messages="errors.rows[option.id]?.intervalCount"
                />
                <v-select v-model="option.intervalUnit" :items="UNITS" :aria-label="`Period, option ${index + 1}`" />
                <v-text-field
                  v-model.number="option.discountPct"
                  type="number"
                  min="0"
                  max="90"
                  suffix="% off"
                  :aria-label="`Discount, ${optionName(option, index)}`"
                  :error-messages="errors.rows[option.id]?.discountPct"
                />
                <div class="spe-option__default spe-option__cell">
                  <v-radio :value="option.id" :aria-label="`Make ${optionName(option, index)} the default`" />
                </div>
                <div class="spe-option__cell">
                  <v-btn
                    icon="trash-2"
                    variant="text"
                    size="small"
                    :disabled="form.options.length === 1"
                    :aria-label="`Remove ${optionName(option, index)}`"
                    @click="removeOption(option.id)"
                  />
                </div>
              </div>
            </div>
          </v-radio-group>
          <p v-if="errors.options" class="text-caption text-error mt-2 mb-0" role="alert">{{ errors.options }}</p>
          <v-btn
            variant="text"
            prepend-icon="plus"
            class="text-none align-self-start mt-2"
            :disabled="form.options.length >= MAX_PLAN_OPTIONS"
            @click="addOption"
          >
            Add plan option
          </v-btn>
        </v-card>

        <!-- Products -->
        <v-card variant="flat" border rounded="lg" class="overflow-hidden">
          <div class="mp-card-inset pb-0">
            <MpSectionHeader
              title="Products"
              :description="`Choose the products shoppers can subscribe to with this plan. A product can have up to ${MAX_PLANS_PER_PRODUCT} plans.`"
              :heading-level="2"
            />
            <div class="d-flex flex-wrap align-center ga-3 mb-4">
              <!-- hide-details: a search box above a table, with nothing to validate. -->
              <v-text-field
                v-model="search"
                prepend-inner-icon="search"
                placeholder="Search name or SKU"
                aria-label="Search products"
                clearable
                hide-details
                class="spe-search"
              />
              <MpSegmentedControl v-model="shown" :items="shownItems" ariaLabel="Products shown" />
            </div>
            <p v-if="errors.productIds" class="text-caption text-error mb-4" role="alert">{{ errors.productIds }}</p>
          </div>
          <v-data-table
            v-model="form.productIds"
            :headers="productHeaders"
            :items="productRows"
            item-value="id"
            item-selectable="selectable"
            show-select
            :items-per-page="10"
            density="comfortable"
          >
            <!-- Labelled select boxes (WCAG W-04). aria-checked is dropped: Vuetify's "mixed" is invalid on a native checkbox. -->
            <template #header.data-table-select="{ allSelected, selectAll, someSelected }">
              <v-checkbox-btn
                :model-value="allSelected"
                :indeterminate="someSelected && !allSelected"
                :aria-checked="undefined"
                aria-label="Select all products"
                @update:model-value="selectAll(!allSelected)"
              />
            </template>
            <template #item.data-table-select="{ internalItem, isSelected, toggleSelect }">
              <v-checkbox-btn
                :model-value="isSelected(internalItem)"
                :disabled="!internalItem.raw.selectable"
                :aria-label="`Sell ${internalItem.raw.name} on this plan`"
                @update:model-value="toggleSelect(internalItem)"
              />
            </template>
            <template #item.name="{ item }">
              <div class="py-2">
                <div class="text-body-2 font-weight-medium">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.sku }}</div>
              </div>
            </template>
            <template #item.status="{ item }">
              <MpStatusChip :status="item.status" type="general" size="sm" />
            </template>
            <template #item.price="{ item }">
              <span class="text-body-2 text-no-wrap spe-num">{{ item.price }}</span>
            </template>
            <template #item.otherPlans="{ item }">
              <span class="text-body-2 spe-num">{{ item.otherPlans }}<template v-if="!item.selectable"> (the limit)</template></span>
            </template>
            <template #no-data>
              <MpEmptyState
                :icon="search || shown === 'selected' ? 'search-x' : 'package'"
                :title="search ? 'No products match' : shown === 'selected' ? 'No products selected yet' : 'This store has no products'"
                :description="search ? 'Try another name or SKU.' : shown === 'selected' ? 'Show all products and tick the ones to sell on this plan.' : 'Add products to the store first.'"
              />
            </template>
          </v-data-table>
        </v-card>
      </div>

      <!-- What the product page will show -->
      <div class="spe-layout__side">
        <v-card variant="flat" border rounded="lg" class="mp-card-inset spe-preview" aria-label="Shopper preview">
          <MpSectionHeader
            title="Shopper preview"
            :description="preview
              ? `On the product page for ${preview.product}, ${preview.oneTime}${preview.opensOnPlan ? '' : '. It opens on One-time purchase.'}`
              : 'Pick a store with products to see the plan as shoppers will.'"
            :heading-level="2"
          />
          <!-- The choice the page opens on is outlined, as defaultOptionId chooses it on the storefront. -->
          <div v-if="preview" class="d-flex flex-column ga-2">
            <div class="spe-choice" :class="{ 'spe-choice--on': !preview.opensOnPlan }">
              <v-icon v-if="preview.opensOnPlan" size="16" class="text-medium-emphasis">circle</v-icon>
              <v-icon v-else size="16" color="primary">circle-dot</v-icon>
              <span class="text-body-2 flex-grow-1" :class="{ 'font-weight-medium': !preview.opensOnPlan }">One-time purchase</span>
              <span class="text-body-2 spe-num">{{ preview.oneTime }}</span>
            </div>
            <div class="spe-choice" :class="{ 'spe-choice--on': preview.opensOnPlan }">
              <v-icon v-if="preview.opensOnPlan" size="16" color="primary">circle-dot</v-icon>
              <v-icon v-else size="16" class="text-medium-emphasis">circle</v-icon>
              <span class="text-body-2 font-weight-medium flex-grow-1">{{ preview.label }}</span>
              <span v-if="preview.saving" class="text-caption font-weight-medium text-primary text-no-wrap">{{ preview.saving }}</span>
            </div>
            <div class="d-flex flex-column ga-2 spe-frequencies">
              <div v-for="row in preview.rows" :key="row.id" class="spe-choice spe-choice--row" :class="{ 'spe-choice--on': row.first }">
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium">{{ row.title }}</div>
                  <div v-if="row.note" class="text-caption text-medium-emphasis">{{ row.note }}</div>
                </div>
                <div class="text-end">
                  <div class="text-body-2 font-weight-medium spe-num">{{ row.price }}</div>
                  <s v-if="row.full" class="text-caption text-medium-emphasis spe-num">{{ row.full }}</s>
                </div>
              </div>
              <p v-if="!preview.rows.length" class="text-caption text-medium-emphasis mb-0">Add a delivery option to see what shoppers are offered.</p>
            </div>
            <p class="text-caption text-medium-emphasis mb-0">{{ preview.policy }}</p>
          </div>
        </v-card>
      </div>
    </div>

    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />
  </div>
</template>

<style scoped>
/* The two columns stack on the page's own width, like the detail archetype. */
.spe-layout {
  flex-wrap: wrap;
  align-items: flex-start;
}

.spe-layout__body {
  flex: 999 1 var(--mp-layout-formMaxWidth);
  /* Without this the column is as wide as its widest child, and the products table pushes it past a phone's edge. */
  min-width: 0;
}

.spe-layout__side {
  flex: 1 1 var(--mp-layout-detailSidebarWidth);
  position: sticky;
  top: var(--mp-space-16);
}

/* One option per row: how often, its discount, whether it leads, and its bin. */
.spe-options {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
  width: 100%;
}

.spe-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) var(--mp-space-64) var(--mp-component-control-height);
  gap: var(--mp-space-12);
  align-items: start;
}

.spe-option--head {
  font-size: var(--mp-fontSize-12);
  font-weight: 500;
  color: var(--text-secondary);
}

.spe-option__every {
  grid-column: span 2;
}

.spe-option__default {
  justify-self: center;
}

/* The radio and the bin sit on the field's own centre line. */
.spe-option__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--mp-component-control-height);
}

/* On a phone an option takes two lines: how often, then its discount, default and bin. */
@media (max-width: 600px) {
  .spe-option {
    display: flex;
    flex-wrap: wrap;
  }

  .spe-option > :nth-child(1),
  .spe-option > :nth-child(2) {
    flex: 1 1 calc(50% - var(--mp-space-12));
    min-width: 0;
  }

  /* Half the row to start from, so it wraps under the first two and then takes what the radio and bin leave. */
  .spe-option > :nth-child(3) {
    flex: 1 1 50%;
    min-width: 0;
  }

  .spe-option--head {
    display: none;
  }
}

.spe-search {
  flex: 1 1 var(--mp-component-toolbar-searchMinWidth);
}

.spe-num {
  font-variant-numeric: tabular-nums;
}

/* The preview's choices: quiet boxes, the selected one outlined in the accent. */
.spe-choice {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  padding: var(--mp-space-10) var(--mp-space-12);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-input-radius);
}

.spe-choice--row {
  align-items: flex-start;
}

.spe-choice--on {
  border-color: rgb(var(--v-theme-primary));
}

.spe-frequencies {
  padding-inline-start: var(--mp-space-16);
}
</style>
