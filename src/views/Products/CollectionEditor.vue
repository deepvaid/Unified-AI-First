<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useProductExtrasStore, CATALOG_SOURCES,
  COLLECTION_FIELDS, COLLECTION_TEXT_OPERATORS, COLLECTION_NUMBER_OPERATORS,
  type CollectionInput, type CollectionType, type CollectionRule, type CollectionField, type CatalogProduct,
} from '@/stores/useProductExtras'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * Collection editor — one page for both collection types. Automated shows the
 * condition builder; manual shows the product picker. Mirrors UAT's
 * `/products/collections/new?type=dynamic|manual`.
 */
const store = useProductExtrasStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const listPath = computed(() => `/commerce/${accountId.value}/products/collections`)

const collectionId = computed(() => {
  const raw = route.params.collectionId
  return raw === undefined ? null : Number(raw)
})
const isEdit = computed(() => collectionId.value !== null)

const emptyRule = (): CollectionRule => ({ field: 'Title', operator: 'Contains', value: '' })

const emptyForm = (type: CollectionType): CollectionInput => ({
  title: '', parent: 'Root', description: '', type, status: 'Active',
  matchMode: 'all', rules: type === 'Automated' ? [emptyRule()] : [], productItemIds: [],
  seo: { title: '', metaDescription: '', urlHandle: '', ogTitle: '', ogDescription: '' },
  imageName: '',
})

const form = ref<CollectionInput>(emptyForm('Automated'))
const snapshot = ref('')
const handleTouched = ref(false)
/** v-file-input needs a File; the store only persists the name. */
const imageFile = ref<File | File[] | null>(null)
watch(imageFile, (value) => {
  const file = Array.isArray(value) ? value[0] : value
  form.value.imageName = file?.name ?? ''
})

function load() {
  if (collectionId.value === null) {
    const type: CollectionType = route.query.type === 'manual' ? 'Manual' : 'Automated'
    form.value = emptyForm(type)
    handleTouched.value = false
  } else {
    const collection = store.collections.find((c) => c.id === collectionId.value)
    if (!collection) {
      router.replace(listPath.value)
      return
    }
    form.value = {
      title: collection.title,
      parent: collection.parent,
      description: collection.description,
      type: collection.type,
      status: collection.status,
      matchMode: collection.matchMode,
      rules: collection.rules.length ? collection.rules.map((r) => ({ ...r })) : [emptyRule()],
      productItemIds: [...collection.productItemIds],
      seo: { ...collection.seo },
      imageName: collection.imageName,
    }
    handleTouched.value = true
  }
  snapshot.value = JSON.stringify(form.value)
}
load()
watch(() => route.fullPath, load)

// Keep the handle following the title until it is edited directly.
watch(() => form.value.title, (title) => {
  if (!handleTouched.value) form.value.seo.urlHandle = store.toHandle(title)
})

const parentOptions = computed(() => {
  const names = new Set(['Root', ...store.collections.map((c) => c.title)])
  if (collectionId.value !== null) {
    const self = store.collections.find((c) => c.id === collectionId.value)
    if (self) names.delete(self.title)
  }
  return [...names]
})

const isAutomated = computed(() => form.value.type === 'Automated')

function operatorsFor(field: CollectionField): string[] {
  return field === 'Price' ? [...COLLECTION_NUMBER_OPERATORS] : [...COLLECTION_TEXT_OPERATORS]
}

function addRule() {
  form.value.rules.push(emptyRule())
}

function removeRule(index: number) {
  form.value.rules.splice(index, 1)
  if (form.value.rules.length === 0) form.value.rules.push(emptyRule())
}

function onFieldChange(rule: CollectionRule) {
  const allowed = operatorsFor(rule.field)
  if (!allowed.includes(rule.operator)) rule.operator = allowed[0]!
}

const ruleErrors = computed(() => form.value.rules.map((r) => (r.value.trim() ? '' : 'Enter a value for this condition')))

const selectedProducts = computed<CatalogProduct[]>(() =>
  form.value.productItemIds
    .map((id) => store.catalog.find((p) => p.itemId === id))
    .filter((p): p is CatalogProduct => Boolean(p)),
)

const dirty = computed(() => JSON.stringify(form.value) !== snapshot.value)
const valid = computed(() => {
  if (!form.value.title.trim()) return false
  return isAutomated.value
    ? form.value.rules.every((r) => r.value.trim().length > 0)
    : form.value.productItemIds.length > 0
})

// ── Product picker (manual collections) ─────────────────────────────
const pickerOpen = ref(false)
const pickerSearch = ref('')
const pickerSource = ref<'All' | string>('All')
const pickerSelection = ref<string[]>([])

const pickerResults = computed(() => {
  const term = pickerSearch.value.trim().toLowerCase()
  return store.catalog.filter((p) => {
    const byTerm = !term || p.name.toLowerCase().includes(term) || p.itemId.toLowerCase().includes(term)
    const bySource = pickerSource.value === 'All' || p.source === pickerSource.value
    return byTerm && bySource
  })
})

function openPicker() {
  pickerSelection.value = [...form.value.productItemIds]
  pickerSearch.value = ''
  pickerSource.value = 'All'
  pickerOpen.value = true
}

function applyPicker() {
  form.value.productItemIds = [...pickerSelection.value]
  pickerOpen.value = false
}

function removeProduct(itemId: string) {
  form.value.productItemIds = form.value.productItemIds.filter((id) => id !== itemId)
}

// ── Save / cancel ───────────────────────────────────────────────────
const saving = ref(false)
const cancelGuard = ref(false)

function requestCancel() {
  if (dirty.value) cancelGuard.value = true
  else router.push(listPath.value)
}

async function save() {
  if (!valid.value) return
  saving.value = true
  await new Promise((resolve) => setTimeout(resolve, 450))
  const payload: CollectionInput = {
    ...form.value,
    title: form.value.title.trim(),
    rules: isAutomated.value ? form.value.rules : [],
    productItemIds: isAutomated.value ? [] : form.value.productItemIds,
  }
  if (collectionId.value !== null) {
    store.updateCollection(collectionId.value, payload)
    toast.success('Collection updated')
  } else {
    store.addCollection(payload)
    toast.success(`${payload.type} collection created`)
  }
  saving.value = false
  snapshot.value = JSON.stringify(form.value)
  router.push(listPath.value)
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Products · Collections"
      :title="isEdit ? `Edit ${form.type.toLowerCase()} collection` : `New ${form.type.toLowerCase()} collection`"
      :subtitle="isAutomated
        ? 'Products join this collection automatically whenever they match your conditions.'
        : 'You choose exactly which products belong to this collection.'"
      :back-to="listPath"
    >
      <template #actions>
        <v-btn variant="text" class="text-none" :disabled="saving" @click="requestCancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :loading="saving" :disabled="!valid" @click="save">
          {{ isEdit ? 'Save changes' : 'Create collection' }}
        </v-btn>
      </template>
    </MpPageHeader>

    <v-row class="flex-grow-1" no-gutters>
      <!-- ── Main column ─────────────────────────────────────────── -->
      <v-col cols="12" md="8" class="pr-md-4 d-flex flex-column ga-4">
        <v-card variant="flat" border rounded="lg" class="col-card">
          <MpFormSection title="General" required />
          <MpFormGrid :cols="2">
            <v-text-field
              v-model="form.title"
              label="Title *"
              :error-messages="form.title.trim() ? [] : ['Title is required']"
            />
            <v-select v-model="form.parent" :items="parentOptions" label="Parent collection" />
            <v-textarea v-model="form.description" label="Description" rows="3" class="mp-form-grid__full" />
          </MpFormGrid>
        </v-card>

        <!-- Automated: conditions -->
        <v-card v-if="isAutomated" variant="flat" border rounded="lg" class="col-card">
          <MpFormSection title="Conditions" description="Products must match these conditions to join the collection." />
          <MpFormField label="Match">
            <template #default="{ labelId }">
              <v-radio-group v-model="form.matchMode" inline hide-details :aria-labelledby="labelId">
                <v-radio label="All conditions" value="all" />
                <v-radio label="Any condition" value="any" />
              </v-radio-group>
            </template>
          </MpFormField>

          <div class="d-flex flex-column ga-3">
            <div v-for="(rule, index) in form.rules" :key="index" class="col-rule">
              <v-select
                v-model="rule.field"
                :items="[...COLLECTION_FIELDS]"
                label="Field"
                hide-details
                @update:model-value="onFieldChange(rule)"
              />
              <v-select v-model="rule.operator" :items="operatorsFor(rule.field)" label="Operator" hide-details />
              <v-text-field
                v-model="rule.value"
                :label="rule.field === 'Price' ? 'Amount' : 'Value'"
                :type="rule.field === 'Price' ? 'number' : 'text'"
                :error-messages="ruleErrors[index] ? [ruleErrors[index] as string] : []"
              />
              <v-btn
                icon="trash-2"
                variant="text"
                size="small"
                :aria-label="`Remove condition ${index + 1}`"
                :disabled="form.rules.length === 1 && !rule.value"
                @click="removeRule(index)"
              />
            </div>
          </div>

          <v-btn variant="outlined" prepend-icon="plus" class="text-none align-self-start" @click="addRule">
            Add condition
          </v-btn>
        </v-card>

        <!-- Manual: products -->
        <v-card v-else variant="flat" border rounded="lg" class="col-card">
          <MpFormSection title="Products" required description="The exact products this collection contains." />
          <v-btn variant="outlined" prepend-icon="plus" class="text-none align-self-start" @click="openPicker">
            Add products
          </v-btn>

          <div v-if="selectedProducts.length" class="col-picked">
            <MpListRow
              v-for="product in selectedProducts"
              :key="product.itemId"
              variant="divided"
              :title="product.name || product.itemId"
              :eyebrow="product.itemId"
              :meta="`$${product.price.toFixed(2)}`"
            >
              <template #trailing>
                <v-btn
                  icon="x"
                  size="x-small"
                  variant="text"
                  :aria-label="`Remove ${product.name || product.itemId}`"
                  @click="removeProduct(product.itemId)"
                />
              </template>
            </MpListRow>
          </div>
          <MpEmptyState
            v-else
            icon="package"
            title="No products yet"
            description="Add at least one product before this collection can be saved."
            action-label="Add products"
            action-icon="plus"
            class="py-8"
            @action="openPicker"
          />
        </v-card>

        <v-card variant="flat" border rounded="lg" class="col-card">
          <MpFormSection title="Search engine listing" description="How this collection appears in search results and shared links." />
          <div class="col-seo-preview">
            <div class="text-caption text-medium-emphasis">Storefront URL preview</div>
            <div class="col-seo-preview__url">/collections/{{ form.seo.urlHandle || 'collection-handle' }}</div>
            <div class="col-seo-preview__title">{{ form.seo.title || form.title || 'Collection title' }}</div>
            <div class="col-seo-preview__desc">{{ form.seo.metaDescription || form.description || 'Add a meta description to control this snippet.' }}</div>
          </div>
          <MpFormGrid :cols="2">
            <v-text-field v-model="form.seo.title" label="SEO title" class="mp-form-grid__full" />
            <v-textarea v-model="form.seo.metaDescription" label="Meta description" rows="3" class="mp-form-grid__full" />
            <v-text-field
              v-model="form.seo.urlHandle"
              label="URL handle"
              prefix="/"
              class="mp-form-grid__full"
              @update:model-value="handleTouched = true"
            />
            <v-text-field v-model="form.seo.ogTitle" label="Social (OG) title" />
            <v-text-field v-model="form.seo.ogDescription" label="Social (OG) description" />
          </MpFormGrid>
        </v-card>
      </v-col>

      <!-- ── Side rail ───────────────────────────────────────────── -->
      <v-col cols="12" md="4" class="mt-4 mt-md-0 d-flex flex-column ga-4">
        <v-card variant="flat" border rounded="lg" class="col-card">
          <MpFormSection title="Status" />
          <v-select v-model="form.status" :items="['Active', 'Inactive']" label="Storefront status" />
          <div class="d-flex align-center ga-2">
            <span class="text-caption text-medium-emphasis">Shows as</span>
            <MpStatusChip :status="form.status" type="general" size="sm" />
          </div>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="col-card">
          <MpFormSection title="Collection image" description="JPG, PNG, GIF or WebP up to 20 MB." />
          <v-file-input
            v-model="imageFile"
            label="Collection image"
            accept="image/jpeg,image/png,image/gif,image/webp"
            prepend-icon=""
            prepend-inner-icon="image-up"
          />
        </v-card>

        <v-card variant="flat" border rounded="lg" class="col-card">
          <MpFormSection title="Sales channels" description="Channels and templates are assigned once the collection exists." />
          <p class="text-body-2 text-medium-emphasis mb-0">
            No templates assigned yet.
          </p>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Product picker ──────────────────────────────────────────── -->
    <MpDialog v-model="pickerOpen" title="Add products" subtitle="Pick the products this collection contains" size="lg">
      <div class="d-flex flex-wrap ga-3">
        <v-text-field
          v-model="pickerSearch"
          label="Search"
          placeholder="Product name or item ID"
          prepend-inner-icon="search"
          clearable
          hide-details
          class="flex-grow-1"
        />
        <v-select v-model="pickerSource" :items="['All', ...CATALOG_SOURCES]" label="Source" hide-details class="col-picker__filter" />
      </div>

      <div class="col-picker__list">
        <MpEmptyState
          v-if="pickerResults.length === 0"
          icon="search-x"
          title="No products match that search"
          description="Try a different term or switch the source back to All."
          class="py-8"
        />
        <MpListRow
          v-for="product in pickerResults"
          v-else
          :key="product.itemId"
          variant="divided"
          :title="product.name || product.itemId"
          :eyebrow="product.source"
          :meta="`$${product.price.toFixed(2)}`"
        >
          <template #lead>
            <v-checkbox-btn
              v-model="pickerSelection"
              :value="product.itemId"
              color="primary"
              :aria-label="`Select ${product.name || product.itemId}`"
            />
          </template>
          <div class="text-caption text-medium-emphasis">{{ product.itemId }}</div>
        </MpListRow>
      </div>

      <template #footerStart>
        <span class="text-body-2 text-medium-emphasis">{{ pickerSelection.length }} selected</span>
      </template>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="pickerOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="pickerSelection.length === 0" @click="applyPicker">
          Add {{ pickerSelection.length || '' }} product{{ pickerSelection.length === 1 ? '' : 's' }}
        </v-btn>
      </template>
    </MpDialog>

    <MpConfirmDialog
      v-model="cancelGuard"
      title="Discard this collection?"
      message="Your changes haven't been saved. Leaving now discards them."
      confirm-label="Discard changes"
      danger
      @confirm="router.push(listPath)"
    />
  </div>
</template>

<style scoped>
.col-card {
  padding: var(--mp-component-card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.col-rule {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.4fr) var(--mp-component-control-height);
  gap: var(--mp-space-12);
  align-items: start;
}

@media (max-width: 720px) {
  .col-rule {
    grid-template-columns: minmax(0, 1fr) var(--mp-component-control-height);
  }
}

.col-picked {
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  overflow: hidden;
}

.col-seo-preview {
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  padding: var(--mp-space-16);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}

.col-seo-preview__url {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-on-surface-variant));
  overflow-wrap: anywhere;
}

.col-seo-preview__title {
  font-size: var(--mp-fontSize-16);
  color: rgb(var(--v-theme-primary));
}

.col-seo-preview__desc {
  font-size: var(--mp-fontSize-13);
  color: rgb(var(--v-theme-on-surface-variant));
}

.col-picker__filter {
  min-width: 180px;
  max-width: 220px;
}

.col-picker__list {
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  max-height: 380px;
  overflow-y: auto;
}
</style>
