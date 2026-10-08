<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useCommerceStore,
  type ProductOption,
  type ProductVariant,
  type ProductDetail,
  type ProductDraftInput,
  type PublishStatus,
} from '@/stores/useCommerce'
import { useProductExtrasStore } from '@/stores/useProductExtras'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpAlert from '@/components/MpAlert.vue'
import DvCatalogCta from '@/components/copilot/DvCatalogCta.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useWizardSteps } from '@/composables/useWizardSteps'
import { useCatalogCopilotStore, type CatalogApplyPayload } from '@/stores/useCatalogCopilot'
import type { ProductSnapshot } from '@/composables/useCatalogGenerator'

const route = useRoute()
const router = useRouter()
const store = useCommerceStore()
const extras = useProductExtrasStore()
const catalog = useCatalogCopilotStore()

const LOCATIONS = ['testing', 'Oxford warehouse']

// ── Option sources (mock / store-backed) ───────────────────────────────
const CATEGORIES = ['Electronics', 'Apparel', 'Home & Kitchen', 'Sports & Outdoors', 'Beauty & Health', 'Tools & Garden']
const MATERIALS = ['Cotton', 'Polyester', 'Leather', 'Wool', 'Metal', 'Plastic', 'Wood', 'Glass', 'Ceramic']
const BRANDS = ['Acme Corp', 'Brand House', 'Global Goods', 'Prime Supplier', 'Local Artisan']
const TAGS = ['Featured', 'New', 'Sale', 'Seasonal', 'Clearance']
const COUNTRIES = ['United Kingdom', 'United States', 'China', 'India', 'Germany', 'Italy', 'France', 'Vietnam']
const SALES_CHANNELS = ['Online Store', 'POS', 'Amazon', 'eBay', 'Instagram Shop']
const taxCategoryOptions = computed(() => extras.taxCategories.map(c => c.name))
const collectionOptions = computed(() => extras.collections.map(c => c.title))

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const productsRoute = computed(() => ({ name: 'Products', params: { accountId: accountId.value } }))

const editingId = computed(() => {
  const raw = route.params.productId
  const value = Array.isArray(raw) ? raw[0] : raw
  return value ? Number(value) : null
})
const isEdit = computed(() => editingId.value !== null)

const steps = ['Details', 'Organise', 'Variants']
const { step, maxStep, goTo: goStep, next, prev: prevStep, unlockAll } = useWizardSteps(steps.length, {
  canAdvance: (from) => from !== 1 || titleValid.value,
})
const confirmCancel = ref(false)

// ── Step 1 — Details ────────────────────────────────────────────────────
const title = ref('')
const sku = ref('')
const subtitle = ref('')
const url = ref('')
const description = ref('')
const hasVariants = ref(false)

// ── Step 1 — Search engine listing ──────────────────────────────────────
const seoTitle = ref('')
const seoMetaDescription = ref('')
const seoUrlHandle = ref('')
// Social fields are edited on the product editor; kept here so this wizard never drops them.
const seoSocial = ref({ ogTitle: '', ogDescription: '' })
// Search engines truncate past these lengths; the counter turns red only through these rules.
const seoTitleRule = (v: string | null) => (v ?? '').length <= 60 || 'Search results show about 60 characters'
const seoMetaRule = (v: string | null) => (v ?? '').length <= 155 || 'Search results show about 155 characters'

// ── Step 2 — Organise ───────────────────────────────────────────────────
const taxCategory = ref('')
const material = ref('')
const brand = ref('')
const tag = ref('')
const collection = ref('')
const categories = ref<string[]>([])
const width = ref('')
const length = ref('')
const height = ref('')
const weight = ref('')
const midCode = ref('')
const hsCode = ref('')
const countryOfOrigin = ref('')
const discountable = ref(true)
const salesChannels = ref<string[]>(['Online Store'])

// ── Step 3 — Variants ───────────────────────────────────────────────────
let variantSeq = 0
function emptyStock(): Record<string, number> {
  return Object.fromEntries(LOCATIONS.map(l => [l, 0]))
}
function makeVariant(vtitle: string, seed?: Partial<ProductVariant>): ProductVariant {
  return {
    id: ++variantSeq,
    title: vtitle,
    sku: seed?.sku ?? '',
    manageInventory: seed?.manageInventory ?? true,
    allowBackorder: seed?.allowBackorder ?? false,
    costPrice: seed?.costPrice ?? '',
    price: seed?.price ?? '',
    stock: seed?.stock ? { ...emptyStock(), ...seed.stock } : emptyStock(),
  }
}

const options = ref<ProductOption[]>([{ name: '', values: [] }])
const generatedVariants = ref<ProductVariant[]>([])
const defaultVariant = ref<ProductVariant>(makeVariant('Default variant'))

function addOption() {
  options.value.push({ name: '', values: [] })
}
function removeOption(index: number) {
  options.value.splice(index, 1)
  regenerateVariants()
}

function regenerateVariants() {
  const valid = options.value.filter(o => o.name.trim() && o.values.length)
  if (!valid.length) {
    generatedVariants.value = []
    return
  }
  let combos: string[][] = [[]]
  for (const opt of valid) {
    combos = combos.flatMap(c => opt.values.map(v => [...c, v]))
  }
  const prev = new Map(generatedVariants.value.map(v => [v.title, v]))
  generatedVariants.value = combos.map(combo => {
    const vtitle = combo.join(' / ')
    return prev.get(vtitle) ?? makeVariant(vtitle)
  })
}

watch(options, regenerateVariants, { deep: true })

const activeVariants = computed<ProductVariant[]>(() =>
  hasVariants.value ? generatedVariants.value : [defaultVariant.value],
)

// ── Validation / navigation ─────────────────────────────────────────────
const titleValid = computed(() => title.value.trim().length > 0)
const submitted = ref(false)

const stepHint = computed(() => (!titleValid.value ? 'Add a product title to continue' : undefined))

function nextStep() {
  submitted.value = true
  if (step.value === 1 && !titleValid.value) return
  submitted.value = false
  next()
}

// ── Persistence ─────────────────────────────────────────────────────────
function buildSeo(): ProductDetail['seo'] {
  const seo = {
    title: seoTitle.value.trim(),
    metaDescription: seoMetaDescription.value.trim(),
    urlHandle: seoUrlHandle.value.trim(),
    ...seoSocial.value,
  }
  return Object.values(seo).some(Boolean) ? seo : undefined
}

function buildDetail(): ProductDetail {
  return {
    subtitle: subtitle.value.trim(),
    url: url.value.trim(),
    description: description.value.trim(),
    hasVariants: hasVariants.value,
    options: hasVariants.value ? options.value.filter(o => o.name.trim()).map(o => ({ name: o.name.trim(), values: [...o.values] })) : [],
    variantsList: activeVariants.value.map(v => ({ ...v, stock: { ...v.stock } })),
    taxCategory: taxCategory.value,
    material: material.value,
    brand: brand.value,
    tag: tag.value,
    collection: collection.value,
    categories: [...categories.value],
    width: width.value,
    length: length.value,
    height: height.value,
    weight: weight.value,
    midCode: midCode.value,
    hsCode: hsCode.value,
    countryOfOrigin: countryOfOrigin.value,
    discountable: discountable.value,
    salesChannels: [...salesChannels.value],
    seo: buildSeo(),
  }
}

function totalInventory(): number {
  return activeVariants.value.reduce(
    (sum, v) => sum + LOCATIONS.reduce((s, l) => s + (Number(v.stock[l]) || 0), 0),
    0,
  )
}

function representativePrice(): string {
  const first = activeVariants.value[0]
  return Number(first?.price || 0).toFixed(2)
}

function formSnapshot() {
  return JSON.stringify({
    title: title.value,
    sku: sku.value,
    detail: buildDetail(),
  })
}
const savedSnapshot = ref('')
const isDirty = computed(() => !!savedSnapshot.value && formSnapshot() !== savedSnapshot.value)
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave product wizard?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

function save(publishStatus: PublishStatus) {
  submitted.value = true
  if (!titleValid.value) {
    step.value = 1
    return
  }
  const detail = buildDetail()
  const input: ProductDraftInput = {
    name: title.value.trim(),
    sku: sku.value.trim(),
    category: categories.value[0] ?? 'Uncategorised',
    vendor: brand.value || '—',
    price: representativePrice(),
    inventory: totalInventory(),
    variants: activeVariants.value.length,
    type: 'product',
    publishStatus,
    detail,
  }
  allowNextLeave()
  if (isEdit.value && editingId.value !== null) {
    store.updateProductDraft(editingId.value, input)
    trackSave(publishStatus, editingId.value)
    router.push({ ...productsRoute.value, query: { flash: 'product-updated' } })
  } else {
    const created = store.createProduct(input)
    trackSave(publishStatus, created.id)
    router.push({ ...productsRoute.value, query: { flash: publishStatus === 'Draft' ? 'product-draft' : 'product-published' } })
  }
}

// ── Da Vinci Catalog Co-Pilot ───────────────────────────────────────────
// Apply hydrates this form's in-memory state only. Nothing is saved until the
// merchant clicks Save as Draft or Publish, and Da Vinci never picks the status.

/** Set once a Da Vinci draft has been applied to this form. */
const daVinciApplied = ref<{ at: number; mode: CatalogApplyPayload['mode']; field?: CatalogApplyPayload['field'] } | null>(null)
const daVinciNotice = ref(false)
/** The status this product had when the wizard opened (edit mode). */
const loadedStatus = ref<PublishStatus | null>(null)

const daVinciNoticeTitle = computed(() => {
  const applied = daVinciApplied.value
  if (applied?.mode === 'create') return 'Da Vinci filled in this form'
  return applied?.field === 'seo' ? 'Da Vinci drafted the search listing' : 'Da Vinci drafted the description'
})

function buildSnapshot(): ProductSnapshot {
  return {
    name: title.value.trim(),
    subtitle: subtitle.value ?? '',
    sku: sku.value ?? '',
    description: description.value ?? '',
    brand: brand.value ?? '',
    tag: tag.value ?? '',
    categories: [...categories.value],
    collection: collection.value ?? '',
    options: hasVariants.value
      ? options.value.filter(o => o.name.trim() && o.values.length).map(o => ({ name: o.name, values: [...o.values] }))
      : [],
    seo: { title: seoTitle.value, metaDescription: seoMetaDescription.value, urlHandle: seoUrlHandle.value },
  }
}

function generateField(field: 'description' | 'seo') {
  const productId = editingId.value ?? undefined
  catalog.ctaClicked('field', field, productId)
  catalog.openField({ field, snapshot: buildSnapshot(), productId, productName: title.value.trim() || undefined })
}

function hydrateFromDraft(payload: CatalogApplyPayload) {
  const f = payload.fields
  if (f.title !== undefined) title.value = f.title
  if (f.subtitle !== undefined) subtitle.value = f.subtitle
  if (f.sku !== undefined) {
    sku.value = f.sku
    defaultVariant.value.sku = f.sku
  }
  if (f.handle !== undefined) {
    url.value = `/products/${f.handle}`
    seoUrlHandle.value = f.handle
  }
  if (f.description !== undefined) description.value = f.description
  if (f.brand !== undefined) brand.value = f.brand
  if (f.tag !== undefined) tag.value = f.tag
  if (f.categories !== undefined) categories.value = [...f.categories]
  if (f.collection !== undefined) collection.value = f.collection
  if (f.seoTitle !== undefined) seoTitle.value = f.seoTitle
  if (f.seoMetaDescription !== undefined) seoMetaDescription.value = f.seoMetaDescription
  if (f.options?.length) {
    // Options first, regenerate now, then price the rows. The deep options watcher
    // runs after this and keeps every row whose title still matches its values.
    hasVariants.value = true
    options.value = f.options.map(o => ({ name: o.name, values: [...o.values] }))
    regenerateVariants()
    for (const variant of generatedVariants.value) {
      if (f.price !== undefined) variant.price = f.price
      if (f.sku !== undefined && !variant.sku) variant.sku = `${f.sku}-${variant.title.replace(/[^A-Za-z0-9]+/g, '-').toUpperCase()}`
    }
  } else if (f.price !== undefined) {
    if (hasVariants.value) generatedVariants.value.forEach(v => { v.price = f.price! })
    else defaultVariant.value.price = f.price
  }
  if (payload.mode === 'create') {
    unlockAll()
    goStep(1)
  }
  daVinciApplied.value = { at: payload.appliedAt, mode: payload.mode, field: payload.field }
  daVinciNotice.value = true
  catalog.confirmApplied(payload)
}

/** Takes a draft applied for this page — on arrival, or while the page is open. */
function takeDaVinciApply() {
  const payload = catalog.takePendingApply()
  if (payload) hydrateFromDraft(payload)
}

// Post flush: after any reload of the form. Both routes share this component, so
// a route change without a remount must be able to take the payload too.
watch([() => catalog.pendingApply, () => route.fullPath], takeDaVinciApply, { flush: 'post' })

function trackSave(publishStatus: PublishStatus, productId: number) {
  const applied = daVinciApplied.value
  if (!isEdit.value) {
    catalog.track('Product Created', {
      product_id: productId,
      created_via: applied?.mode === 'create' ? 'davinci' : 'manual',
      davinci_applied: !!applied,
    })
  }
  if (publishStatus === 'Published' && loadedStatus.value !== 'Published') {
    catalog.track('Product Published', {
      product_id: productId,
      published_via: applied ? 'davinci_assisted' : 'manual',
      time_since_apply_ms: applied ? Date.now() - applied.at : null,
    })
  }
}

function discardProduct() {
  allowNextLeave()
  router.push(productsRoute.value)
}

// ── Load for edit ───────────────────────────────────────────────────────
onMounted(() => {
  if (isEdit.value) {
    const product = store.products.find(p => p.id === editingId.value)
    if (product) {
      loadedStatus.value = product.publishStatus
      title.value = product.name
      sku.value = product.sku
      const d = product.detail
      if (d) {
        subtitle.value = d.subtitle
        url.value = d.url
        description.value = d.description
        hasVariants.value = d.hasVariants
        options.value = d.options.length ? d.options.map(o => ({ name: o.name, values: [...o.values] })) : [{ name: '', values: [] }]
        taxCategory.value = d.taxCategory
        material.value = d.material
        brand.value = d.brand
        tag.value = d.tag
        collection.value = d.collection
        categories.value = [...d.categories]
        width.value = d.width
        length.value = d.length
        height.value = d.height
        weight.value = d.weight
        midCode.value = d.midCode
        hsCode.value = d.hsCode
        countryOfOrigin.value = d.countryOfOrigin
        discountable.value = d.discountable
        salesChannels.value = [...d.salesChannels]
        if (d.seo) {
          seoTitle.value = d.seo.title
          seoMetaDescription.value = d.seo.metaDescription
          seoUrlHandle.value = d.seo.urlHandle
          seoSocial.value = { ogTitle: d.seo.ogTitle, ogDescription: d.seo.ogDescription }
        }
        if (d.hasVariants) {
          generatedVariants.value = d.variantsList.map(v => makeVariant(v.title, v))
        } else {
          defaultVariant.value = d.variantsList[0] ? makeVariant(d.variantsList[0].title, d.variantsList[0]) : makeVariant('Default variant')
        }
      } else {
        // Legacy seed product without a stored wizard detail — derive sensible defaults.
        brand.value = BRANDS.includes(product.vendor) ? product.vendor : ''
        categories.value = CATEGORIES.includes(product.category) ? [product.category] : []
        defaultVariant.value = makeVariant('Default variant', {
          sku: product.sku,
          price: product.price,
          stock: { [LOCATIONS[0]!]: product.inventory },
        })
      }
      unlockAll()
    }
  }
  savedSnapshot.value = formSnapshot()
  // After the snapshot, so an applied draft counts as unsaved (Cancel and leave prompt).
  takeDaVinciApply()
  if (catalog.ctaVisible) catalog.ctaViewed('field')
})
</script>

<template>
  <MpWizardShell
    :title="isEdit ? 'Edit Product' : 'New Product'"
    :steps="steps"
    :current="step"
    :max-step="maxStep"
    :back-to="productsRoute"
    measure="md"
    :hint="stepHint"
    @select="goStep"
    @back="prevStep"
  >
    <template #actions>
      <v-btn variant="text" class="text-none text-medium-emphasis" @click="isDirty ? (confirmCancel = true) : discardProduct()">Cancel</v-btn>
    </template>

    <div class="d-flex flex-column ga-5">
        <MpAlert
          v-if="daVinciNotice"
          tone="info"
          icon="sparkles"
          :title="daVinciNoticeTitle"
          dismissible
          @dismiss="daVinciNotice = false"
        >
          {{ daVinciApplied?.mode === 'create' ? 'Review each step, then' : 'Review it, then' }}
          Save as Draft or Publish. Nothing is saved until you do.
        </MpAlert>

        <!-- Step 1 — Details -->
        <template v-if="step === 1">
          <MpWizardStepCard title="General Information" description="Give this product a title and describe it for shoppers.">
            <MpFormGrid :cols="2">
              <v-text-field
                v-model="title"
                label="Product Title *"
                :error="submitted && !titleValid"
                :error-messages="submitted && !titleValid ? ['Title is required'] : []"
              />
              <v-text-field v-model="sku" label="SKU" placeholder="Auto-generated if blank" />
              <v-text-field v-model="subtitle" label="Subtitle" />
              <v-text-field v-model="url" label="Product URL" placeholder="/products/my-product" prepend-inner-icon="link" />
              <!-- The field action sits in the label row, not on a row of its own. -->
              <div class="mp-form-grid__full pw-field-action">
                <v-textarea v-model="description" label="Description" rows="4" auto-grow />
                <DvCatalogCta
                  v-if="catalog.ctaVisible"
                  label="Generate with Da Vinci"
                  variant="link"
                  class="pw-field-action__cta"
                  :disabled="!catalog.canInvoke"
                  @click="generateField('description')"
                />
              </div>
            </MpFormGrid>
          </MpWizardStepCard>

          <MpWizardStepCard title="Media" description="Add images that show off this product." :heading-level="3">
            <div class="pw-dropzone">
              <v-icon size="40" color="primary" class="mb-2">image-plus</v-icon>
              <div class="text-body-1 font-weight-medium mb-1">Drag and Drop</div>
              <div class="text-caption text-medium-emphasis mb-3">up to 20MB — PNG, JPG, GIF, JPEG, WEBP</div>
              <v-btn variant="flat" color="primary" size="small" class="text-none" prepend-icon="upload">Add Media</v-btn>
            </div>
          </MpWizardStepCard>

          <MpWizardStepCard title="Search engine listing" description="How this product appears in search results and shared links." :heading-level="3">
            <template #title-append>
              <DvCatalogCta
                v-if="catalog.ctaVisible"
                label="Generate with Da Vinci"
                variant="link"
                class="ml-auto"
                :disabled="!catalog.canInvoke"
                @click="generateField('seo')"
              />
            </template>
            <div class="d-flex flex-column ga-4">
              <div class="pw-seo">
                <div class="text-caption text-medium-emphasis">Storefront URL preview</div>
                <div class="pw-seo__url">/products/{{ seoUrlHandle || 'product-handle' }}</div>
                <div class="pw-seo__title">{{ seoTitle || title || 'Product title' }}</div>
                <div class="pw-seo__desc">{{ seoMetaDescription || 'Add a meta description to control this snippet.' }}</div>
              </div>
              <MpFormGrid :cols="2">
                <v-text-field v-model="seoTitle" label="SEO title" counter="60" :rules="[seoTitleRule]" class="mp-form-grid__full" />
                <v-textarea v-model="seoMetaDescription" label="Meta description" rows="3" counter="155" :rules="[seoMetaRule]" class="mp-form-grid__full" />
                <v-text-field v-model="seoUrlHandle" label="URL handle" prefix="/" class="mp-form-grid__full" />
              </MpFormGrid>
            </div>
          </MpWizardStepCard>

          <v-card variant="flat" border rounded="lg" class="pa-6">
            <v-switch
              v-model="hasVariants"
              label="Yes, this is a product with variants"
              hint="When unchecked we create a default variant for you."
              persistent-hint
            />
          </v-card>
        </template>

        <!-- Step 2 — Organise -->
        <template v-else-if="step === 2">
          <MpWizardStepCard title="Organise" description="Classify this product so it's easy to find and merchandise.">
            <MpFormGrid :cols="2">
              <v-select v-model="taxCategory" :items="taxCategoryOptions" label="Tax Category" clearable />
              <v-select v-model="material" :items="MATERIALS" label="Material" clearable />
              <v-combobox v-model="brand" :items="BRANDS" label="Brand" clearable />
              <v-combobox v-model="tag" :items="TAGS" label="Tag" clearable />
              <v-select v-model="collection" :items="collectionOptions" label="Collection" clearable />
              <v-select v-model="categories" :items="CATEGORIES" label="Categories" multiple chips closable-chips />
            </MpFormGrid>
          </MpWizardStepCard>

          <MpWizardStepCard title="Attributes" :heading-level="3">
            <MpFormGrid :cols="2">
              <v-text-field v-model="width" label="Width" suffix="cm" type="number" />
              <v-text-field v-model="length" label="Length" suffix="cm" type="number" />
              <v-text-field v-model="height" label="Height" suffix="cm" type="number" />
              <v-text-field v-model="weight" label="Weight" suffix="kg" type="number" />
              <v-text-field v-model="midCode" label="MID Code" />
              <v-text-field v-model="hsCode" label="HS Code" />
              <v-select v-model="countryOfOrigin" :items="COUNTRIES" label="Country of Origin" clearable class="mp-form-grid__full" />
            </MpFormGrid>
          </MpWizardStepCard>

          <v-card variant="flat" border rounded="lg" class="pa-6">
            <MpFormGrid :cols="2">
              <v-switch
                v-model="discountable"
                label="Discountable"
                hint="Allow discounts and promotions on this product."
                persistent-hint
              />
              <v-select v-model="salesChannels" :items="SALES_CHANNELS" label="Sales Channels" multiple chips closable-chips />
            </MpFormGrid>
          </v-card>
        </template>

        <!-- Step 3 — Variants -->
        <template v-else>
          <!-- With variants: options builder -->
          <template v-if="hasVariants">
            <MpWizardStepCard title="Options" description="Add an option name (e.g. Size) and its values. Variants are generated automatically.">
              <template #title-append>
                <v-btn variant="text" color="primary" size="small" class="text-none ml-auto" prepend-icon="plus" @click="addOption">Add option</v-btn>
              </template>
              <MpFormGrid>
                <div v-for="(opt, i) in options" :key="i" class="mp-form-grid__trailing">
                  <MpFormGrid :cols="2">
                    <v-text-field v-model="opt.name" label="Option name" placeholder="Size" />
                    <v-combobox
                      v-model="opt.values"
                      label="Values"
                      hint="Type a value and press Enter"
                      persistent-hint
                      multiple
                      chips
                      closable-chips
                    />
                  </MpFormGrid>
                  <v-tooltip text="Remove option" location="top">
                    <template #activator="{ props: tip }">
                      <v-btn v-bind="tip" icon="trash-2" variant="text" size="small" class="text-medium-emphasis" aria-label="Remove option" :disabled="options.length === 1" @click="removeOption(i)" />
                    </template>
                  </v-tooltip>
                </div>
              </MpFormGrid>
            </MpWizardStepCard>

            <MpWizardStepCard title="Variants" :heading-level="3">
              <template #title-append>
                <span class="text-body-2 text-medium-emphasis">({{ generatedVariants.length }})</span>
              </template>
              <div v-if="!generatedVariants.length" class="text-body-2 text-medium-emphasis py-4">Add at least one option with values above to generate variants.</div>
              <MpFormGrid v-else>
                <div v-for="variant in generatedVariants" :key="variant.id" class="pw-variant">
                  <MpFormGrid :cols="2">
                    <MpFormSection :title="variant.title" />
                    <v-text-field v-model="variant.sku" label="SKU" class="mp-form-grid__full" />
                    <v-text-field v-model="variant.costPrice" label="Cost Price" prefix="$" type="number" />
                    <v-text-field v-model="variant.price" label="Price" prefix="$" type="number" />
                    <v-switch v-model="variant.manageInventory" label="Manage Inventory" />
                    <v-switch v-model="variant.allowBackorder" label="Allow Backorder" />
                    <template v-if="variant.manageInventory">
                      <v-text-field
                        v-for="loc in LOCATIONS"
                        :key="loc"
                        v-model.number="variant.stock[loc]"
                        :label="`In Stock — ${loc}`"
                        type="number"
                        min="0"
                      />
                    </template>
                  </MpFormGrid>
                </div>
              </MpFormGrid>
            </MpWizardStepCard>
          </template>

          <!-- Without variants: default variant -->
          <MpWizardStepCard v-else title="Default Variant" description="This product has no variants, so pricing and stock are set on a single default variant.">
            <MpFormGrid :cols="2">
              <v-text-field v-model="defaultVariant.sku" label="SKU" class="mp-form-grid__full" />
              <v-text-field v-model="defaultVariant.costPrice" label="Cost Price" prefix="$" type="number" />
              <v-text-field v-model="defaultVariant.price" label="Price" prefix="$" type="number" />
              <v-switch v-model="defaultVariant.manageInventory" label="Manage Inventory" />
              <v-switch v-model="defaultVariant.allowBackorder" label="Allow Backorder" />
              <template v-if="defaultVariant.manageInventory">
                <v-text-field
                  v-for="loc in LOCATIONS"
                  :key="loc"
                  v-model.number="defaultVariant.stock[loc]"
                  :label="`In Stock — ${loc}`"
                  type="number"
                  min="0"
                />
              </template>
            </MpFormGrid>
          </MpWizardStepCard>
        </template>
    </div>

    <template #footerStart>
      <div class="d-flex align-center gap-2">
        <v-btn variant="text" class="text-none" @click="isDirty ? (confirmCancel = true) : discardProduct()">Cancel</v-btn>
        <v-btn v-if="step > 1" variant="text" class="text-none" prepend-icon="arrow-left" @click="prevStep">Back</v-btn>
      </div>
    </template>
    <template #footer>
      <v-btn variant="outlined" class="text-none" :disabled="!titleValid" @click="save('Draft')">Save as Draft</v-btn>
      <v-btn v-if="step < 3" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="step === 1 && !titleValid" @click="nextStep">Continue</v-btn>
      <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="check" :disabled="!titleValid" @click="save('Published')">Publish</v-btn>
    </template>
  </MpWizardShell>

  <MpConfirmDialog
    v-model="confirmCancel"
    title="Discard this product?"
    message="Your changes won't be saved. This can't be undone."
    confirm-label="Discard"
    danger
    @confirm="discardProduct"
  />
  <MpConfirmDialog
    v-model="confirmLeave"
    danger
    :title="leaveTitle"
    :message="leaveMessage"
    :confirm-label="leaveConfirmLabel"
    @confirm="discardAndLeave"
  />
</template>

<style scoped>
.pw-field-action {
  position: relative;
}

.pw-field-action__cta {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
}

.pw-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--mp-space-32) var(--mp-space-16);
  border: 1px dashed var(--border-strong);
  border-radius: var(--mp-radius-12);
}

.pw-variant {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  padding: var(--mp-space-16);
}

.pw-seo {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  padding: var(--mp-space-16);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-10);
}

.pw-seo__url {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-on-surface-variant));
  overflow-wrap: anywhere;
}

.pw-seo__title {
  font-size: var(--mp-fontSize-16);
  color: rgb(var(--v-theme-primary));
}

.pw-seo__desc {
  font-size: var(--mp-fontSize-13);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
