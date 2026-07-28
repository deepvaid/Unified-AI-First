<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommerceStore, type KitComponent, type ProductDraftInput, type PublishStatus } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'

const route = useRoute()
const router = useRouter()
const store = useCommerceStore()

const SALES_CHANNELS = ['Online Store', 'POS', 'Amazon', 'eBay', 'Instagram Shop']

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})
const productsRoute = computed(() => ({ name: 'Products', params: { accountId: accountId.value } }))

const steps = ['Add Product', 'Kit Setup', 'Settings']
const step = ref(1)
const maxStep = ref(1)
const submitted = ref(false)

// ── Step 1 — Add Product ────────────────────────────────────────────────
const title = ref('')
const sku = ref('')
const subtitle = ref('')
const url = ref('')
const description = ref('')

const componentSearch = ref('')
const components = ref<KitComponent[]>([])

const searchResults = computed(() => {
  const q = componentSearch.value.trim().toLowerCase()
  const base = store.products.filter(p => p.type !== 'kit')
  const matched = q ? base.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) : base
  return matched.slice(0, 8)
})

function isPicked(productId: number) {
  return components.value.some(c => c.productId === productId)
}

function addComponent(productId: number) {
  if (isPicked(productId)) return
  const product = store.products.find(p => p.id === productId)
  if (!product) return
  components.value.push({
    productId: product.id,
    name: product.name,
    sku: product.sku,
    qty: 1,
    price: product.price,
    inStock: product.inventory,
  })
}

function removeComponent(productId: number) {
  components.value = components.value.filter(c => c.productId !== productId)
}

// ── Step 3 — Settings ───────────────────────────────────────────────────
const salesChannels = ref<string[]>(['Online Store'])

// ── Derived ─────────────────────────────────────────────────────────────
const titleValid = computed(() => title.value.trim().length > 0)
const kitPrice = computed(() =>
  components.value.reduce((sum, c) => sum + Number(c.price || 0) * c.qty, 0),
)
const buildableUnits = computed(() =>
  components.value.length
    ? Math.min(...components.value.map(c => Math.floor(c.inStock / Math.max(1, c.qty))))
    : 0,
)

// ── Unsaved-changes guard (replaces the old always-on Cancel confirm) ────
const isDirty = computed(() =>
  title.value.trim() !== '' || sku.value.trim() !== '' || subtitle.value.trim() !== ''
  || url.value.trim() !== '' || description.value.trim() !== '' || components.value.length > 0,
)
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Discard this kit?',
  message: "Your changes won't be saved. This can't be undone.",
  confirmLabel: 'Discard',
})

const kitHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'SKU', key: 'sku' },
  { title: 'In Stock', key: 'inStock', align: 'end' as const },
  { title: 'Price', key: 'price', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, width: 64 },
]

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

function save(publishStatus: PublishStatus) {
  submitted.value = true
  if (!titleValid.value) {
    step.value = 1
    return
  }
  const input: ProductDraftInput = {
    name: title.value.trim(),
    sku: sku.value.trim(),
    category: 'Kit',
    vendor: '—',
    price: kitPrice.value.toFixed(2),
    inventory: buildableUnits.value,
    variants: 1,
    type: 'kit',
    publishStatus,
    components: components.value.map(c => ({ ...c })),
    detail: {
      subtitle: subtitle.value.trim(),
      url: url.value.trim(),
      description: description.value.trim(),
      hasVariants: false,
      options: [],
      variantsList: [],
      taxCategory: '',
      material: '',
      brand: '',
      tag: '',
      collection: '',
      categories: [],
      width: '', length: '', height: '', weight: '',
      midCode: '', hsCode: '', countryOfOrigin: '',
      discountable: true,
      salesChannels: [...salesChannels.value],
    },
  }
  store.createProduct(input)
  allowNextLeave()
  router.push({ ...productsRoute.value, query: { flash: publishStatus === 'Draft' ? 'kit-draft' : 'kit-published' } })
}
</script>

<template>
  <div class="mp-frame-fill d-flex flex-column">
    <div class="kw-head px-8 pt-6 pb-4 bg-surface border-b">
      <MpPageHeader
        title="New Kit"
        :subtitle="`Step ${step} of 3 — ${steps[step - 1]}`"
        :back-to="productsRoute"
      >
        <template #actions>
          <v-btn variant="text" class="text-none text-medium-emphasis" @click="router.push(productsRoute)">Cancel</v-btn>
        </template>
        <template #tabs>
          <MpWizardSteps :steps="steps" :current="step" clickable :max-step="maxStep" class="mt-3" @select="goStep" />
        </template>
      </MpPageHeader>
    </div>

    <div class="flex-grow-1 overflow-y-auto pa-8 bg-background">
      <div style="max-width: 920px; margin: 0 auto;">

        <!-- Step 1 — Add Product -->
        <template v-if="step === 1">
          <v-card variant="flat" border rounded="lg" class="pa-6 mb-5">
            <div class="text-subtitle-1 font-weight-bold mb-1">Kit Details</div>
            <div class="text-body-2 text-medium-emphasis mb-5">A kit bundles existing products together into one purchasable item.</div>
            <v-row dense>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="title"
                  label="Kit Title *"
                  variant="outlined"
                  density="comfortable"
                  :error="submitted && !titleValid"
                  :error-messages="submitted && !titleValid ? ['Title is required'] : []"
                />
              </v-col>
              <v-col cols="12" md="4"><v-text-field v-model="sku" label="SKU" placeholder="Auto-generated if blank" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="subtitle" label="Subtitle" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="url" label="Product URL" placeholder="/products/my-kit" prepend-inner-icon="link" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="12"><v-textarea v-model="description" label="Description" rows="3" auto-grow variant="outlined" density="comfortable" /></v-col>
            </v-row>
          </v-card>

          <v-card variant="flat" border rounded="lg" class="pa-6">
            <div class="text-subtitle-1 font-weight-bold mb-1">Kit Components</div>
            <div class="text-body-2 text-medium-emphasis mb-4">Search your catalogue and add products to this kit.</div>
            <v-text-field
              v-model="componentSearch"
              placeholder="Search products by name or SKU"
              prepend-inner-icon="search"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              class="mb-4"
            />
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th class="text-left">Name</th>
                  <th class="text-left">SKU</th>
                  <th class="text-right">In Stock</th>
                  <th class="text-right">Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in searchResults" :key="p.id">
                  <td class="text-body-2 font-weight-medium">{{ p.name }}</td>
                  <td class="text-caption text-medium-emphasis">{{ p.sku }}</td>
                  <td class="text-right">{{ p.inventory }}</td>
                  <td class="text-right">${{ p.price }}</td>
                  <td class="text-right">
                    <v-btn
                      :variant="isPicked(p.id) ? 'text' : 'tonal'"
                      color="primary"
                      size="small"
                      class="text-none"
                      :prepend-icon="isPicked(p.id) ? 'check' : 'plus'"
                      :disabled="isPicked(p.id)"
                      @click="addComponent(p.id)"
                    >{{ isPicked(p.id) ? 'Added' : 'Add' }}</v-btn>
                  </td>
                </tr>
                <tr v-if="!searchResults.length">
                  <td colspan="5" class="text-center text-body-2 text-medium-emphasis py-6">No products match your search.</td>
                </tr>
              </tbody>
            </v-table>

            <div v-if="components.length" class="mt-4">
              <div class="text-subtitle-2 font-weight-bold mb-2">{{ components.length }} component{{ components.length === 1 ? '' : 's' }} added</div>
              <v-chip
                v-for="c in components"
                :key="c.productId"
                closable
                class="ma-1"
                @click:close="removeComponent(c.productId)"
              >{{ c.name }} × {{ c.qty }}</v-chip>
            </div>
          </v-card>
        </template>

        <!-- Step 2 — Kit Setup -->
        <template v-else-if="step === 2">
          <v-card variant="flat" border rounded="lg" class="pa-6 mb-5">
            <div class="text-subtitle-1 font-weight-bold mb-1">Kit Setup</div>
            <div class="text-body-2 text-medium-emphasis mb-4">Set how many of each component belong in one kit.</div>
            <MpEmptyState
              v-if="!components.length"
              icon="package"
              title="No components yet"
              description="Go back to Add Product to include products in this kit."
              class="py-8"
            />
            <v-data-table
              v-else
              :headers="kitHeaders"
              :items="components"
              item-value="productId"
              density="comfortable"
              hide-default-footer
              :items-per-page="-1"
            >
              <template #item.name="{ item }"><span class="text-body-2 font-weight-medium">{{ item.name }}</span></template>
              <template #item.sku="{ item }"><span class="text-caption text-medium-emphasis">{{ item.sku }}</span></template>
              <template #item.inStock="{ item }">{{ item.inStock }}</template>
              <template #item.price="{ item }">
                <div class="d-flex align-center justify-end gap-2">
                  <v-text-field v-model.number="item.qty" type="number" min="1" density="compact" variant="outlined" hide-details style="max-width: 90px;" label="Qty" />
                  <span class="font-weight-medium" style="min-width: 70px; text-align: right;">${{ (Number(item.price) * item.qty).toFixed(2) }}</span>
                </div>
              </template>
              <template #item.actions="{ item }">
                <v-btn icon="trash-2" variant="text" size="small" class="text-medium-emphasis" aria-label="Remove component" @click="removeComponent(item.productId)" />
              </template>
            </v-data-table>
          </v-card>

          <v-card variant="flat" border rounded="lg" class="pa-6">
            <div class="text-subtitle-1 font-weight-bold mb-4">Pricing Summary</div>
            <div class="d-flex justify-space-between py-2 border-b"><span class="text-body-2 text-medium-emphasis">Components</span><span class="font-weight-medium">{{ components.length }}</span></div>
            <div class="d-flex justify-space-between py-2 border-b"><span class="text-body-2 text-medium-emphasis">Buildable units (from stock)</span><span class="font-weight-medium">{{ buildableUnits }}</span></div>
            <div class="d-flex justify-space-between py-2"><span class="text-body-2 font-weight-bold">Kit price</span><span class="text-h6 font-weight-bold">${{ kitPrice.toFixed(2) }}</span></div>
          </v-card>
        </template>

        <!-- Step 3 — Settings -->
        <template v-else>
          <v-card variant="flat" border rounded="lg" class="pa-6">
            <div class="text-subtitle-1 font-weight-bold mb-1">Settings</div>
            <div class="text-body-2 text-medium-emphasis mb-5">Choose where this kit is available. Status is set by the action you take below.</div>
            <v-select v-model="salesChannels" :items="SALES_CHANNELS" label="Sales Channels" variant="outlined" density="comfortable" multiple chips closable-chips class="mb-4" />
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
              Save as Draft keeps this kit hidden; Publish makes it available on the selected channels.
            </v-alert>
          </v-card>
        </template>

      </div>
    </div>

    <div class="px-8 py-4 border-t bg-surface d-flex justify-space-between align-center">
      <div class="d-flex align-center gap-2">
        <v-btn variant="text" class="text-none" @click="router.push(productsRoute)">Cancel</v-btn>
        <v-btn v-if="step > 1" variant="text" class="text-none" prepend-icon="arrow-left" @click="prevStep">Back</v-btn>
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn variant="outlined" class="text-none" :disabled="!titleValid" @click="save('Draft')">Save as Draft</v-btn>
        <v-btn v-if="step < 3" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="step === 1 && !titleValid" @click="nextStep">Continue</v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="check" :disabled="!titleValid" @click="save('Published')">Publish</v-btn>
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
.kw-head :deep(.mp-page-header) { margin-bottom: 0; }
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
</style>
