<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useCommerceStore,
  type Product, type ProductDetail, type ProductVariant, type PublishStatus,
} from '@/stores/useCommerce'
import { useProductExtrasStore, INVENTORY_LOCATIONS } from '@/stores/useProductExtras'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useDisplay } from 'vuetify'
import DvCatalogCta from '@/components/copilot/DvCatalogCta.vue'
import ProductMediaField from '@/components/products/ProductMediaField.vue'
import ProductSizeGuideCard from '@/components/products/ProductSizeGuideCard.vue'
import VehicleFitmentCard from '@/components/products/VehicleFitmentCard.vue'
import VariantGrid from '@/components/products/VariantGrid.vue'
import { isPlaceholderImage } from '@/components/products/productMedia'
import { useProductStores } from '@/composables/useProductStores'
import { parseDecimal } from '@/maropay/money'
import { withPrimaryCollection } from '@/storefront/catalog'
import { sellsParts, type Fitment } from '@/storefront/fitment'
import { cleanSpecs, positionsFor, specErrors } from '@/storefront/fitmentForm'
import { formatStorePrice } from '@/storefront/price'
import { optionKind } from '@/storefront/variants'
import { useSizeChartsStore } from '@/stores/useSizeCharts'
import { useCopilotStore } from '@/stores/useCopilot'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { useDemoStores } from '@/stores/useDemoStores'
import { deliverySummary, discountRange, optionsSummary, pricePerDelivery, roundForDisplay } from '@/subscriptions/plans'
import type { SubscriptionPlan } from '@/subscriptions/plans'
import { mp_layout_breakpointCompact } from '@/design-tokens/generated/tokens'
import { useCatalogCopilotStore, type CatalogApplyPayload } from '@/stores/useCatalogCopilot'
import type { CatalogField } from '@/composables/catalogCopilotConfig'
import type { ProductSnapshot } from '@/composables/useCatalogGenerator'

/**
 * Product editor — the single-page edit surface for an existing product
 * (creation stays on the 3-step wizard, exactly as UAT splits them).
 * Rebuilt from UAT `/commerce/:id/products/:id`; see docs/rebuild/products-list/.
 */
const store = useCommerceStore()
const extras = useProductExtrasStore()
const catalog = useCatalogCopilotStore()
// The Da Vinci CTA collapses to its mark on phones (so Cancel and Save stay on one
// row) and while the drawer it opens is already open.
const { xs, width: windowWidth } = useDisplay()
const copilot = useCopilotStore()
const ctaIconOnly = computed(() => xs.value || copilot.isOpen)
const route = useRoute()
const router = useRouter()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})
const listRoute = computed(() => ({ name: 'Products', params: { accountId: accountId.value } }))

const productId = computed(() => Number(route.params.productId))
const product = computed<Product | undefined>(() => store.products.find((p) => p.id === productId.value))

const MATERIALS = ['Cotton', 'Polyester', 'Leather', 'Wool', 'Metal', 'Plastic', 'Wood', 'Glass', 'Ceramic']
const COUNTRIES = ['United Kingdom', 'United States', 'China', 'India', 'Germany', 'Italy', 'France', 'Vietnam']
const CHANNELS = ['Online Store', 'POS', 'Amazon', 'eBay', 'Instagram Shop']
const taxCategoryOptions = computed(() => extras.taxCategories.map((c) => c.name))

// Stores that sell their own products join the sales channels. A product in one
// is priced in its currency, offered its collections, and links to its page there.
const productStores = useProductStores(accountId)
const channelOptions = computed(() => [...CHANNELS, ...productStores.stores.value.map((s) => s.name)])
const storefrontLink = computed(() => (product.value ? productStores.storefrontLink(product.value) : null))
const collectionOptions = computed(() => {
  const storeIds = productStores.channelIds(form.value.detail.salesChannels)
  const offered = storeIds.length
    ? extras.collections.filter((c) => c.salesChannels.some((id) => storeIds.includes(id)))
    : extras.collections
  // What the product is already in stays selectable, whatever the list offers.
  return [...new Set([...offered.map((c) => c.title), ...form.value.collections])]
})

// The subscription plans this product is sold on. Plans are edited on their own page.
const subscriptions = useSubscriptionsStore()
const purchasePlans = computed(() => {
  const p = product.value
  if (!p) return []
  return subscriptions.plansWithProduct(p.id).map((plan) => {
    const store = productStores.stores.value.find((s) => s.id === plan.channelId)?.webStore
    const unit = store?.currency ? parseDecimal(p.price, store.currency) : null
    return {
      plan,
      price: unit ? formatStorePrice(roundForDisplay(pricePerDelivery(unit, plan)), store?.locale) : null,
    }
  })
})
/** A plan in one line: its delivery options and what they take off, or its one delivery, discount and price. */
function planLine(plan: SubscriptionPlan, price: string | null): string {
  if (plan.options?.length) return [optionsSummary(plan.options), discountRange(plan) === '—' ? '' : `${discountRange(plan)} off`].filter(Boolean).join(' · ')
  return `${deliverySummary(plan)}${plan.discountPct ? ` · ${plan.discountPct}% off` : ''}${price ? ` · ${price} per delivery` : ''}`
}
const plansRoute = computed(() => ({ name: 'SubscriptionPlans', params: { accountId: accountId.value } }))
/** The card shows the product's plans, or offers them where its store sells subscriptions; a store that sells none (Northfold) shows no card. */
const demoStores = useDemoStores()
const showPurchaseOptions = computed(() => {
  if (purchasePlans.value.length) return true
  const storeId = productStores.stores.value.find((s) => product.value?.channelIds?.includes(s.id))?.id
  return !!storefrontLink.value && demoStores.blueprintOf(storeId ?? '')?.capabilities.subscriptions !== false
})

/** A variant's price in its store's currency ("419 kr"); dollars for the shared catalogue. */
function money(price: string): string {
  const store = productStores.stores.value.find((s) => form.value.detail.salesChannels.includes(s.name))?.webStore
  const amount = store?.currency ? parseDecimal(price || '0', store.currency) : null
  return amount ? formatStorePrice(amount, store?.locale) : `$${(parseFloat(price) || 0).toFixed(2)}`
}
const brandOptions = computed(() => Array.from(new Set(store.products.map((p) => p.vendor))).sort())
// Includes what this product is filed under, so a new category (one Da Vinci added) stays selectable.
const categoryOptions = computed(() =>
  Array.from(new Set([...store.products.map((p) => p.category), ...(form.value.detail.categories ?? [])])).sort())

const emptyDetail = (): ProductDetail => ({
  subtitle: '', url: '', description: '', hasVariants: false, options: [], variantsList: [],
  taxCategory: '', material: '', brand: '', tag: '', collection: '', categories: [],
  width: '', length: '', height: '', weight: '', midCode: '', hsCode: '', countryOfOrigin: '',
  discountable: true, salesChannels: [],
})

const form = ref({
  name: '',
  sku: '',
  price: '',
  publishStatus: 'Published' as PublishStatus,
  /** Every collection the product is in; the first one leads. */
  collections: [] as string[],
  /** The product's pictures, the first one leading. */
  images: [] as string[],
  detail: emptyDetail(),
  seo: { title: '', metaDescription: '', urlHandle: '', ogTitle: '', ogDescription: '' },
})
const snapshot = ref('')

function load() {
  const p = product.value
  if (!p) {
    router.replace(listRoute.value)
    return
  }
  const detail = p.detail ? JSON.parse(JSON.stringify(p.detail)) as ProductDetail : emptyDetail()
  form.value = {
    name: p.name,
    sku: p.sku,
    price: p.price,
    publishStatus: p.publishStatus,
    collections: [...p.collections],
    images: (p.imageUrls ?? []).filter((url) => !isPlaceholderImage(url)),
    detail,
    seo: detail.seo ?? {
      title: '', metaDescription: '',
      urlHandle: extras.toHandle(p.name),
      ogTitle: '', ogDescription: '',
    },
  }
  snapshot.value = JSON.stringify(form.value)
}
load()
watch(productId, load)

/**
 * The variants shown in the grid: the ones the wizard built. A product saved
 * before it had any shows one default row with its own SKU, price and stock; one
 * that has options but no variants yet shows none (the grid's empty state).
 */
const variantRows = computed<ProductVariant[]>(() => {
  const detail = form.value.detail
  if (detail.variantsList.length) return detail.variantsList
  if (detail.hasVariants) return []
  return [{
    id: 0,
    title: 'Default variant',
    sku: form.value.sku,
    manageInventory: true,
    allowBackorder: false,
    costPrice: '',
    price: form.value.price,
    stock: { ...Object.fromEntries(INVENTORY_LOCATIONS.map((l) => [l, 0])), [INVENTORY_LOCATIONS[0]!]: product.value?.inventory ?? 0 },
  }]
})

// ── Size guide ────────────────────────────────────────────────────────
// Offered when the product's store has size charts and the product has sizes
// (or already links a chart). The choice is saved with the page's Save.
const sizeCharts = useSizeChartsStore()
const storeCharts = computed(() =>
  productStores.channelIds(form.value.detail.salesChannels).flatMap((id) => sizeCharts.chartsForChannel(id)))
const productSizes = computed(() => form.value.detail.options.find((o) => optionKind(o) === 'size')?.values ?? [])
const showSizeGuide = computed(() => storeCharts.value.length > 0 && (productSizes.value.length > 0 || !!form.value.detail.sizeChartId))
/** The Size charts page, opened on the product's store. */
const sizeChartsRoute = computed(() => {
  if (!router.hasRoute('SizeCharts')) return null
  const store = storeCharts.value[0]?.channelId
  return { name: 'SizeCharts', params: { accountId: accountId.value }, ...(store ? { query: { store } } : {}) }
})

function setSizeChart(chartId: string | undefined) {
  if (chartId) form.value.detail.sizeChartId = chartId
  else delete form.value.detail.sizeChartId
}

// ── Vehicle fitment and specifications ────────────────────────────────
// Fitment is offered on a part (it carries fitment) and on any product of a store that
// sells parts. Specifications and a warranty are offered there too, and on any product
// that has them or whose store's products carry them (a furniture store's measurements).
// Both are saved with the page's Save; the storefront reads them from there.
const storeProducts = computed(() => {
  const storeIds = productStores.channelIds(form.value.detail.salesChannels)
  return storeIds.length ? store.products.filter((p) => p.channelIds?.some((id) => storeIds.includes(id))) : []
})
const isPart = computed(() => !!form.value.detail.fitment || sellsParts(storeProducts.value))
const carriesSpecs = (detail?: ProductDetail) => !!detail?.specs?.length || !!detail?.warranty
const showSpecs = computed(() =>
  isPart.value || carriesSpecs(product.value?.detail) || storeProducts.value.some((p) => carriesSpecs(p.detail)))
/** Rows a furniture or home product carries: a warranty, or rows named as such a product's usually are. */
const homeRows = (detail?: ProductDetail) => !!detail?.warranty || !!detail?.specs?.some((spec) => homeSpecName(spec.label))
/**
 * A table of facts (a supplement's serving size and ingredients): rows on this product or
 * on its store's products that are neither a part's nor a furniture piece's. It gets the
 * same card in its own words, without suggested names or a warranty.
 */
const hasFacts = computed(() => {
  if (isPart.value) return false
  const carried = [form.value.detail, ...storeProducts.value.map((p) => p.detail)]
  return carried.some((detail) => !!detail?.specs?.length) && !carried.some((detail) => homeRows(detail))
})
/** Front and rear, when the part is sold by position. */
const fitmentPositions = computed(() => positionsFor(form.value.detail.options))

function setFitment(fitment: Fitment) {
  form.value.detail.fitment = fitment
}

const specs = computed(() => form.value.detail.specs ?? [])

/**
 * The names a furniture or home product's rows usually take, each with an example
 * value. The store's chat answers from rows with these names, so the card offers them.
 */
const HOME_SPECS: Readonly<Record<string, string>> = {
  'Width': '84 in',
  'Depth': '38 in',
  'Height': '34 in',
  'Seat height': '18 in',
  'Weight': '95 lb',
  'Materials': 'Solid oak, wool blend',
  'Care': 'Spot clean with a damp cloth',
  'Assembly': 'Arrives assembled',
}
const homeSpecName = (label: string) => Object.keys(HOME_SPECS).find((name) => name.toLowerCase() === label.trim().toLowerCase())

/** The card's words: a part's facts hold for every vehicle; a supplement's are what is in it; anything else's are its measurements, materials and care. */
const specCopy = computed(() => {
  if (isPart.value) {
    return {
      title: 'Specifications',
      description: 'Facts that hold for every vehicle. Shoppers see them in a table on the product page.',
      icon: 'list',
      emptyTitle: 'No specifications yet',
      empty: 'Add the facts shoppers compare, like the friction material or what is in the box.',
      add: 'Add specification',
      one: 'specification',
      name: 'Friction material',
      warranty: 'Limited lifetime warranty',
    }
  }
  if (hasFacts.value) {
    return {
      title: 'Product facts',
      description: 'What is in it and how to take it. Shoppers see these in a table on the product page.',
      icon: 'list',
      emptyTitle: 'No product facts yet',
      empty: 'Add what shoppers look for, like the serving size and each ingredient with its amount.',
      add: 'Add fact',
      one: 'fact',
      name: 'Serving size',
      warranty: '',
    }
  }
  return {
    title: 'Specifications',
    description: 'Measurements, materials and care shoppers compare, shown in a table on the product page.',
    icon: 'ruler',
    emptyTitle: 'No specifications yet',
    empty: 'Start with one shoppers often ask about, or add your own.',
    add: 'Add specification',
    one: 'specification',
    name: 'Width',
    warranty: '5-year frame warranty',
  }
})

/**
 * A row's example value. On a part, the first row has one. Otherwise a row with a usual
 * name has that name's, and the first row, still unnamed, has the one for its name example.
 */
function specValueExample(index: number, label: string): string | undefined {
  if (isPart.value) return index ? undefined : 'Ceramic'
  if (hasFacts.value) return index ? undefined : '2 capsules'
  const name = homeSpecName(label) ?? (!label.trim() && !index ? specCopy.value.name : undefined)
  return name ? HOME_SPECS[name] : undefined
}

/** The usual names not used yet, offered as one-click rows; a part and a table of facts get none. */
const specSuggestions = computed(() => {
  if (isPart.value || hasFacts.value) return []
  const used = new Set(specs.value.map((spec) => homeSpecName(spec.label)))
  return Object.keys(HOME_SPECS).filter((name) => !used.has(name))
})

/** Save was pressed with a half-filled row: from then on the rows show what they miss. */
const specsTried = ref(false)
const specIssues = computed(() => (specsTried.value ? specErrors(specs.value) : []))
const specFieldId = (index: number, field: 'label' | 'value') => `ped-spec-${index}-${field}`
/** Side by side, the first row's labels head the columns; stacked (MpFormGrid's compact breakpoint), every row carries its own. */
const specsStacked = computed(() => windowWidth.value <= parseFloat(mp_layout_breakpointCompact))
const specLabel = (index: number, text: string) => (index === 0 || specsStacked.value ? text : undefined)

/** Adds a row, named when it is a suggested one: its value is next, else its name. */
function addSpec(label = '') {
  form.value.detail.specs = [...specs.value, { label, value: '' }]
  const index = specs.value.length - 1
  nextTick(() => document.getElementById(specFieldId(index, label ? 'value' : 'label'))?.focus())
}

function removeSpec(index: number) {
  const next = specs.value.filter((_, i) => i !== index)
  if (next.length) form.value.detail.specs = next
  else delete form.value.detail.specs
}

/** The warranty line; cleared, the product has none (no empty string saved beside it). */
const warranty = computed({
  get: () => form.value.detail.warranty ?? '',
  set: (value: string) => {
    if (value) form.value.detail.warranty = value
    else delete form.value.detail.warranty
  },
})

/** The first half-filled specification row's empty field, or null when every row is whole or empty. */
function firstSpecProblem(): string | null {
  const issues = specErrors(specs.value)
  const index = issues.findIndex((issue) => issue.label || issue.value)
  if (index < 0) return null
  return specFieldId(index, issues[index]!.label ? 'label' : 'value')
}

const dirty = computed(() => JSON.stringify(form.value) !== snapshot.value)
const valid = computed(() => form.value.name.trim().length > 0)

const saving = ref(false)
const cancelGuard = ref(false)

function requestCancel() {
  if (dirty.value) cancelGuard.value = true
  else router.push(listRoute.value)
}

async function save() {
  const p = product.value
  if (!p || !valid.value) return
  const specProblem = firstSpecProblem()
  if (specProblem) {
    specsTried.value = true
    await nextTick()
    document.getElementById(specProblem)?.focus()
    return
  }
  const wasPublished = p.publishStatus === 'Published'
  saving.value = true
  await new Promise((resolve) => setTimeout(resolve, 450))
  store.updateProductDraft(p.id, {
    name: form.value.name.trim(),
    sku: form.value.sku,
    category: p.category,
    vendor: form.value.detail.brand || p.vendor,
    price: form.value.price,
    inventory: p.inventory,
    variants: Math.max(1, form.value.detail.variantsList.length),
    type: p.type,
    publishStatus: form.value.publishStatus,
    detail: partFacts({ ...form.value.detail, collection: form.value.collections[0] ?? '', seo: { ...form.value.seo } }),
    components: p.components,
    collections: [...form.value.collections],
    channelIds: productStores.channelIds(form.value.detail.salesChannels),
    // A store shows this price crossed out, so it stays as it was (variant prices are edited in the wizard).
    ...(productStores.channelIds(form.value.detail.salesChannels).length ? { compareAtPrice: p.compareAtPrice } : {}),
    // A store product never goes out without a picture: it gets a drawn pack until one is added.
    imageUrls: form.value.images.length
      ? [...form.value.images]
      : productStores.placeholdersFor(form.value.detail.salesChannels, form.value.name.trim()),
  })
  saving.value = false
  snapshot.value = JSON.stringify(form.value)
  trackSave(p.id, wasPublished)
  router.push({ ...listRoute.value, query: { flash: 'product-updated', product: String(p.id) } })
}

/** The specifications and warranty as they are saved: trimmed, and dropped when empty. */
function partFacts(detail: ProductDetail): ProductDetail {
  const next = { ...detail }
  const cleaned = cleanSpecs(next.specs ?? [])
  if (cleaned.length) next.specs = cleaned
  else delete next.specs
  const line = next.warranty?.trim()
  if (line) next.warranty = line
  else delete next.warranty
  return next
}

// ── Da Vinci Catalog Co-Pilot ─────────────────────────────────────────
// Suggestions patch the fields the merchant picked, in memory. Save persists them.
// Da Vinci never touches status, options, prices or inventory on this page.

const daVinciApplied = ref<{ at: number } | null>(null)
const daVinciNotice = ref(false)

function buildSnapshot(): ProductSnapshot {
  const f = form.value
  return {
    name: f.name.trim(),
    subtitle: f.detail.subtitle ?? '',
    sku: f.sku ?? '',
    description: f.detail.description ?? '',
    brand: f.detail.brand ?? '',
    tag: f.detail.tag ?? '',
    categories: [...(f.detail.categories ?? [])],
    collection: f.collections[0] ?? '',
    options: f.detail.options.map((o) => ({ name: o.name, values: [...o.values] })),
    seo: { title: f.seo.title, metaDescription: f.seo.metaDescription, urlHandle: f.seo.urlHandle },
  }
}

function editWithDaVinci() {
  catalog.ctaClicked('edit', 'enrich', productId.value)
  catalog.openEnrich({ productId: productId.value, productName: form.value.name.trim(), snapshot: buildSnapshot() })
}

function generateField(field: CatalogField) {
  catalog.ctaClicked('field', field, productId.value)
  catalog.openField({ field, snapshot: buildSnapshot(), productId: productId.value, productName: form.value.name.trim() })
}

function applyDaVinci(payload: CatalogApplyPayload) {
  const f = payload.fields
  const target = form.value
  if (f.title !== undefined) target.name = f.title
  if (f.subtitle !== undefined) target.detail.subtitle = f.subtitle
  if (f.sku !== undefined) target.sku = f.sku
  if (f.handle !== undefined) target.seo.urlHandle = f.handle
  if (f.description !== undefined) target.detail.description = f.description
  if (f.brand !== undefined) target.detail.brand = f.brand
  if (f.tag !== undefined) target.detail.tag = f.tag
  if (f.categories !== undefined) target.detail.categories = [...f.categories]
  if (f.collection !== undefined) target.collections = withPrimaryCollection(target.collections, f.collection)
  if (f.seoTitle !== undefined) target.seo.title = f.seoTitle
  if (f.seoMetaDescription !== undefined) target.seo.metaDescription = f.seoMetaDescription
  daVinciApplied.value = { at: payload.appliedAt }
  daVinciNotice.value = true
  catalog.confirmApplied(payload)
}

function takeDaVinciApply() {
  const payload = catalog.takePendingApply()
  if (payload) applyDaVinci(payload)
}

onMounted(() => {
  // load() already ran in setup, so an applied draft lands after the saved snapshot.
  takeDaVinciApply()
  if (catalog.ctaVisible) {
    catalog.ctaViewed('edit')
    catalog.ctaViewed('field')
  }
})
// Post flush: after load() re-runs for a different product.
watch([() => catalog.pendingApply, () => route.fullPath], takeDaVinciApply, { flush: 'post' })

function trackSave(id: number, wasPublished: boolean) {
  const applied = daVinciApplied.value
  if (applied) catalog.track('MCC - Da Vinci Catalog - Product Saved After Apply', { product_id: id })
  if (form.value.publishStatus === 'Published' && !wasPublished) {
    catalog.track('Product Published', {
      product_id: id,
      published_via: applied ? 'davinci_assisted' : 'manual',
      time_since_apply_ms: applied ? Date.now() - applied.at : null,
    })
  }
  daVinciApplied.value = null
}

function openVariantsWizard() {
  router.push({ name: 'ProductEditWizard', params: { accountId: accountId.value, productId: productId.value } })
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Commerce · Products"
      :title="form.name || 'Product details'"
      :back-to="listRoute"
    >
      <template #actions>
        <DvCatalogCta
          v-if="catalog.ctaVisible"
          label="Edit with Da Vinci"
          :icon-only="ctaIconOnly"
          :disabled="!catalog.canInvoke"
          disabled-reason="You need permission to edit products to use Da Vinci."
          @click="editWithDaVinci"
        />
        <v-btn
          v-if="storefrontLink"
          variant="text"
          class="text-none"
          prepend-icon="external-link"
          :href="storefrontLink.href"
          target="_blank"
          rel="noopener"
        >
          View in store
        </v-btn>
        <v-btn variant="text" class="text-none" :disabled="saving" @click="requestCancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :loading="saving" :disabled="!valid || !dirty" @click="save">
          Save
        </v-btn>
      </template>
    </MpPageHeader>

    <v-row class="flex-grow-1" no-gutters>
      <!-- ── Main column ─────────────────────────────────────────── -->
      <v-col cols="12" md="8" class="pr-md-4 d-flex flex-column ga-4">
        <MpAlert
          v-if="daVinciNotice"
          tone="info"
          icon="sparkles"
          title="Da Vinci suggestions applied"
          dismissible
          @dismiss="daVinciNotice = false"
        >
          Review the changes, then click Save to keep them. The product’s status stays as you set it.
        </MpAlert>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection :heading-level="2" title="General information" description="To start selling, all you need is a name and a price." required />
          <MpFormGrid :cols="2">
            <v-text-field
              v-model="form.name"
              label="Title *"
              :error-messages="form.name.trim() ? [] : ['Title is required']"
            />
            <v-text-field v-model="form.sku" label="SKU" />
            <v-text-field v-model="form.detail.subtitle" label="Subtitle" />
            <v-text-field v-model="form.detail.url" label="Product URL" placeholder="https://…" />
            <!-- The field action sits in the label row, not on a row of its own. -->
            <div class="mp-form-grid__full ped-field-action">
              <v-textarea v-model="form.detail.description" label="Description" rows="5" />
              <DvCatalogCta
                v-if="catalog.ctaVisible"
                label="Generate with Da Vinci"
                variant="link"
                class="ped-field-action__cta"
                :disabled="!catalog.canInvoke"
                @click="generateField('description')"
              />
            </div>
          </MpFormGrid>
          <v-switch
            v-model="form.detail.discountable"
            hide-details
            density="compact"
            label="Discountable — when off, discounts are never applied to this product"
          />
        </v-card>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection :heading-level="2" title="Media" description="The pictures shoppers see on the product page and in lists." />
          <ProductMediaField v-model="form.images" />
        </v-card>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection :heading-level="2" title="Variants" description="Offer your customers different options for colour, size or finish." />
          <template v-if="form.detail.options.length">
            <MpFormField v-for="(option, index) in form.detail.options" :key="index" :label="option.name || `Option ${index + 1}`">
              <template #default="{ labelId }">
                <div class="d-flex flex-wrap ga-1" :aria-labelledby="labelId">
                  <v-chip v-for="value in option.values" :key="value" size="small" variant="tonal" label>
                    <template v-if="option.display !== 'buttons' && option.swatches?.[value]" #prepend>
                      <span class="ped-dot" :style="{ '--ped-dot': option.swatches[value] }" aria-hidden="true" />
                    </template>
                    {{ value }}
                  </v-chip>
                </div>
              </template>
            </MpFormField>
          </template>
          <p v-else-if="variantRows.length" class="text-body-2 text-medium-emphasis mb-0">
            This product has a single default variant.
          </p>

          <VariantGrid
            :options="form.detail.options"
            :variants="variantRows"
            :format-price="money"
            :caption="`Variants of ${form.name || 'this product'}`"
            empty-action-label="Add options and variants"
            @empty-action="openVariantsWizard"
          />
          <v-btn v-if="variantRows.length" variant="outlined" prepend-icon="pencil" class="text-none align-self-start" @click="openVariantsWizard">
            Edit options and variants
          </v-btn>
        </v-card>

        <VehicleFitmentCard
          v-if="isPart"
          :model-value="form.detail.fitment"
          :product-name="form.name"
          :positions="fitmentPositions"
          @update:model-value="setFitment"
        />

        <v-card v-if="showSpecs" variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection :heading-level="2" :title="specCopy.title" :description="specCopy.description" />
          <!-- A small two-column list: the first row's labels head the columns (every row has them
               once the columns stack), and every field is named by its own aria-label, as
               table-cell editors are (aria-labelledby is cleared: Vuetify points it at a label
               a later row may not have). -->
          <MpFormGrid v-if="specs.length">
            <div v-for="(spec, index) in specs" :key="index" class="mp-form-grid__trailing">
              <MpFormGrid :cols="2">
                <v-text-field
                  :id="specFieldId(index, 'label')"
                  v-model="spec.label"
                  :label="specLabel(index, 'Name')"
                  :aria-label="`Name, ${specCopy.one} ${index + 1}`"
                  :aria-labelledby="undefined"
                  :placeholder="index ? undefined : specCopy.name"
                  :error-messages="specIssues[index]?.label || undefined"
                />
                <v-text-field
                  :id="specFieldId(index, 'value')"
                  v-model="spec.value"
                  :label="specLabel(index, 'Value')"
                  :aria-label="`Value, ${spec.label.trim() || `${specCopy.one} ${index + 1}`}`"
                  :aria-labelledby="undefined"
                  :placeholder="specValueExample(index, spec.label)"
                  :error-messages="specIssues[index]?.value || undefined"
                />
              </MpFormGrid>
              <v-btn
                icon="trash-2"
                variant="text"
                size="small"
                density="comfortable"
                :aria-label="`Remove ${spec.label.trim() || `${specCopy.one} ${index + 1}`}`"
                @click="removeSpec(index)"
              />
            </div>
          </MpFormGrid>
          <MpEmptyState
            v-else
            :variant="specSuggestions.length ? 'launcher' : 'stack'"
            :icon="specCopy.icon"
            :heading-level="3"
            :title="specCopy.emptyTitle"
            :description="specCopy.empty"
            :action-label="specCopy.add"
            action-icon="plus"
            @action="addSpec()"
          >
            <div role="group" aria-label="Suggested specifications" class="d-flex flex-wrap justify-center ga-2">
              <v-chip
                v-for="name in specSuggestions"
                :key="name"
                tag="button"
                type="button"
                size="small"
                variant="outlined"
                prepend-icon="plus"
                class="text-none"
                :aria-label="`Add ${name}`"
                @click="addSpec(name)"
              >
                {{ name }}
              </v-chip>
            </div>
          </MpEmptyState>
          <div v-if="specs.length" class="d-flex flex-wrap align-center ga-3">
            <v-btn variant="outlined" prepend-icon="plus" class="text-none" @click="addSpec()">
              {{ specCopy.add }}
            </v-btn>
            <div v-if="specSuggestions.length" role="group" aria-label="Suggested specifications" class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="name in specSuggestions"
                :key="name"
                tag="button"
                type="button"
                size="small"
                variant="outlined"
                prepend-icon="plus"
                class="text-none"
                :aria-label="`Add ${name}`"
                @click="addSpec(name)"
              >
                {{ name }}
              </v-chip>
            </div>
          </div>
          <v-text-field v-if="!hasFacts" v-model="warranty" label="Warranty" :placeholder="specCopy.warranty" />
        </v-card>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <div class="d-flex align-start ga-3">
            <MpFormSection
              :heading-level="2"
              class="flex-grow-1"
              title="Search engine listing"
              description="How this product appears in search results and shared links."
            />
            <DvCatalogCta
              v-if="catalog.ctaVisible"
              label="Generate with Da Vinci"
              variant="link"
              :disabled="!catalog.canInvoke"
              @click="generateField('seo')"
            />
          </div>
          <div class="ped-seo">
            <div class="text-caption text-medium-emphasis">Storefront URL preview</div>
            <div class="ped-seo__url">/products/{{ form.seo.urlHandle || 'product-handle' }}</div>
            <div class="ped-seo__title">{{ form.seo.title || form.name || 'Product title' }}</div>
            <div class="ped-seo__desc">{{ form.seo.metaDescription || 'Add a meta description to control this snippet.' }}</div>
          </div>
          <MpFormGrid :cols="2">
            <v-text-field v-model="form.seo.title" label="SEO title" class="mp-form-grid__full" />
            <v-textarea v-model="form.seo.metaDescription" label="Meta description" rows="3" class="mp-form-grid__full" />
            <v-text-field v-model="form.seo.urlHandle" label="URL handle" prefix="/" class="mp-form-grid__full" />
            <v-text-field v-model="form.seo.ogTitle" label="Social (OG) title" />
            <v-text-field v-model="form.seo.ogDescription" label="Social (OG) description" />
          </MpFormGrid>
        </v-card>
      </v-col>

      <!-- ── Side rail ───────────────────────────────────────────── -->
      <v-col cols="12" md="4" class="mt-4 mt-md-0 d-flex flex-column ga-4">
        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection :heading-level="2" title="Product status" />
          <v-select v-model="form.publishStatus" :items="['Draft', 'Published']" label="Status" />
        </v-card>

        <ProductSizeGuideCard
          v-if="showSizeGuide"
          :model-value="form.detail.sizeChartId"
          :charts="storeCharts"
          :sizes="productSizes"
          :manage-to="sizeChartsRoute"
          @update:model-value="setSizeChart"
        />

        <v-card v-if="showPurchaseOptions" variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection
            :heading-level="2"
            title="Purchase options"
            description="Shoppers can buy this product once, or subscribe on a plan."
          />
          <div v-if="purchasePlans.length">
            <MpListRow
              v-for="{ plan, price } in purchasePlans"
              :key="plan.id"
              variant="divided"
              :title="plan.name"
              :subtitle="planLine(plan, price)"
            >
              <template #trailing>
                <MpStatusChip :status="plan.status" type="general" size="sm" />
              </template>
            </MpListRow>
          </div>
          <p v-else class="text-body-2 text-medium-emphasis mb-0">This product is not on a subscription plan.</p>
          <RouterLink :to="plansRoute" class="mp-link text-body-2 align-self-start">Manage plans</RouterLink>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection :heading-level="2" title="Sales channels" description="Without a channel, the product falls back to the default sales channel." />
          <v-select
            v-model="form.detail.salesChannels"
            :items="channelOptions"
            label="Channels"
            multiple
            chips
            closable-chips
          />
        </v-card>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection :heading-level="2" title="Attributes" description="Missing weight may affect the shipping rate at checkout." />
          <MpFormGrid :cols="2">
            <v-text-field v-model="form.detail.width" label="Width" suffix="cm" type="number" />
            <v-text-field v-model="form.detail.length" label="Length" suffix="cm" type="number" />
            <v-text-field v-model="form.detail.height" label="Height" suffix="cm" type="number" />
            <v-text-field v-model="form.detail.weight" label="Weight" suffix="kg" type="number" />
            <v-text-field v-model="form.detail.midCode" label="MID code" />
            <v-text-field v-model="form.detail.hsCode" label="HS code" />
            <v-select v-model="form.detail.countryOfOrigin" :items="COUNTRIES" label="Country of origin" clearable class="mp-form-grid__full" />
          </MpFormGrid>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection :heading-level="2" title="Organise" />
          <MpFormGrid>
            <v-select v-model="form.detail.taxCategory" :items="taxCategoryOptions" label="Tax category" clearable />
            <v-select v-model="form.detail.material" :items="MATERIALS" label="Material" clearable />
            <v-combobox v-model="form.detail.brand" :items="brandOptions" label="Brand" clearable />
            <v-combobox v-model="form.detail.tag" :items="['Featured', 'New', 'Sale', 'Seasonal', 'Clearance']" label="Tags" clearable />
            <v-select v-model="form.collections" :items="collectionOptions" label="Collections" multiple chips closable-chips />
            <div class="ped-field-action">
              <v-select v-model="form.detail.categories" :items="categoryOptions" label="Categories" multiple chips closable-chips />
              <DvCatalogCta
                v-if="catalog.ctaVisible"
                label="Suggest with Da Vinci"
                variant="link"
                class="ped-field-action__cta"
                :disabled="!catalog.canInvoke"
                @click="generateField('categories')"
              />
            </div>
          </MpFormGrid>
        </v-card>
      </v-col>
    </v-row>

    <MpConfirmDialog
      v-model="cancelGuard"
      title="Discard your changes?"
      message="This product has unsaved edits. Leaving now discards them."
      confirm-label="Discard changes"
      danger
      @confirm="router.push(listRoute)"
    />
  </div>
</template>

<style scoped>
.ped-field-action {
  position: relative;
  /* The label-row CTA collapses to its mark by this field's width. */
  container-type: inline-size;
}

.ped-field-action__cta {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
}

.ped-card {
  padding: var(--mp-component-card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.ped-dot {
  width: var(--mp-space-10);
  height: var(--mp-space-10);
  margin-inline-end: var(--mp-space-6);
  border-radius: var(--mp-radius-full);
  background: var(--ped-dot);
  box-shadow: inset 0 0 0 1px var(--border-strong);
}

.ped-seo {
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  padding: var(--mp-space-16);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}

.ped-seo__url {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-on-surface-variant));
  overflow-wrap: anywhere;
}

.ped-seo__title {
  font-size: var(--mp-fontSize-16);
  color: rgb(var(--v-theme-primary));
}

.ped-seo__desc {
  font-size: var(--mp-fontSize-13);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
