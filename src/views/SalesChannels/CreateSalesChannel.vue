<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import {
  CHANNEL_TYPE_LABELS,
  CONNECTED_CLOUD_LABELS,
  useSalesChannelsStore,
  type SalesChannelType,
} from '@/stores/useSalesChannels'
import { useRetailStore } from '@/stores/useRetail'

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const retailStore = useRetailStore()

const step = ref(1)
const selectedType = ref<SalesChannelType | null>(null)
const name = ref('')
const description = ref('')
const domain = ref('')
const storeBuilderEnabled = ref(true)
const merchandiseConnected = ref(false)
const selectedLocationIds = ref<string[]>([])
const submitted = ref(false)

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const locationOptions = computed(() =>
  retailStore.locationList.map((location) => ({
    title: location.name,
    value: location.id,
    subtitle: location.address,
  })),
)

const canContinueFromType = computed(() => !!selectedType.value)
const canCreate = computed(() => !!selectedType.value && name.value.trim().length > 0)

const typeOptions: Array<{
  value: SalesChannelType
  title: string
  icon: string
  description: string
  clouds: string[]
}> = [
  {
    value: 'web_store',
    title: 'Web Store',
    icon: 'globe',
    description: 'Sell online through a storefront, with optional Store Builder and Merchandise Cloud.',
    clouds: ['Commerce Cloud', 'Store Builder', 'Merchandise Cloud'],
  },
  {
    value: 'offline_store',
    title: 'Offline Store',
    icon: 'store',
    description: 'Sell in person through Retail Cloud POS and physical locations.',
    clouds: ['Retail Cloud'],
  },
]

function goBack() {
  router.push({ name: 'SalesChannels', params: { accountId: accountId.value } })
}

function selectType(type: SalesChannelType) {
  selectedType.value = type
  if (!name.value.trim()) {
    name.value = type === 'web_store' ? 'New Web Store' : 'New Offline Store'
  }
}

function nextStep() {
  if (step.value === 1 && canContinueFromType.value) step.value = 2
  else if (step.value === 2 && canCreate.value) step.value = 3
}

function createChannel() {
  submitted.value = true
  if (!canCreate.value || !selectedType.value) return

  const channel = salesChannelsStore.createChannel(accountId.value, {
    name: name.value,
    type: selectedType.value,
    description: description.value,
    domain: domain.value,
    storeBuilderEnabled: storeBuilderEnabled.value,
    merchandiseConnected: merchandiseConnected.value,
    locationIds: selectedLocationIds.value,
  })

  router.push({
    name: 'SalesChannelDetail',
    params: { accountId: accountId.value, channelId: channel.id },
  })
}

const reviewRows = computed(() => {
  const type = selectedType.value
  return [
    { label: 'Channel type', value: type ? CHANNEL_TYPE_LABELS[type] : 'Not selected' },
    { label: 'Name', value: name.value || 'Not provided' },
    {
      label: 'Connected clouds',
      value: type === 'web_store'
        ? ['commerce', storeBuilderEnabled.value && 'store_builder', merchandiseConnected.value && 'merchandise']
            .filter(Boolean)
            .map((cloud) => CONNECTED_CLOUD_LABELS[cloud as keyof typeof CONNECTED_CLOUD_LABELS])
            .join(', ')
        : CONNECTED_CLOUD_LABELS.retail,
    },
    {
      label: 'Locations',
      value: type === 'offline_store'
        ? selectedLocationIds.value.length
          ? `${selectedLocationIds.value.length} selected`
          : 'None selected yet'
        : 'Not required',
    },
  ]
})
</script>

<template>
  <div class="create-sales-channel h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Create sales channel"
      subtitle="Choose where customers will buy, then configure only what that channel needs."
      :back-to="{ name: 'SalesChannels', params: { accountId } }"
    />

    <v-card flat border rounded="lg">
      <div class="create-sales-channel__steps">
        <button
          v-for="item in [
            { value: 1, label: 'Choose type' },
            { value: 2, label: 'Configure' },
            { value: 3, label: 'Review' },
          ]"
          :key="item.value"
          type="button"
          class="create-sales-channel__step"
          :class="{ 'create-sales-channel__step--active': step === item.value }"
          :disabled="item.value > step"
          @click="step = item.value"
        >
          <span>{{ item.value }}</span>
          {{ item.label }}
        </button>
      </div>

      <v-divider />

      <div class="pa-6">
        <section v-if="step === 1">
          <div class="text-subtitle-1 font-weight-bold mb-1">What type of sales channel are you creating?</div>
          <div class="text-body-2 text-medium-emphasis mb-5">
            Start with the selling context. You can connect product-cloud capabilities after the channel exists.
          </div>

          <v-row>
            <v-col v-for="option in typeOptions" :key="option.value" cols="12" md="6">
              <button
                type="button"
                class="create-type-card"
                :class="{ 'create-type-card--active': selectedType === option.value }"
                @click="selectType(option.value)"
              >
                <span class="create-type-card__icon">
                  <v-icon size="24">{{ option.icon }}</v-icon>
                </span>
                <span class="create-type-card__content">
                  <strong>{{ option.title }}</strong>
                  <small>{{ option.description }}</small>
                  <span class="create-type-card__chips">
                    <v-chip v-for="cloud in option.clouds" :key="cloud" size="x-small" variant="tonal" label>
                      {{ cloud }}
                    </v-chip>
                  </span>
                </span>
              </button>
            </v-col>
          </v-row>
        </section>

        <section v-else-if="step === 2">
          <div class="text-subtitle-1 font-weight-bold mb-1">
            Configure {{ selectedType ? CHANNEL_TYPE_LABELS[selectedType] : 'sales channel' }}
          </div>
          <div class="text-body-2 text-medium-emphasis mb-5">
            Keep setup lightweight. Deeper settings can be completed from the channel detail page.
          </div>

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="name"
                label="Sales channel name"
                variant="outlined"
                density="comfortable"
                :error="submitted && !name.trim()"
                :error-messages="submitted && !name.trim() ? ['Name is required'] : []"
              />
            </v-col>
            <v-col v-if="selectedType === 'web_store'" cols="12" md="6">
              <v-text-field
                v-model="domain"
                label="Storefront domain"
                placeholder="new-store.maropost.store"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="description"
                label="Description"
                rows="3"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <template v-if="selectedType === 'web_store'">
              <v-col cols="12" md="6">
                <v-switch
                  v-model="storeBuilderEnabled"
                  color="primary"
                  label="Enable Store Builder"
                  hide-details
                />
                <div class="text-caption text-medium-emphasis mt-1">
                  Store Builder is managed from this Web Store channel.
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="merchandiseConnected"
                  color="primary"
                  label="Connect Merchandise Cloud"
                  hide-details
                />
                <div class="text-caption text-medium-emphasis mt-1">
                  Merchandise settings apply to this Web Store only.
                </div>
              </v-col>
            </template>

            <v-col v-if="selectedType === 'offline_store'" cols="12">
              <v-select
                v-model="selectedLocationIds"
                :items="locationOptions"
                label="Initial locations"
                variant="outlined"
                density="comfortable"
                multiple
                chips
              />
              <v-alert type="info" variant="tonal" density="compact">
                Locations are physical places owned by this Offline Store channel. Registers are managed from Location Detail.
              </v-alert>
            </v-col>
          </v-row>
        </section>

        <section v-else>
          <div class="text-subtitle-1 font-weight-bold mb-1">Review sales channel</div>
          <div class="text-body-2 text-medium-emphasis mb-5">
            This creates a prototype channel in local mock state.
          </div>

          <v-list class="bg-transparent review-list" density="comfortable">
            <v-list-item v-for="row in reviewRows" :key="row.label">
              <template #prepend>
                <v-icon size="18" color="medium-emphasis">circle-check</v-icon>
              </template>
              <v-list-item-title>{{ row.label }}</v-list-item-title>
              <v-list-item-subtitle>{{ row.value }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </section>

        <v-divider class="my-6" />

        <div class="d-flex justify-space-between align-center">
          <v-btn variant="text" class="text-none" @click="step === 1 ? goBack() : step -= 1">
            {{ step === 1 ? 'Cancel' : 'Back' }}
          </v-btn>
          <div class="d-flex align-center ga-2">
            <v-btn
              v-if="step < 3"
              color="primary"
              variant="flat"
              class="text-none"
              :disabled="step === 1 ? !canContinueFromType : !canCreate"
              @click="nextStep"
            >
              Continue
            </v-btn>
            <v-btn
              v-else
              color="primary"
              variant="flat"
              class="text-none"
              prepend-icon="plus"
              @click="createChannel"
            >
              Create sales channel
            </v-btn>
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.create-sales-channel__steps {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
}

.create-sales-channel__step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
}

.create-sales-channel__step:disabled {
  cursor: default;
  opacity: 0.52;
}

.create-sales-channel__step span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.create-sales-channel__step--active {
  background: rgba(var(--v-theme-primary), 0.10);
  color: rgb(var(--v-theme-primary));
}

.create-type-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  min-height: 184px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  font: inherit;
  padding: 20px;
  text-align: left;
  transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;
}

.create-type-card:hover,
.create-type-card--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.create-type-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.24);
}

.create-type-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.create-type-card__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.create-type-card__content strong {
  font-size: 16px;
}

.create-type-card__content small {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  line-height: 1.45;
}

.create-type-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.review-list {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}
</style>
