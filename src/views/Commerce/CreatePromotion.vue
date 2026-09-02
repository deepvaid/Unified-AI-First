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
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpAlert from '@/components/MpAlert.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'

const route = useRoute()
const router = useRouter()
const store = useCommerceStore()

const SALES_CHANNELS = ['Online Store', 'POS', 'Amazon', 'eBay', 'Instagram Shop']

const MECHANISM_ITEMS = [
  { value: 'Code', label: 'Discount code' },
  { value: 'Automatic', label: 'Automatic' },
]
const STATUS_ITEMS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

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

// ── Unsaved-changes guard (replaces the old always-on Cancel confirm) ────
function serializeForm() {
  return JSON.stringify([
    title.value, description.value, method.value, mechanism.value, code.value,
    discountType.value, value.value, startDate.value, endDate.value, status.value, salesChannels.value,
  ])
}
const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Discard this promotion?',
  message: "Your changes won't be saved. This can't be undone.",
  confirmLabel: 'Discard',
})

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
  allowNextLeave()
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
  savedSnapshot.value = serializeForm()
})
</script>

<template>
  <div class="mp-frame-fill d-flex flex-column">
    <!-- Header -->
    <div class="px-8 pt-6 pb-4 bg-surface cp-border-b">
      <MpPageHeader
        density="compact"
        :title="isEdit ? 'Edit Promotion' : 'New Promotion'"
        subtitle="Discounts apply on the sales channels you choose, between the start and end dates."
        :back-to="promotionsRoute"
      >
        <template #actions>
          <v-btn variant="text" class="text-none text-medium-emphasis" @click="router.push(promotionsRoute)">Cancel</v-btn>
        </template>
      </MpPageHeader>
    </div>

    <!-- Content -->
    <div class="flex-grow-1 overflow-y-auto pa-8 bg-background">
      <div class="d-flex flex-column ga-5 cp-body">

        <!-- General -->
        <v-card variant="flat" border rounded="lg" class="pa-6">
          <MpSectionHeader title="General" description="Name this promotion so your team can recognise it." />
          <MpFormGrid>
            <v-text-field
              v-model="title"
              label="Title *"
              placeholder="e.g. Summer sale 15% off"
              :error="submitted && !titleValid"
              :error-messages="submitted && !titleValid ? ['Title is required'] : []"
            />
            <v-textarea v-model="description" label="Description" rows="3" auto-grow />
          </MpFormGrid>
        </v-card>

        <!-- Discount method -->
        <v-card variant="flat" border rounded="lg" class="pa-6">
          <MpSectionHeader title="Discount method" description="What does this promotion discount?" />
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
        <v-card variant="flat" border rounded="lg" class="pa-6">
          <MpSectionHeader title="Details" description="How customers get the discount, how big it is, and when it runs." />

          <MpFormSection title="Mechanism" />
          <MpFormGrid>
            <MpFormField label="How the discount is applied">
              <div>
                <MpSegmentedControl
                  :model-value="mechanism"
                  :items="MECHANISM_ITEMS"
                  ariaLabel="How the discount is applied"
                  @update:model-value="(v) => { if (v) mechanism = v as PromotionMechanism }"
                />
              </div>
            </MpFormField>

            <div v-if="mechanism === 'Code'" class="mp-form-grid__trailing">
              <v-text-field
                v-model="code"
                label="Discount code *"
                placeholder="e.g. SUMMER15"
                class="font-mono-field"
                :error="submitted && !codeValid"
                :error-messages="submitted && !codeValid ? ['A code is required for code promotions'] : []"
                hint="Customers enter this at checkout"
                persistent-hint
              />
              <v-btn
                icon
                variant="text"
                size="small"
                class="text-medium-emphasis"
                aria-label="Generate a discount code"
                @click="generateCode"
              >
                <v-icon size="18">refresh-cw</v-icon>
                <v-tooltip activator="parent" location="top">Generate a code</v-tooltip>
              </v-btn>
            </div>
            <MpAlert v-else tone="info">
              Applies automatically at checkout — customers don't need a code.
            </MpAlert>
          </MpFormGrid>

          <MpFormSection title="Discount" />
          <MpFormGrid :cols="2">
            <v-select
              v-model="discountType"
              label="Discount type"
              :items="['Percentage', 'Fixed']"
            />
            <v-text-field
              v-model.number="value"
              :label="discountType === 'Percentage' ? 'Value (%)' : 'Value ($)'"
              type="number"
              min="0"
              :prefix="discountType === 'Fixed' ? '$' : undefined"
              :suffix="discountType === 'Percentage' ? '%' : undefined"
            />

            <!-- Live preview sentence -->
            <v-card color="primary" variant="tonal" rounded="lg" class="mp-form-grid__full pa-3 d-flex align-center gap-2">
              <v-icon size="18">eye</v-icon>
              <span class="text-body-2 font-weight-medium">{{ previewSentence }}</span>
            </v-card>
          </MpFormGrid>

          <MpFormSection title="Schedule" />
          <MpFormGrid :cols="2">
            <v-text-field v-model="startDate" label="Start date" type="date" />
            <v-text-field v-model="endDate" label="End date" type="date" hint="Leave blank to run indefinitely" persistent-hint />
          </MpFormGrid>

          <MpFormSection title="Status" />
          <MpFormGrid>
            <MpFormField label="Promotion status">
              <div>
                <MpSegmentedControl
                  :model-value="status"
                  :items="STATUS_ITEMS"
                  ariaLabel="Promotion status"
                  @update:model-value="(v) => { if (v) status = v as PromotionStatus }"
                />
              </div>
            </MpFormField>
          </MpFormGrid>
        </v-card>

        <!-- Sales channels -->
        <v-card variant="flat" border rounded="lg" class="pa-6">
          <MpSectionHeader
            title="Sales channels *"
            description="The discount is applicable only on the sales channels you select."
          />
          <MpFormGrid>
            <v-select
              v-model="salesChannels"
              label="Sales channels *"
              :items="SALES_CHANNELS"
              multiple
              chips
              closable-chips
              :error="submitted && !channelsValid"
              :error-messages="submitted && !channelsValid ? ['Select at least one sales channel'] : []"
            />
          </MpFormGrid>
        </v-card>
      </div>
    </div>

    <!-- Sticky footer -->
    <div class="px-8 py-4 cp-border-t bg-surface d-flex justify-space-between align-center">
      <v-btn variant="text" class="text-none" @click="router.push(promotionsRoute)">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="save">Save promotion</v-btn>
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
/* Own class names, so no !important is needed to beat Vuetify's .border-b/.border-t utilities. */
.cp-border-b { border-bottom: 1px solid var(--border-subtle); }
.cp-border-t { border-top: 1px solid var(--border-subtle); }

/* Reading measure for a single-column form; a layout.formMaxWidth token is proposed. */
.cp-body { max-width: 760px; margin: 0 auto; }

.font-mono-field :deep(input) { font-family: var(--mp-fontFamily-mono); text-transform: uppercase; }
</style>
