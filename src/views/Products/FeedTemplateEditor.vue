<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useProductExtrasStore, CATALOG_SOURCES, CATALOG_CATEGORIES,
  type TemplateInput, type TemplateMethod, type CatalogProduct,
} from '@/stores/useProductExtras'
import { useToast } from '@/composables/useToast'
import MpAlert from '@/components/MpAlert.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpListRow from '@/components/MpListRow.vue'

/**
 * Feed template editor — live block preview on the left, configuration rail on
 * the right, matching UAT's `/product_feed_templates/new`.
 */
const store = useProductExtrasStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const listPath = computed(() => `/commerce/${accountId.value}/product_recommendations/product_feed_templates`)

const templateId = computed(() => {
  const raw = route.params.templateId
  return raw === undefined ? null : Number(raw)
})
const isEdit = computed(() => templateId.value !== null)

const MAX_ROWS = 3
const MAX_COLUMNS = 3

const emptyForm = (): TemplateInput => ({
  name: '', rows: 1, columns: 3, method: 'feed', feedId: null, productItemIds: [],
  includeImage: true, includeName: true, includePrice: true, includeButton: true,
  buttonText: 'Buy Now', buttonTextColor: '#FFFFFF', buttonBgColor: '#000000',
})

const form = ref<TemplateInput>(emptyForm())
const snapshot = ref('')

function load() {
  if (templateId.value === null) {
    form.value = emptyForm()
  } else {
    const template = store.feedTemplates.find((t) => t.id === templateId.value)
    if (!template) {
      router.replace(listPath.value)
      return
    }
    form.value = {
      name: template.name,
      rows: template.rows,
      columns: template.columns,
      method: template.method,
      feedId: template.feedId,
      productItemIds: [...template.productItemIds],
      includeImage: template.includeImage,
      includeName: template.includeName,
      includePrice: template.includePrice,
      includeButton: template.includeButton,
      buttonText: template.buttonText,
      // Stored as 8-digit hex (UAT keeps the alpha pair); the picker wants 6.
      buttonTextColor: template.buttonTextColor.slice(0, 7),
      buttonBgColor: template.buttonBgColor.slice(0, 7),
    }
  }
  snapshot.value = JSON.stringify(form.value)
}
load()
watch(() => route.fullPath, load)

const dirty = computed(() => JSON.stringify(form.value) !== snapshot.value)
const valid = computed(() =>
  form.value.name.trim().length > 0
  && (form.value.method === 'feed' ? form.value.feedId !== null : form.value.productItemIds.length > 0),
)

const feedOptions = computed(() => store.productFeeds.map((f) => ({ title: f.name, value: f.id })))

// ── Preview ─────────────────────────────────────────────────────────
const previewProducts = ref(false)
const previewDevice = ref<'desktop' | 'mobile'>('desktop')

const selectedProducts = computed<CatalogProduct[]>(() =>
  form.value.productItemIds
    .map((id) => store.catalog.find((p) => p.itemId === id))
    .filter((p): p is CatalogProduct => Boolean(p)),
)

/** Cells rendered in the preview grid — real products when previewing, else merge tags. */
const previewCells = computed(() => {
  const count = form.value.rows * form.value.columns
  const source = form.value.method === 'manual'
    ? selectedProducts.value
    : store.catalog.filter((p) => p.name)
  return Array.from({ length: count }, (_, i) => {
    const product = previewProducts.value ? source[i % Math.max(1, source.length)] : undefined
    return {
      key: i,
      name: previewProducts.value ? (product?.name ?? '—') : `{{products[${i}].name}}`,
      price: previewProducts.value ? `$${(product?.price ?? 0).toFixed(2)}` : `\${{products[${i}].price}}`,
      image: previewProducts.value ? (product?.imageUrl ?? '') : '',
    }
  })
})

// ── Manual product picker ───────────────────────────────────────────
const pickerOpen = ref(false)
const pickerSearch = ref('')
const pickerSource = ref<'All' | string>('All')
const pickerCategory = ref<string[]>([])
const pickerSelection = ref<string[]>([])

const pickerResults = computed(() => {
  const term = pickerSearch.value.trim().toLowerCase()
  return store.catalog.filter((p) => {
    const byTerm = !term || p.name.toLowerCase().includes(term) || p.itemId.toLowerCase().includes(term)
    const bySource = pickerSource.value === 'All' || p.source === pickerSource.value
    const byCategory = pickerCategory.value.length === 0 || p.categories.some((c) => pickerCategory.value.includes(c))
    return byTerm && bySource && byCategory
  })
})

function openPicker() {
  pickerSelection.value = [...form.value.productItemIds]
  pickerSearch.value = ''
  pickerSource.value = 'All'
  pickerCategory.value = []
  pickerOpen.value = true
}

function clearPickerFilters() {
  pickerSearch.value = ''
  pickerSource.value = 'All'
  pickerCategory.value = []
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
  const payload: TemplateInput = {
    ...form.value,
    name: form.value.name.trim(),
    productItemIds: form.value.method === 'manual' ? form.value.productItemIds : [],
    feedId: form.value.method === 'feed' ? form.value.feedId : null,
  }
  if (templateId.value !== null) {
    store.updateTemplate(templateId.value, payload)
    toast.success('Feed template updated')
  } else {
    store.addTemplate(payload)
    toast.success('Feed template created')
  }
  saving.value = false
  snapshot.value = JSON.stringify(form.value)
  router.push(listPath.value)
}

function setMethod(method: TemplateMethod) {
  form.value.method = method
}

function stepRows(delta: number) {
  form.value.rows = Math.min(MAX_ROWS, Math.max(1, form.value.rows + delta))
}

function stepColumns(delta: number) {
  form.value.columns = Math.min(MAX_COLUMNS, Math.max(1, form.value.columns + delta))
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="My Product Recommendations"
      :title="isEdit ? 'Edit feed template' : 'New feed template'"
      subtitle="Lay out how recommended products render inside an email."
      :back-to="listPath"
    >
      <template #actions>
        <v-btn variant="text" class="text-none" :disabled="saving" @click="requestCancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :loading="saving" :disabled="!valid" @click="save">
          {{ isEdit ? 'Save changes' : 'Create template' }}
        </v-btn>
      </template>
    </MpPageHeader>

    <v-row class="flex-grow-1" no-gutters>
      <!-- ── Preview ─────────────────────────────────────────────── -->
      <v-col cols="12" md="8" class="pr-md-4">
        <v-card variant="flat" border rounded="lg" class="h-100 d-flex flex-column tpl-card">
          <div class="d-flex flex-wrap align-center ga-4">
            <v-switch
              v-model="previewProducts"
              hide-details
              density="compact"
              label="Preview with real products"
            />
            <v-tooltip location="top" text="Off shows the merge tags the email will contain; on renders sample catalog products.">
              <template #activator="{ props: tip }">
                <v-icon v-bind="tip" size="16" class="text-medium-emphasis" tabindex="0" role="img"
                        aria-label="Off shows the merge tags the email will contain; on renders sample catalog products.">info</v-icon>
              </template>
            </v-tooltip>
            <v-spacer />
            <v-btn-toggle v-model="previewDevice" mandatory density="comfortable" variant="outlined" divided>
              <v-btn value="desktop" icon="monitor" aria-label="Desktop preview" size="small" />
              <v-btn value="mobile" icon="smartphone" aria-label="Mobile preview" size="small" />
            </v-btn-toggle>
          </div>

          <div class="tpl-stage flex-grow-1">
            <div class="tpl-frame" :class="`tpl-frame--${previewDevice}`">
              <div
                class="tpl-grid"
                :style="{ gridTemplateColumns: `repeat(${previewDevice === 'mobile' ? 1 : form.columns}, minmax(0, 1fr))` }"
              >
                <div v-for="cell in previewCells" :key="cell.key" class="tpl-cell">
                  <div v-if="form.includeImage" class="tpl-cell__media">
                    <v-img v-if="cell.image" :src="cell.image" cover height="112" :alt="''">
                      <template #error><div class="tpl-cell__placeholder"><v-icon size="20">image</v-icon></div></template>
                    </v-img>
                    <div v-else class="tpl-cell__placeholder"><v-icon size="20">image</v-icon></div>
                  </div>
                  <div v-if="form.includeName" class="tpl-cell__name">{{ cell.name }}</div>
                  <div v-if="form.includePrice" class="tpl-cell__price">{{ cell.price }}</div>
                  <div
                    v-if="form.includeButton"
                    class="tpl-cell__button"
                    :style="{ background: form.buttonBgColor, color: form.buttonTextColor }"
                  >
                    {{ form.buttonText || 'Buy Now' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Parity: UAT shows this Merchandising Cloud upsell inside the editor. -->
          <div class="tpl-upsell">
            <div>
              <div class="tpl-upsell__title">Unlock the full power of Merchandising Cloud</div>
              <p class="tpl-upsell__copy">
                Personalized recommendations, automated product suggestions, smart filtering and
                brand-level styling — beyond what feed templates cover.
              </p>
            </div>
            <v-btn variant="outlined" class="text-none flex-shrink-0" append-icon="arrow-up-right">Book a demo</v-btn>
          </div>
        </v-card>
      </v-col>

      <!-- ── Configuration rail ──────────────────────────────────── -->
      <v-col cols="12" md="4" class="mt-4 mt-md-0">
        <v-card variant="flat" border rounded="lg" class="h-100 tpl-card tpl-rail">
          <MpFormSection title="Template" required />
          <v-text-field
            v-model="form.name"
            label="Product feed template name *"
            :error-messages="form.name.trim() ? [] : ['Name is required']"
          />

          <MpFormSection title="Products" description="Choose how this template picks the products it renders." />
          <MpFormField label="Method of adding products">
            <template #default="{ labelId }">
              <div class="d-flex ga-2" role="group" :aria-labelledby="labelId">
                <v-btn
                  :variant="form.method === 'feed' ? 'flat' : 'outlined'"
                  :color="form.method === 'feed' ? 'primary' : undefined"
                  class="text-none flex-grow-1"
                  prepend-icon="list-filter"
                  :aria-pressed="form.method === 'feed'"
                  @click="setMethod('feed')"
                >
                  Product feed
                </v-btn>
                <v-btn
                  :variant="form.method === 'manual' ? 'flat' : 'outlined'"
                  :color="form.method === 'manual' ? 'primary' : undefined"
                  class="text-none flex-grow-1"
                  prepend-icon="hand"
                  :aria-pressed="form.method === 'manual'"
                  @click="setMethod('manual')"
                >
                  Manual selection
                </v-btn>
              </div>
            </template>
          </MpFormField>

          <template v-if="form.method === 'feed'">
            <v-select
              v-model="form.feedId"
              :items="feedOptions"
              label="Product feed *"
              :error-messages="form.feedId !== null ? [] : ['Choose the feed this template renders']"
            />
          </template>

          <template v-else>
            <MpAlert tone="info" live="off">
              Manually selected products stay fixed when the email sends, whatever changes to their
              availability or attributes.
            </MpAlert>
            <v-btn variant="outlined" prepend-icon="plus" class="text-none" block @click="openPicker">
              Add products
            </v-btn>
            <div v-if="selectedProducts.length" class="tpl-picked">
              <MpListRow
                v-for="product in selectedProducts"
                :key="product.itemId"
                variant="divided"
                :title="product.name || product.itemId"
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
            <p v-else class="text-caption text-medium-emphasis">No products selected yet.</p>
          </template>

          <MpFormSection title="Block layout" />
          <MpFormField label="Rows" :hint="`Up to ${MAX_ROWS}`">
            <template #default="{ labelId, descriptionId }">
              <div class="tpl-stepper" :aria-labelledby="labelId" :aria-describedby="descriptionId">
                <v-btn icon="minus" size="small" variant="text" aria-label="One row fewer" :disabled="form.rows <= 1" @click="stepRows(-1)" />
                <span class="tpl-stepper__value">{{ form.rows }}</span>
                <v-btn icon="plus" size="small" variant="text" aria-label="One row more" :disabled="form.rows >= MAX_ROWS" @click="stepRows(1)" />
              </div>
            </template>
          </MpFormField>
          <MpFormField label="Columns" :hint="`Up to ${MAX_COLUMNS}`">
            <template #default="{ labelId, descriptionId }">
              <div class="tpl-stepper" :aria-labelledby="labelId" :aria-describedby="descriptionId">
                <v-btn icon="minus" size="small" variant="text" aria-label="One column fewer" :disabled="form.columns <= 1" @click="stepColumns(-1)" />
                <span class="tpl-stepper__value">{{ form.columns }}</span>
                <v-btn icon="plus" size="small" variant="text" aria-label="One column more" :disabled="form.columns >= MAX_COLUMNS" @click="stepColumns(1)" />
              </div>
            </template>
          </MpFormField>

          <MpFormSection title="Product layout" />
          <MpFormField label="Elements to include">
            <template #default="{ labelId }">
              <div class="d-flex flex-column" :aria-labelledby="labelId">
                <v-checkbox v-model="form.includeImage" label="Product image" hide-details density="compact" />
                <v-checkbox v-model="form.includeName" label="Product name" hide-details density="compact" />
                <v-checkbox v-model="form.includePrice" label="Product price" hide-details density="compact" />
                <v-checkbox v-model="form.includeButton" label="Button" hide-details density="compact" />
              </div>
            </template>
          </MpFormField>

          <template v-if="form.includeButton">
            <MpFormSection title="Button styling" />
            <v-text-field v-model="form.buttonText" label="Button text" placeholder="Buy Now" />
            <MpFormGrid :cols="2">
              <MpFormField label="Text colour">
                <template #default="{ labelId }">
                  <div class="tpl-color">
                    <input v-model="form.buttonTextColor" type="color" class="tpl-color__swatch" :aria-labelledby="labelId">
                    <span class="tpl-color__value">{{ form.buttonTextColor.toUpperCase() }}</span>
                  </div>
                </template>
              </MpFormField>
              <MpFormField label="Background colour">
                <template #default="{ labelId }">
                  <div class="tpl-color">
                    <input v-model="form.buttonBgColor" type="color" class="tpl-color__swatch" :aria-labelledby="labelId">
                    <span class="tpl-color__value">{{ form.buttonBgColor.toUpperCase() }}</span>
                  </div>
                </template>
              </MpFormField>
            </MpFormGrid>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Manual product picker ───────────────────────────────────── -->
    <MpDialog v-model="pickerOpen" title="Select products" subtitle="Pick the exact products this template renders" size="lg">
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
        <v-select v-model="pickerSource" :items="['All', ...CATALOG_SOURCES]" label="Source" hide-details class="tpl-picker__filter" />
        <v-select v-model="pickerCategory" :items="CATALOG_CATEGORIES" label="Categories" multiple chips closable-chips hide-details class="tpl-picker__filter" />
        <v-btn variant="text" class="text-none align-self-center" @click="clearPickerFilters">Clear</v-btn>
      </div>

      <div class="tpl-picker__list">
        <MpEmptyState
          v-if="pickerResults.length === 0"
          icon="search-x"
          title="No products match those filters"
          description="Try a different term, or clear the source and category filters."
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
      title="Discard this template?"
      message="Your changes to this feed template haven't been saved. Leaving now discards them."
      confirm-label="Discard changes"
      danger
      @confirm="router.push(listPath)"
    />
  </div>
</template>

<style scoped>
.tpl-card {
  padding: var(--mp-component-card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.tpl-rail {
  gap: 0;
  overflow-y: auto;
}

.tpl-stage {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--mp-space-24);
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--mp-radius-12);
}

.tpl-frame {
  width: 100%;
  background: rgb(var(--v-theme-surface));
  border-radius: var(--mp-radius-12);
  padding: var(--mp-space-16);
}

.tpl-frame--mobile {
  max-width: 375px;
}

.tpl-grid {
  display: grid;
  gap: var(--mp-space-12);
}

.tpl-cell {
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  padding: var(--mp-space-12);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  text-align: center;
  color: rgb(var(--v-theme-on-surface));
}

.tpl-cell__media {
  border-radius: var(--mp-radius-8);
  overflow: hidden;
}

.tpl-cell__placeholder {
  height: 112px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
}

.tpl-cell__name {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  overflow-wrap: anywhere;
}

.tpl-cell__price {
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-on-surface-variant));
  overflow-wrap: anywhere;
}

.tpl-cell__button {
  border-radius: var(--mp-radius-full);
  padding: var(--mp-space-8) var(--mp-space-12);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
}

.tpl-upsell {
  display: flex;
  align-items: center;
  gap: var(--mp-space-16);
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-12);
  padding: var(--mp-component-card-padding);
}

.tpl-upsell__title {
  font-size: var(--mp-fontSize-15);
  font-weight: var(--mp-fontWeight-semibold);
}

.tpl-upsell__copy {
  margin: var(--mp-space-4) 0 0;
  font-size: var(--mp-fontSize-13);
  color: rgb(var(--v-theme-on-surface-variant));
}

.tpl-picked {
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  overflow: hidden;
}

.tpl-stepper {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  padding: 0 var(--mp-space-4);
  min-height: var(--mp-component-control-height);
}

.tpl-stepper__value {
  min-width: var(--mp-space-24);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.tpl-color {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  min-height: var(--mp-component-control-height);
}

.tpl-color__swatch {
  inline-size: var(--mp-space-32);
  block-size: var(--mp-space-32);
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-8);
  background: none;
  padding: 0;
  cursor: pointer;
}

.tpl-color__value {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
}

.tpl-picker__filter {
  min-width: 180px;
  max-width: 220px;
}

.tpl-picker__list {
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  max-height: 380px;
  overflow-y: auto;
}
</style>
