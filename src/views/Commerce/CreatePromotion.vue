<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useCommerceStore,
  type PromotionMethod,
  type PromotionMechanism,
  type PromotionDiscountType,
  type PromotionStatus,
  type PromotionInput,
} from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useCommerceStore()

const SALES_CHANNELS = ['Online Store', 'POS', 'Amazon', 'eBay', 'Instagram Shop']

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const promotionsRoute = computed(() => ({ name: 'Promotions', params: { accountId: accountId.value } }))

const editingId = computed(() => {
  const raw = route.params.promoId
  const value = Array.isArray(raw) ? raw[0] : raw
  return value ? Number(value) : null
})
const isEdit = computed(() => editingId.value !== null)

// ── Form state ──────────────────────────────────────────────────────────
const title = ref('')
const description = ref('')
const method = ref<PromotionMethod>('Order')
const mechanism = ref<PromotionMechanism>('Code')
const code = ref('')
const discountType = ref<PromotionDiscountType>('Percentage')
const value = ref<number>(15)
const startDate = ref(new Date().toISOString().split('T')[0]!)
const endDate = ref('')
const status = ref<PromotionStatus>('Active')
const salesChannels = ref<string[]>([])

const confirmCancel = ref(false)
const submitted = ref(false)

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  code.value = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ── Live preview sentence (fixes legacy hidden-Details pain) ────────────
const previewSentence = computed(() => {
  const amount = discountType.value === 'Percentage' ? `${value.value || 0}%` : `$${value.value || 0}`
  const target = method.value === 'Order' ? 'their order subtotal' : 'selected products'
  const how = mechanism.value === 'Code'
    ? `when they enter code ${code.value.trim() || '…'}`
    : 'automatically at checkout'
  return `Customers get ${amount} off ${target} ${how}.`
})

// ── Validation ──────────────────────────────────────────────────────────
const titleValid = computed(() => title.value.trim().length > 0)
const codeValid = computed(() => mechanism.value !== 'Code' || code.value.trim().length > 0)
const valueValid = computed(() => value.value > 0 || (mechanism.value === 'Automatic' && value.value === 0))
const channelsValid = computed(() => salesChannels.value.length > 0)
const formValid = computed(() => titleValid.value && codeValid.value && valueValid.value && channelsValid.value)

// ── Persistence ─────────────────────────────────────────────────────────
function save() {
  submitted.value = true
  if (!formValid.value) return
  const input: PromotionInput = {
    title: title.value.trim(),
    description: description.value.trim() || undefined,
    method: method.value,
    mechanism: mechanism.value,
    code: mechanism.value === 'Code' ? code.value.trim().toUpperCase() : undefined,
    discountType: discountType.value,
    value: Number(value.value) || 0,
    salesChannels: [...salesChannels.value],
    startDate: startDate.value,
    endDate: endDate.value || undefined,
    status: status.value,
    limit: isEdit.value ? store.promotions.find(p => p.id === editingId.value)?.limit ?? null : null,
  }
  if (isEdit.value && editingId.value !== null) {
    store.updatePromotion(editingId.value, input)
    router.push({ ...promotionsRoute.value, query: { flash: 'promotion-updated' } })
  } else {
    store.createPromotion(input)
    router.push({ ...promotionsRoute.value, query: { flash: 'promotion-created' } })
  }
}

// ── Load for edit ───────────────────────────────────────────────────────
onMounted(() => {
  if (!isEdit.value) return
  const promotion = store.promotions.find(p => p.id === editingId.value)
  if (!promotion) return
  title.value = promotion.title
  description.value = promotion.description ?? ''
  method.value = promotion.method
  mechanism.value = promotion.mechanism
  code.value = promotion.code ?? ''
  discountType.value = promotion.discountType
  value.value = promotion.value
  startDate.value = promotion.startDate
  endDate.value = promotion.endDate ?? ''
  status.value = promotion.status
  salesChannels.value = [...promotion.salesChannels]
})
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <!-- Header -->
    <div class="cp-head px-8 pt-6 pb-4 bg-surface border-b">
      <MpPageHeader
        :title="isEdit ? 'Edit Promotion' : 'New Promotion'"
        subtitle="Discounts apply on the sales channels you choose, between the start and end dates."
        :back-to="promotionsRoute"
      >
        <template #actions>
          <v-btn variant="text" class="text-none text-medium-emphasis" @click="confirmCancel = true">Cancel</v-btn>
        </template>
      </MpPageHeader>
    </div>

    <!-- Content -->
    <div class="flex-grow-1 overflow-y-auto pa-8 bg-background">
      <div style="max-width: 760px; margin: 0 auto;">

        <!-- General -->
        <v-card variant="flat" border rounded="lg" class="pa-6 mb-5">
          <div class="text-subtitle-1 font-weight-bold mb-1">General</div>
          <div class="text-body-2 text-medium-emphasis mb-5">Name this promotion so your team can recognise it.</div>
          <v-text-field
            v-model="title"
            label="Title *"
            variant="outlined"
            density="comfortable"
            placeholder="e.g. Summer sale 15% off"
            :error="submitted && !titleValid"
            :error-messages="submitted && !titleValid ? ['Title is required'] : []"
            class="mb-3"
          />
          <v-textarea v-model="description" label="Description" variant="outlined" density="comfortable" rows="2" auto-grow hide-details />
        </v-card>

        <!-- Discount method -->
        <v-card variant="flat" border rounded="lg" class="pa-6 mb-5">
          <div class="text-subtitle-1 font-weight-bold mb-1">Discount method</div>
          <div class="text-body-2 text-medium-emphasis mb-5">What does this promotion discount?</div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <MpOptionCard
                :selected="method === 'Order'"
                title="Order discount"
                description="Discount the whole order subtotal — best for storewide sales and cart incentives."
                icon="shopping-cart"
                class="h-100"
                @click="method = 'Order'"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <MpOptionCard
                :selected="method === 'Product'"
                title="Product discount"
                description="Discount specific products or collections — best for clearing stock or featuring lines."
                icon="package"
                class="h-100"
                @click="method = 'Product'"
              />
            </v-col>
          </v-row>
        </v-card>

        <!-- Details (always visible — legacy hid this until a method was chosen) -->
        <v-card variant="flat" border rounded="lg" class="pa-6 mb-5">
          <div class="text-subtitle-1 font-weight-bold mb-1">Details</div>
          <div class="text-body-2 text-medium-emphasis mb-5">How customers get the discount, how big it is, and when it runs.</div>

          <div class="text-subtitle-2 font-weight-bold mb-2">Mechanism</div>
          <v-btn-toggle v-model="mechanism" mandatory divided variant="outlined" density="comfortable" class="mb-4">
            <v-btn value="Code" class="text-none" prepend-icon="ticket">Discount code</v-btn>
            <v-btn value="Automatic" class="text-none" prepend-icon="zap">Automatic</v-btn>
          </v-btn-toggle>

          <div v-if="mechanism === 'Code'" class="d-flex gap-3 mb-4">
            <v-text-field
              v-model="code"
              label="Discount code *"
              variant="outlined"
              density="comfortable"
              placeholder="e.g. SUMMER15"
              class="flex-grow-1 font-mono-field"
              :error="submitted && !codeValid"
              :error-messages="submitted && !codeValid ? ['A code is required for code promotions'] : []"
              hint="Customers enter this at checkout"
              persistent-hint
            />
            <v-btn variant="outlined" class="text-none cp-generate-btn" prepend-icon="refresh-cw" @click="generateCode">Generate</v-btn>
          </div>
          <v-alert v-else type="info" variant="tonal" density="compact" class="mb-4 text-body-2">
            Applies automatically at checkout — customers don't need a code.
          </v-alert>

          <div class="text-subtitle-2 font-weight-bold mb-2">Discount</div>
          <v-row dense class="mb-1">
            <v-col cols="6">
              <v-select
                v-model="discountType"
                label="Discount type"
                :items="['Percentage', 'Fixed']"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="value"
                :label="discountType === 'Percentage' ? 'Value (%)' : 'Value ($)'"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                :prefix="discountType === 'Fixed' ? '$' : undefined"
                :suffix="discountType === 'Percentage' ? '%' : undefined"
              />
            </v-col>
          </v-row>

          <!-- Live preview sentence -->
          <v-card color="primary" variant="tonal" rounded="lg" class="pa-3 mb-5 d-flex align-center gap-2">
            <v-icon size="18">eye</v-icon>
            <span class="text-body-2 font-weight-medium">{{ previewSentence }}</span>
          </v-card>

          <div class="text-subtitle-2 font-weight-bold mb-2">Schedule</div>
          <v-row dense class="mb-1">
            <v-col cols="6">
              <v-text-field v-model="startDate" label="Start date" type="date" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="endDate" label="End date" type="date" variant="outlined" density="comfortable" hint="Leave blank to run indefinitely" persistent-hint />
            </v-col>
          </v-row>

          <div class="text-subtitle-2 font-weight-bold mb-2 mt-3">Status</div>
          <v-btn-toggle v-model="status" mandatory divided variant="outlined" density="comfortable">
            <v-btn value="Active" class="text-none" prepend-icon="play">Active</v-btn>
            <v-btn value="Inactive" class="text-none" prepend-icon="pause">Inactive</v-btn>
          </v-btn-toggle>
        </v-card>

        <!-- Sales channels -->
        <v-card variant="flat" border rounded="lg" class="pa-6 mb-5">
          <div class="text-subtitle-1 font-weight-bold mb-1">Sales channels *</div>
          <div class="text-body-2 text-medium-emphasis mb-5">The discount is applicable only on the sales channels you select.</div>
          <v-select
            v-model="salesChannels"
            label="Sales channels"
            :items="SALES_CHANNELS"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="comfortable"
            :error="submitted && !channelsValid"
            :error-messages="submitted && !channelsValid ? ['Select at least one sales channel'] : []"
          />
        </v-card>
      </div>
    </div>

    <!-- Sticky footer -->
    <div class="px-8 py-4 border-t bg-surface d-flex justify-space-between align-center">
      <v-btn variant="text" class="text-none" @click="confirmCancel = true">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="save">Save promotion</v-btn>
    </div>

    <MpConfirmDialog
      v-model="confirmCancel"
      title="Discard this promotion?"
      message="Your changes won't be saved. This can't be undone."
      confirm-label="Discard"
      danger
      @confirm="router.push(promotionsRoute)"
    />
  </div>
</template>

<style scoped>
.cp-head :deep(.mp-page-header) { margin-bottom: 0; }
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.font-mono-field :deep(input) { font-family: monospace; text-transform: uppercase; }
.cp-generate-btn { height: 56px; }
</style>
