<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpAlert from '@/components/MpAlert.vue'
import { useWizardSteps } from '@/composables/useWizardSteps'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
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

const STEPS = ['Choose type', 'Configure', 'Review']

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
const channelsRoute = computed(() => ({ name: 'SalesChannels', params: { accountId: accountId.value } }))

const locationOptions = computed(() =>
  retailStore.locationList.map((location) => ({
    title: location.name,
    value: location.id,
    subtitle: location.address,
  })),
)

const canContinueFromType = computed(() => !!selectedType.value)
const canCreate = computed(() => !!selectedType.value && name.value.trim().length > 0)

const { step, maxStep, goTo, next: nextStep, prev: prevStep } = useWizardSteps(STEPS.length, {
  canAdvance: (from) => (from === 1 ? canContinueFromType.value : canCreate.value),
})

const stepHint = computed(() => {
  if (step.value === 1 && !canContinueFromType.value) return 'Choose a channel type to continue'
  if (step.value === 2 && !canCreate.value) return 'Name the channel to continue'
  return undefined
})

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

function selectType(type: SalesChannelType) {
  selectedType.value = type
  if (!name.value.trim()) {
    name.value = type === 'web_store' ? 'New Web Store' : 'New Offline Store'
  }
}

// ── Unsaved-changes guard ─────────────────────────────────────────────────────
const isDirty = computed(() =>
  selectedType.value !== null || name.value.trim() !== '' || description.value.trim() !== ''
  || domain.value.trim() !== '' || selectedLocationIds.value.length > 0,
)
const {
  confirmLeave, allowNextLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave without creating this channel?',
  message: 'The channel has not been created. Leaving now will discard your choices.',
})

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

  allowNextLeave()
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
  <MpWizardShell
    title="Create sales channel"
    :steps="STEPS"
    :current="step"
    :max-step="maxStep"
    :back-to="channelsRoute"
    :hint="stepHint"
    @select="goTo"
    @back="prevStep"
  >
    <MpWizardStepCard
      v-if="step === 1"
      title="What type of sales channel are you creating?"
      description="Start with the selling context — where customers will buy. You can connect product-cloud capabilities after the channel exists."
    >
      <v-row>
        <v-col v-for="option in typeOptions" :key="option.value" cols="12" md="6">
          <MpOptionCard
            :selected="selectedType === option.value"
            :title="option.title"
            :description="option.description"
            :icon="option.icon"
            class="h-100"
            @click="selectType(option.value)"
          >
            <div class="d-flex flex-wrap ga-1 mt-2">
              <v-chip v-for="cloud in option.clouds" :key="cloud" size="x-small" variant="tonal" label>
                {{ cloud }}
              </v-chip>
            </div>
          </MpOptionCard>
        </v-col>
      </v-row>
    </MpWizardStepCard>

    <MpWizardStepCard
      v-else-if="step === 2"
      :title="`Configure ${selectedType ? CHANNEL_TYPE_LABELS[selectedType] : 'sales channel'}`"
      description="Keep setup lightweight. Deeper settings can be completed from the channel detail page."
    >
      <MpFormGrid :cols="2">
        <v-text-field
          v-model="name"
          label="Sales channel name"
          :error="submitted && !name.trim()"
          :error-messages="submitted && !name.trim() ? ['Name is required'] : []"
        />
        <v-text-field
          v-if="selectedType === 'web_store'"
          v-model="domain"
          label="Storefront domain"
          placeholder="new-store.maropost.store"
        />
        <v-textarea
          v-model="description"
          label="Description"
          rows="3"
          class="mp-form-grid__full"
        />

        <template v-if="selectedType === 'web_store'">
          <v-switch
            v-model="storeBuilderEnabled"
            label="Enable Store Builder"
            hint="Store Builder is managed from this Web Store channel."
            persistent-hint
          />
          <v-switch
            v-model="merchandiseConnected"
            label="Connect Merchandise Cloud"
            hint="Merchandise settings apply to this Web Store only."
            persistent-hint
          />
        </template>

        <template v-if="selectedType === 'offline_store'">
          <v-select
            v-model="selectedLocationIds"
            :items="locationOptions"
            label="Initial locations"
            multiple
            chips
            class="mp-form-grid__full"
          />
          <MpAlert tone="info" live="off" class="mp-form-grid__full">
            Locations are physical places owned by this Offline Store channel. Registers are managed from Location Detail.
          </MpAlert>
        </template>
      </MpFormGrid>
    </MpWizardStepCard>

    <MpWizardStepCard
      v-else
      title="Review sales channel"
      description="This creates a prototype channel in local mock state."
    >
      <dl class="mp-label-value">
        <div v-for="row in reviewRows" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>
    </MpWizardStepCard>

    <template #footerStart>
      <v-btn
        v-if="step === 1"
        variant="text"
        class="text-none"
        :to="channelsRoute"
      >
        Cancel
      </v-btn>
      <v-btn v-else variant="text" class="text-none" prepend-icon="arrow-left" @click="prevStep">
        Back
      </v-btn>
    </template>
    <template #footer>
      <v-btn
        v-if="step < STEPS.length"
        color="primary"
        variant="flat"
        class="text-none"
        append-icon="arrow-right"
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
    </template>
  </MpWizardShell>

  <MpConfirmDialog
    v-model="confirmLeave"
    danger
    :title="leaveTitle"
    :message="leaveMessage"
    :confirm-label="leaveConfirmLabel"
    @confirm="discardAndLeave"
  />
</template>
