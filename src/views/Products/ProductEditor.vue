<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

/**
 * Product editor — the single-page edit surface for an existing product
 * (creation stays on the 3-step wizard, exactly as UAT splits them).
 * Rebuilt from UAT `/commerce/:id/products/:id`; see docs/rebuild/products-list/.
 */
const store = useCommerceStore()
const extras = useProductExtrasStore()
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
const collectionOptions = computed(() => extras.collections.map((c) => c.title))
const brandOptions = computed(() => Array.from(new Set(store.products.map((p) => p.vendor))).sort())
const categoryOptions = computed(() => Array.from(new Set(store.products.map((p) => p.category))).sort())

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

/** Variant rows shown in the grid — real ones when the wizard built them, else a default row. */
const variantRows = computed<ProductVariant[]>(() => {
  if (form.value.detail.variantsList.length) return form.value.detail.variantsList
  return [{
    id: 0,
    title: 'Default variant',
    sku: form.value.sku,
    manageInventory: true,
    allowBackorder: false,
    costPrice: '',
    price: form.value.price,
    stock: Object.fromEntries(INVENTORY_LOCATIONS.map((l) => [l, 0])),
  }]
})

const variantHeaders = computed(() => [
  { title: 'Variant', key: 'title', minWidth: '200px' },
  { title: 'SKU', key: 'sku' },
  { title: 'Price', key: 'price', align: 'end' as const },
  ...INVENTORY_LOCATIONS.map((l) => ({ title: `In stock (${l})`, key: `stock.${l}`, align: 'end' as const })),
])

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
    detail: { ...form.value.detail, seo: { ...form.value.seo } },
    components: p.components,
  })
  saving.value = false
  snapshot.value = JSON.stringify(form.value)
  router.push({ ...listRoute.value, query: { flash: 'product-updated' } })
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
        <v-btn variant="text" class="text-none" :disabled="saving" @click="requestCancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :loading="saving" :disabled="!valid || !dirty" @click="save">
          Save
        </v-btn>
      </template>
    </MpPageHeader>

    <v-row class="flex-grow-1" no-gutters>
      <!-- ── Main column ─────────────────────────────────────────── -->
      <v-col cols="12" md="8" class="pr-md-4 d-flex flex-column ga-4">
        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection title="General information" description="To start selling, all you need is a name and a price." required />
          <MpFormGrid :cols="2">
            <v-text-field
              v-model="form.name"
              label="Title *"
              :error-messages="form.name.trim() ? [] : ['Title is required']"
            />
            <v-text-field v-model="form.sku" label="SKU" />
            <v-text-field v-model="form.detail.subtitle" label="Subtitle" />
            <v-text-field v-model="form.detail.url" label="Product URL" placeholder="https://…" />
            <v-textarea v-model="form.detail.description" label="Description" rows="5" class="mp-form-grid__full" />
          </MpFormGrid>
          <v-switch
            v-model="form.detail.discountable"
            hide-details
            density="compact"
            label="Discountable — when off, discounts are never applied to this product"
          />
        </v-card>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection title="Media" description="PNG, JPG, GIF, JPEG or WEBP up to 20 MB each." />
          <div class="ped-media">
            <div class="ped-media__tile">
              <v-icon size="20" class="text-medium-emphasis">image</v-icon>
              <span class="text-caption text-medium-emphasis">Primary</span>
            </div>
            <v-btn variant="outlined" prepend-icon="plus" class="text-none align-self-center">Add media</v-btn>
          </div>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection title="Variants" description="Offer your customers different options for colour, size or finish." />
          <template v-if="form.detail.options.length">
            <MpFormField v-for="(option, index) in form.detail.options" :key="index" :label="option.name || `Option ${index + 1}`">
              <template #default="{ labelId }">
                <div class="d-flex flex-wrap ga-1" :aria-labelledby="labelId">
                  <v-chip v-for="value in option.values" :key="value" size="small" variant="tonal" label>{{ value }}</v-chip>
                </div>
              </template>
            </MpFormField>
          </template>
          <p v-else class="text-body-2 text-medium-emphasis mb-0">
            This product has a single default variant.
          </p>

          <v-data-table
            :headers="variantHeaders"
            :items="variantRows"
            density="comfortable"
            hide-default-footer
            :items-per-page="-1"
            class="ped-variants"
          >
            <template #item.title="{ item }">
              <span class="text-body-2 font-weight-medium">{{ item.title }}</span>
            </template>
            <template #item.sku="{ item }">
              <span class="ped-mono text-body-2">{{ item.sku || '—' }}</span>
            </template>
            <template #item.price="{ item }">
              <span class="text-body-2">${{ (parseFloat(item.price) || 0).toFixed(2) }}</span>
            </template>
            <template v-for="location in INVENTORY_LOCATIONS" :key="location" #[`item.stock.${location}`]="{ item }">
              <span class="text-body-2">{{ item.stock[location] ?? 0 }}</span>
            </template>
          </v-data-table>
          <v-btn variant="outlined" prepend-icon="pencil" class="text-none align-self-start" @click="openVariantsWizard">
            Edit options and variants
          </v-btn>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection title="Search engine listing" description="How this product appears in search results and shared links." />
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
          <MpFormSection title="Product status" />
          <v-select v-model="form.publishStatus" :items="['Draft', 'Published']" label="Status" />
        </v-card>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection title="Sales channels" description="Without a channel, the product falls back to the default sales channel." />
          <v-select
            v-model="form.detail.salesChannels"
            :items="CHANNELS"
            label="Channels"
            multiple
            chips
            closable-chips
          />
        </v-card>

        <v-card variant="flat" border rounded="lg" class="ped-card">
          <MpFormSection title="Attributes" description="Missing weight may affect the shipping rate at checkout." />
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
          <MpFormSection title="Organise" />
          <MpFormGrid>
            <v-select v-model="form.detail.taxCategory" :items="taxCategoryOptions" label="Tax category" clearable />
            <v-select v-model="form.detail.material" :items="MATERIALS" label="Material" clearable />
            <v-combobox v-model="form.detail.brand" :items="brandOptions" label="Brand" clearable />
            <v-combobox v-model="form.detail.tag" :items="['Featured', 'New', 'Sale', 'Seasonal', 'Clearance']" label="Tags" clearable />
            <v-select v-model="form.detail.collection" :items="collectionOptions" label="Collection" clearable />
            <v-select v-model="form.detail.categories" :items="categoryOptions" label="Categories" multiple chips closable-chips />
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
.ped-card {
  padding: var(--mp-component-card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.ped-media {
  display: flex;
  gap: var(--mp-space-12);
}

.ped-media__tile {
  width: 96px;
  height: 96px;
  border: 1px dashed rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-4);
}

.ped-variants {
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
}

.ped-mono {
  font-family: var(--mp-fontFamily-mono);
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
