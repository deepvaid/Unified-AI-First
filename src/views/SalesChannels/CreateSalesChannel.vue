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
import { useToast } from '@/composables/useToast'
import {
  CHANNEL_TYPE_LABELS,
  CONNECTED_CLOUD_LABELS,
  type SalesChannelType,
} from '@/stores/useSalesChannels'
import { useDemoStores } from '@/stores/useDemoStores'
import { useRetailStore } from '@/stores/useRetail'
import { localDateKey } from '@/maropay/model'
import { DEMO_STORES, demoStoreFor, type DemoStoreId } from '@/storefront/demoStores'
import { snapshotFor, type InstallChannel } from '@/storefront/demoStores/install'
import { currencyName, startSummary, themeFacts } from '@/storefront/demoStores/summary'
import { FIRST_CREATED_SLOT } from '@/storefront/createdStores'

const route = useRoute()
const router = useRouter()
const demoStores = useDemoStores()
const retailStore = useRetailStore()
const toast = useToast()

const selectedType = ref<SalesChannelType | null>(null)
const name = ref('')
const description = ref('')
const domain = ref('')
const storeBuilderEnabled = ref(true)
const merchandiseConnected = ref(false)
const selectedLocationIds = ref<string[]>([])
/** The demo store a Store Builder web store starts as a copy of; null starts it blank. */
const selectedTheme = ref<DemoStoreId | null>(null)
const submitted = ref(false)

/** A web store with Store Builder on can start from a theme, so it gets a Theme step before Review. */
const hasThemeStep = computed(() => selectedType.value === 'web_store' && storeBuilderEnabled.value)
const steps = computed(() => (hasThemeStep.value
  ? ['Choose type', 'Configure', 'Theme', 'Review']
  : ['Choose type', 'Configure', 'Review']))

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

const { step, maxStep, goTo, next: nextStep, prev: prevStep } = useWizardSteps(() => steps.value.length, {
  canAdvance: (from) => (from === 1 ? canContinueFromType.value : canCreate.value),
})
const isThemeStep = computed(() => hasThemeStep.value && step.value === 3)

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

// ── Start from a theme ────────────────────────────────────────────────────────
const themeOptions = DEMO_STORES.map((blueprint) => ({
  id: blueprint.id,
  card: blueprint.card,
  currency: currencyName(blueprint.homeChannel.webStore?.currency ?? 'USD'),
}))

/** Thumbnails that did not load (not captured yet): their frame shows a placeholder instead of a broken image. */
const missingThumbnails = ref(new Set<DemoStoreId>())

/** What the new store starts with, for the Review step. Only counts are read, so a stand-in store is enough. */
const startsWith = computed(() => {
  const id = selectedTheme.value
  if (!id) return startSummary(null)
  const standIn: InstallChannel = {
    id: 'new-store',
    name: 'New store',
    webStore: {
      domain: 'new-store.maropost.store',
      storeBuilderEnabled: true,
      published: false,
      merchandiseConnected: false,
      blueprint: { original: id, slot: FIRST_CREATED_SLOT },
    },
  }
  return startSummary(themeFacts(demoStoreFor(id).card.name, snapshotFor(standIn, id, localDateKey(Date.now()))))
})

function createChannel() {
  submitted.value = true
  if (!canCreate.value || !selectedType.value) return

  const channel = demoStores.create(accountId.value, {
    name: name.value,
    type: selectedType.value,
    description: description.value,
    domain: domain.value,
    storeBuilderEnabled: storeBuilderEnabled.value,
    merchandiseConnected: merchandiseConnected.value,
    locationIds: selectedLocationIds.value,
    theme: hasThemeStep.value ? selectedTheme.value : null,
  })

  // The store came up as a copy of the theme (none is made when no store slot is left).
  const copied = channel.webStore?.blueprint?.original
  if (copied) {
    const href = router.resolve({ name: 'StorefrontHome', params: { accountId: accountId.value, channelId: channel.id } }).href
    toast.success(`${channel.name} is ready, as a copy of ${demoStoreFor(copied).card.name}`, {
      action: { label: 'Show store', onClick: () => window.open(href, '_blank', 'noopener') },
    })
  }

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
    ...(hasThemeStep.value ? [{ label: 'Starts with', value: startsWith.value }] : []),
  ]
})
</script>

<template>
  <MpWizardShell
    title="Create sales channel"
    :steps="steps"
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
      v-else-if="isThemeStep"
      title="Start from a theme"
      description="Start blank, or as a copy of a demo store: its look, products, pages and campaigns. You can apply another theme later from the store’s Themes page."
    >
      <v-row>
        <v-col cols="12" md="6">
          <MpOptionCard
            :selected="selectedTheme === null"
            title="Blank"
            description="An empty store to build yourself."
            class="h-100"
            @click="selectedTheme = null"
          >
            <template #media>
              <div class="start-theme__frame" aria-hidden="true">
                <v-icon size="32">layout-template</v-icon>
              </div>
            </template>
          </MpOptionCard>
        </v-col>
        <v-col v-for="option in themeOptions" :key="option.id" cols="12" md="6">
          <MpOptionCard
            :selected="selectedTheme === option.id"
            :title="option.card.name"
            class="h-100"
            @click="selectedTheme = option.id"
          >
            <p class="text-caption font-weight-medium mb-1">{{ option.card.kind }} · Prices in {{ option.currency }}</p>
            <p class="start-theme__description text-caption text-medium-emphasis mb-0">{{ option.card.description }}</p>
            <template #media>
              <!-- Decorative: the card already names the theme, and a button reads all of its text as its name. -->
              <div class="start-theme__frame" aria-hidden="true">
                <img
                  v-if="!missingThumbnails.has(option.id)"
                  :src="option.card.thumbnail"
                  alt=""
                  class="start-theme__image"
                  @error="missingThumbnails.add(option.id)"
                >
                <v-icon v-else size="32">image</v-icon>
              </div>
            </template>
          </MpOptionCard>
        </v-col>
      </v-row>
    </MpWizardStepCard>

    <MpWizardStepCard
      v-else
      title="Review sales channel"
      description="Check the details, then create the channel."
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
        v-if="step < steps.length"
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

<style scoped>
/* One frame for every option, so the pictures line up whether a thumbnail has loaded, is loading or is missing. */
.start-theme__frame {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 10;
  background: var(--surface-secondary);
  color: var(--on-surface-muted);
}

.start-theme__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}

.start-theme__description {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}
</style>
