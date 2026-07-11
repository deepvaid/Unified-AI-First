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
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useCommerceStore()
const extras = useProductExtrasStore()

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
const step = ref(1)
const maxStep = ref(1)
const confirmCancel = ref(false)

// ── Step 1 — Details ────────────────────────────────────────────────────
const title = ref('')
const sku = ref('')
const subtitle = ref('')
const url = ref('')
const description = ref('')
const hasVariants = ref(false)

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

function goStep(target: number) {
  if (target <= maxStep.value) step.value = target
}

function nextStep() {
  submitted.value = true
  if (step.value === 1 && !titleValid.value) return
  if (step.value < 3) {
    step.value += 1
    maxStep.value = Math.max(maxStep.value, step.value)
    submitted.value = false
  }
}

function prevStep() {
  if (step.value > 1) step.value -= 1
}

// ── Persistence ─────────────────────────────────────────────────────────
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
  if (isEdit.value && editingId.value !== null) {
    store.updateProductDraft(editingId.value, input)
    router.push({ ...productsRoute.value, query: { flash: 'product-updated' } })
  } else {
    store.createProduct(input)
    router.push({ ...productsRoute.value, query: { flash: publishStatus === 'Draft' ? 'product-draft' : 'product-published' } })
  }
}

// ── Load for edit ───────────────────────────────────────────────────────
onMounted(() => {
  if (!isEdit.value) return
  const product = store.products.find(p => p.id === editingId.value)
  if (!product) return
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
  maxStep.value = 3
})
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <!-- Header + step indicator -->
    <div class="pw-head px-8 pt-6 pb-4 bg-surface border-b">
      <MpPageHeader
        :title="isEdit ? 'Edit Product' : 'New Product'"
        :subtitle="`Step ${step} of 3 — ${steps[step - 1]}`"
        :back-to="productsRoute"
      >
        <template #actions>
          <v-btn variant="text" class="text-none text-medium-emphasis" @click="confirmCancel = true">Cancel</v-btn>
        </template>
        <template #tabs>
          <MpWizardSteps :steps="steps" :current="step" clickable :max-step="maxStep" class="mt-3" @select="goStep" />
        </template>
      </MpPageHeader>
    </div>

    <!-- Step content -->
    <div class="flex-grow-1 overflow-y-auto pa-8 bg-background">
      <div style="max-width: 880px; margin: 0 auto;">

        <!-- Step 1 — Details -->
        <template v-if="step === 1">
          <v-card variant="flat" border rounded="lg" class="pa-6 mb-5">
            <div class="text-subtitle-1 font-weight-bold mb-1">General Information</div>
            <div class="text-body-2 text-medium-emphasis mb-5">Give this product a title and describe it for shoppers.</div>
            <v-row dense>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="title"
                  label="Product Title *"
                  variant="outlined"
                  density="comfortable"
                  :error="submitted && !titleValid"
                  :error-messages="submitted && !titleValid ? ['Title is required'] : []"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="sku" label="SKU" placeholder="Auto-generated if blank" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="subtitle" label="Subtitle" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="url" label="Product URL" placeholder="/products/my-product" prepend-inner-icon="link" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="description" label="Description" rows="4" auto-grow variant="outlined" density="comfortable" />
              </v-col>
            </v-row>
          </v-card>

          <v-card variant="flat" border rounded="lg" class="pa-6 mb-5">
            <div class="text-subtitle-1 font-weight-bold mb-1">Media</div>
            <div class="text-body-2 text-medium-emphasis mb-4">Add images that show off this product.</div>
            <div class="pw-dropzone">
              <v-icon size="40" color="primary" class="mb-2">image-plus</v-icon>
              <div class="text-body-1 font-weight-medium mb-1">Drag and Drop</div>
              <div class="text-caption text-medium-emphasis mb-3">up to 20MB — PNG, JPG, GIF, JPEG, WEBP</div>
              <v-btn variant="flat" color="primary" size="small" class="text-none" prepend-icon="upload">Add Media</v-btn>
            </div>
          </v-card>

          <v-card variant="flat" border rounded="lg" class="pa-6">
            <v-switch v-model="hasVariants" color="primary" hide-details density="comfortable" label="Yes, this is a product with variants" />
            <div class="text-caption text-medium-emphasis mt-1">When unchecked we create a default variant for you.</div>
          </v-card>
        </template>

        <!-- Step 2 — Organise -->
        <template v-else-if="step === 2">
          <v-card variant="flat" border rounded="lg" class="pa-6 mb-5">
            <div class="text-subtitle-1 font-weight-bold mb-1">Organise</div>
            <div class="text-body-2 text-medium-emphasis mb-5">Classify this product so it's easy to find and merchandise.</div>
            <v-row dense>
              <v-col cols="12" md="6"><v-select v-model="taxCategory" :items="taxCategoryOptions" label="Tax Category" variant="outlined" density="comfortable" clearable /></v-col>
              <v-col cols="12" md="6"><v-select v-model="material" :items="MATERIALS" label="Material" variant="outlined" density="comfortable" clearable /></v-col>
              <v-col cols="12" md="6"><v-select v-model="brand" :items="BRANDS" label="Brand" variant="outlined" density="comfortable" clearable /></v-col>
              <v-col cols="12" md="6"><v-select v-model="tag" :items="TAGS" label="Tag" variant="outlined" density="comfortable" clearable /></v-col>
              <v-col cols="12" md="6"><v-select v-model="collection" :items="collectionOptions" label="Collection" variant="outlined" density="comfortable" clearable /></v-col>
              <v-col cols="12" md="6"><v-select v-model="categories" :items="CATEGORIES" label="Categories" variant="outlined" density="comfortable" multiple chips closable-chips /></v-col>
            </v-row>
          </v-card>

          <v-card variant="flat" border rounded="lg" class="pa-6 mb-5">
            <div class="text-subtitle-1 font-weight-bold mb-4">Attributes</div>
            <v-row dense>
              <v-col cols="6" md="3"><v-text-field v-model="width" label="Width" suffix="cm" type="number" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="6" md="3"><v-text-field v-model="length" label="Length" suffix="cm" type="number" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="6" md="3"><v-text-field v-model="height" label="Height" suffix="cm" type="number" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="6" md="3"><v-text-field v-model="weight" label="Weight" suffix="kg" type="number" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="midCode" label="MID Code" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="hsCode" label="HS Code" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="12" md="4"><v-select v-model="countryOfOrigin" :items="COUNTRIES" label="Country of Origin" variant="outlined" density="comfortable" clearable /></v-col>
            </v-row>
          </v-card>

          <v-card variant="flat" border rounded="lg" class="pa-6">
            <v-row dense align="center">
              <v-col cols="12" md="6">
                <v-switch v-model="discountable" color="primary" hide-details density="comfortable" label="Discountable" />
                <div class="text-caption text-medium-emphasis mt-1">Allow discounts and promotions on this product.</div>
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="salesChannels" :items="SALES_CHANNELS" label="Sales Channels" variant="outlined" density="comfortable" multiple chips closable-chips />
              </v-col>
            </v-row>
          </v-card>
        </template>

        <!-- Step 3 — Variants -->
        <template v-else>
          <!-- With variants: options builder -->
          <template v-if="hasVariants">
            <v-card variant="flat" border rounded="lg" class="pa-6 mb-5">
              <div class="d-flex align-center justify-space-between mb-1">
                <div class="text-subtitle-1 font-weight-bold">Options</div>
                <v-btn variant="text" color="primary" size="small" class="text-none" prepend-icon="plus" @click="addOption">Add option</v-btn>
              </div>
              <div class="text-body-2 text-medium-emphasis mb-4">Add an option name (e.g. Size) and its values. Variants are generated automatically.</div>
              <v-row v-for="(opt, i) in options" :key="i" dense align="center" class="mb-1">
                <v-col cols="12" md="4">
                  <v-text-field v-model="opt.name" label="Option name" placeholder="Size" variant="outlined" density="comfortable" hide-details />
                </v-col>
                <v-col cols="12" md="7">
                  <v-combobox v-model="opt.values" label="Values" placeholder="Type a value and press Enter" variant="outlined" density="comfortable" multiple chips closable-chips hide-details />
                </v-col>
                <v-col cols="12" md="1" class="text-center">
                  <v-btn icon="trash-2" variant="text" size="small" color="medium-emphasis" aria-label="Remove option" :disabled="options.length === 1" @click="removeOption(i)" />
                </v-col>
              </v-row>
            </v-card>

            <v-card variant="flat" border rounded="lg" class="pa-6">
              <div class="text-subtitle-1 font-weight-bold mb-4">Variants <span class="text-medium-emphasis font-weight-regular">({{ generatedVariants.length }})</span></div>
              <div v-if="!generatedVariants.length" class="text-body-2 text-medium-emphasis py-4">Add at least one option with values above to generate variants.</div>
              <div v-for="variant in generatedVariants" v-else :key="variant.id" class="pw-variant mb-3">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="text-body-1 font-weight-bold">{{ variant.title }}</div>
                </div>
                <v-row dense>
                  <v-col cols="12" md="6"><v-text-field v-model="variant.sku" label="SKU" variant="outlined" density="compact" hide-details /></v-col>
                  <v-col cols="6" md="3"><v-text-field v-model="variant.costPrice" label="Cost Price" prefix="$" type="number" variant="outlined" density="compact" hide-details /></v-col>
                  <v-col cols="6" md="3"><v-text-field v-model="variant.price" label="Price" prefix="$" type="number" variant="outlined" density="compact" hide-details /></v-col>
                </v-row>
                <div class="d-flex flex-wrap gap-4 mt-3 mb-2">
                  <v-switch v-model="variant.manageInventory" color="primary" hide-details density="compact" label="Manage Inventory" />
                  <v-switch v-model="variant.allowBackorder" color="primary" hide-details density="compact" label="Allow Backorder" />
                </div>
                <v-row v-if="variant.manageInventory" dense>
                  <v-col v-for="loc in LOCATIONS" :key="loc" cols="6" md="3">
                    <v-text-field v-model.number="variant.stock[loc]" :label="`In Stock — ${loc}`" type="number" min="0" variant="outlined" density="compact" hide-details />
                  </v-col>
                </v-row>
              </div>
            </v-card>
          </template>

          <!-- Without variants: default variant -->
          <v-card v-else variant="flat" border rounded="lg" class="pa-6">
            <div class="text-subtitle-1 font-weight-bold mb-1">Default Variant</div>
            <div class="text-body-2 text-medium-emphasis mb-4">This product has no variants, so pricing and stock are set on a single default variant.</div>
            <v-row dense>
              <v-col cols="12" md="6"><v-text-field v-model="defaultVariant.sku" label="SKU" variant="outlined" density="comfortable" hide-details /></v-col>
              <v-col cols="6" md="3"><v-text-field v-model="defaultVariant.costPrice" label="Cost Price" prefix="$" type="number" variant="outlined" density="comfortable" hide-details /></v-col>
              <v-col cols="6" md="3"><v-text-field v-model="defaultVariant.price" label="Price" prefix="$" type="number" variant="outlined" density="comfortable" hide-details /></v-col>
            </v-row>
            <div class="d-flex flex-wrap gap-4 mt-3 mb-2">
              <v-switch v-model="defaultVariant.manageInventory" color="primary" hide-details density="compact" label="Manage Inventory" />
              <v-switch v-model="defaultVariant.allowBackorder" color="primary" hide-details density="compact" label="Allow Backorder" />
            </div>
            <v-row v-if="defaultVariant.manageInventory" dense>
              <v-col v-for="loc in LOCATIONS" :key="loc" cols="6" md="3">
                <v-text-field v-model.number="defaultVariant.stock[loc]" :label="`In Stock — ${loc}`" type="number" min="0" variant="outlined" density="comfortable" hide-details />
              </v-col>
            </v-row>
          </v-card>
        </template>

      </div>
    </div>

    <!-- Bottom navigation bar -->
    <div class="px-8 py-4 border-t bg-surface d-flex justify-space-between align-center">
      <div class="d-flex align-center gap-2">
        <v-btn variant="text" class="text-none" @click="confirmCancel = true">Cancel</v-btn>
        <v-btn v-if="step > 1" variant="text" class="text-none" prepend-icon="arrow-left" @click="prevStep">Back</v-btn>
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn variant="outlined" class="text-none" :disabled="!titleValid" @click="save('Draft')">Save as Draft</v-btn>
        <v-btn v-if="step < 3" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="step === 1 && !titleValid" @click="nextStep">Continue</v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="check" :disabled="!titleValid" @click="save('Published')">Publish</v-btn>
      </div>
    </div>

    <MpConfirmDialog
      v-model="confirmCancel"
      title="Discard this product?"
      message="Your changes won't be saved. This can't be undone."
      confirm-label="Discard"
      danger
      @confirm="router.push(productsRoute)"
    />
  </div>
</template>

<style scoped>
.pw-head :deep(.mp-page-header) { margin-bottom: 0; }
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }

.pw-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 16px;
  border: 1.5px dashed rgba(var(--v-theme-on-surface), 0.25);
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.pw-variant {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  padding: 16px;
}
</style>
