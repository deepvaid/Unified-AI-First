<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useProductExtrasStore, PRICING_ATTRIBUTES, PRICING_OPERATORS, PRICING_ADJUSTMENTS,
  type PricingInput,
} from '@/stores/useProductExtras'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useContactsStore } from '@/stores/useContacts'
import { useToast } from '@/composables/useToast'
import MpAlert from '@/components/MpAlert.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * Price list editor — the scheduled pricing configuration behind a price list.
 * Mirrors UAT's "New Pricing Configuration" page.
 */
const store = useProductExtrasStore()
const salesChannels = useSalesChannelsStore()
const contacts = useContactsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const listPath = computed(() => `/commerce/${accountId.value}/price-lists`)

const configId = computed(() => {
  const raw = route.params.priceListId
  return raw === undefined ? null : Number(raw)
})
const isEdit = computed(() => configId.value !== null)

const emptyForm = (): PricingInput => ({
  title: '', description: '', salesChannel: '',
  audienceAttribute: 'Contact Lists', audienceOperator: 'Equal', audienceValue: '',
  startDate: '', startTime: '', endDate: '', endTime: '',
  adjustment: 'Increase', percentage: 0, status: 'Draft',
})

const form = ref<PricingInput>(emptyForm())
const snapshot = ref('')

function load() {
  if (configId.value === null) {
    form.value = emptyForm()
  } else {
    const config = store.pricingConfigurations.find((p) => p.id === configId.value)
    if (!config) {
      router.replace(listPath.value)
      return
    }
    form.value = {
      title: config.title,
      description: config.description,
      salesChannel: config.salesChannel,
      audienceAttribute: config.audienceAttribute,
      audienceOperator: config.audienceOperator,
      audienceValue: config.audienceValue,
      startDate: config.startDate,
      startTime: config.startTime,
      endDate: config.endDate,
      endTime: config.endTime,
      adjustment: config.adjustment,
      percentage: config.percentage,
      status: config.status,
    }
  }
  snapshot.value = JSON.stringify(form.value)
}
load()
watch(() => route.fullPath, load)

const channelOptions = computed(() => {
  const names = salesChannels.channelsForAccount(accountId.value).map((c) => c.name)
  return names.length ? names : ['Online Store', 'POS', 'Amazon', 'eBay', 'Instagram Shop']
})

const audienceValueOptions = computed(() => {
  if (form.value.audienceAttribute === 'Contact Lists') return contacts.lists.map((l) => l.name)
  if (form.value.audienceAttribute === 'Contact Tags') {
    return Array.from(new Set(contacts.contacts.flatMap((c) => c.tags)))
  }
  return ['VIP', 'Wholesale', 'Staff']
})

// Time is meaningless without its date — same rule UAT enforces by disabling.
const startTimeDisabled = computed(() => !form.value.startDate)
const endTimeDisabled = computed(() => !form.value.endDate)

const dateOrderError = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return ''
  return new Date(form.value.endDate) < new Date(form.value.startDate)
    ? 'The end date must be on or after the start date'
    : ''
})

const percentageError = computed(() => {
  const value = Number(form.value.percentage)
  if (Number.isNaN(value)) return ['Enter a percentage']
  if (value <= 0) return ['Enter a percentage above 0']
  if (form.value.adjustment === 'Decrease' && value > 100) return ['A decrease cannot exceed 100%']
  return []
})

const dirty = computed(() => JSON.stringify(form.value) !== snapshot.value)
const valid = computed(() =>
  form.value.title.trim().length > 0
  && form.value.salesChannel.length > 0
  && percentageError.value.length === 0
  && !dateOrderError.value,
)

/** Worked example so the merchant can see what the adjustment does. */
const example = computed(() => {
  const base = 100
  const pct = Number(form.value.percentage) || 0
  const result = form.value.adjustment === 'Increase' ? base * (1 + pct / 100) : base * (1 - pct / 100)
  return `$${base.toFixed(2)} becomes $${result.toFixed(2)}`
})

const saving = ref(false)
const cancelGuard = ref(false)

function requestCancel() {
  if (dirty.value) cancelGuard.value = true
  else router.push(listPath.value)
}

async function save(status: 'Draft' | 'Active') {
  if (!valid.value) return
  saving.value = true
  await new Promise((resolve) => setTimeout(resolve, 450))
  const payload: PricingInput = {
    ...form.value,
    title: form.value.title.trim(),
    percentage: Number(form.value.percentage),
    status,
  }
  if (configId.value !== null) {
    store.updatePricingConfiguration(configId.value, payload)
    toast.success(status === 'Active' ? 'Price list activated' : 'Price list saved as draft')
  } else {
    store.addPricingConfiguration(payload)
    toast.success(status === 'Active' ? 'Price list created and activated' : 'Price list saved as draft')
  }
  saving.value = false
  snapshot.value = JSON.stringify(form.value)
  router.push(listPath.value)
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Products · Price lists"
      :title="isEdit ? 'Edit price list' : 'New price list'"
      subtitle="Adjust prices for one sales channel and audience over a scheduled window."
      :back-to="listPath"
    >
      <template #actions>
        <v-btn variant="text" class="text-none" :disabled="saving" @click="requestCancel">Cancel</v-btn>
        <v-btn variant="outlined" class="text-none" :disabled="!valid || saving" @click="save('Draft')">Save as draft</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :loading="saving" :disabled="!valid" @click="save('Active')">
          {{ isEdit ? 'Save and activate' : 'Create and activate' }}
        </v-btn>
      </template>
    </MpPageHeader>

    <v-row class="flex-grow-1" no-gutters>
      <v-col cols="12" md="8" class="pr-md-4 d-flex flex-column ga-4">
        <v-card variant="flat" border rounded="lg" class="pe-card">
          <MpFormSection title="General" required />
          <MpFormGrid :cols="2">
            <v-text-field
              v-model="form.title"
              label="Title *"
              :error-messages="form.title.trim() ? [] : ['Title is required']"
            />
            <v-select
              v-model="form.salesChannel"
              :items="channelOptions"
              label="Sales channel *"
              :error-messages="form.salesChannel ? [] : ['Choose the channel these prices apply to']"
            />
            <v-textarea v-model="form.description" label="Description" rows="3" class="mp-form-grid__full" />
          </MpFormGrid>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="pe-card">
          <MpFormSection
            title="Who can use this price list"
            description="Leave the value empty to apply these prices to everyone."
          />
          <div class="pe-rule">
            <v-select v-model="form.audienceAttribute" :items="[...PRICING_ATTRIBUTES] as string[]" label="Attribute" hide-details />
            <v-select v-model="form.audienceOperator" :items="[...PRICING_OPERATORS] as string[]" label="Operator" hide-details />
            <v-combobox
              v-model="form.audienceValue"
              :items="audienceValueOptions"
              label="Value"
              hide-details
              clearable
            />
          </div>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="pe-card">
          <MpFormSection title="Schedule" description="Leave both dates empty to start the price list as soon as it is active." />
          <MpFormGrid :cols="2">
            <v-text-field v-model="form.startDate" label="Start date" type="date" />
            <v-text-field
              v-model="form.startTime"
              label="Start time"
              type="time"
              :disabled="startTimeDisabled"
              :hint="startTimeDisabled ? 'Choose a start date first' : undefined"
              :persistent-hint="startTimeDisabled"
            />
            <v-text-field
              v-model="form.endDate"
              label="End date"
              type="date"
              :error-messages="dateOrderError ? [dateOrderError] : []"
            />
            <v-text-field
              v-model="form.endTime"
              label="End time"
              type="time"
              :disabled="endTimeDisabled"
              :hint="endTimeDisabled ? 'Choose an end date first' : undefined"
              :persistent-hint="endTimeDisabled"
            />
          </MpFormGrid>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="pe-card">
          <MpFormSection title="Pricing" description="Prices display in the currency of the market the customer shops from." />
          <MpFormGrid :cols="2">
            <v-select v-model="form.adjustment" :items="[...PRICING_ADJUSTMENTS]" label="Overall price adjustment" />
            <v-text-field
              v-model="form.percentage"
              label="Percentage"
              type="number"
              suffix="%"
              min="0"
              :error-messages="percentageError"
            />
          </MpFormGrid>
          <MpAlert tone="info" live="polite">
            {{ example }} on this channel for the audience above.
          </MpAlert>
        </v-card>
      </v-col>

      <v-col cols="12" md="4" class="mt-4 mt-md-0">
        <v-card variant="flat" border rounded="lg" class="pe-card">
          <MpFormSection title="Summary" />
          <MpFormField label="What this price list does">
            <template #default="{ labelId }">
              <ul class="pe-summary" :aria-labelledby="labelId">
                <li><strong>Channel:</strong> {{ form.salesChannel || 'Not chosen yet' }}</li>
                <li><strong>Audience:</strong> {{ form.audienceValue ? `${form.audienceAttribute} ${form.audienceOperator.toLowerCase()} ${form.audienceValue}` : 'Everyone' }}</li>
                <li><strong>Adjustment:</strong> {{ form.adjustment }} of {{ Number(form.percentage) || 0 }}%</li>
                <li><strong>Starts:</strong> {{ form.startDate || 'When activated' }}</li>
                <li><strong>Ends:</strong> {{ form.endDate || 'No end date' }}</li>
              </ul>
            </template>
          </MpFormField>
        </v-card>
      </v-col>
    </v-row>

    <MpConfirmDialog
      v-model="cancelGuard"
      title="Discard this price list?"
      message="Your changes haven't been saved. Leaving now discards them."
      confirm-label="Discard changes"
      danger
      @confirm="router.push(listPath)"
    />
  </div>
</template>

<style scoped>
.pe-card {
  padding: var(--mp-component-card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.pe-rule {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--mp-space-12);
}

@media (max-width: 720px) {
  .pe-rule {
    grid-template-columns: minmax(0, 1fr);
  }
}

.pe-summary {
  margin: 0;
  padding-left: var(--mp-space-16);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-13);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
