<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import { useToast } from '@/composables/useToast'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import {
  useMerchandisingStore,
  COLLECTION_FILTER_LABELS,
  type CollectionFilter,
  type CollectionFilterOperator,
} from '@/stores/useMerchandising'

// Smart-collection editor (Findify "Collections ▸ edit"): three tabs —
// Shopify Filters / Activation / Configured Filters & Sorting.
const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()
const toast = useToast()

const listRoute = computed(() => ({ name: 'MerchandisingChannelCollections', params: { accountId: route.params.accountId, channelId: route.params.channelId } }))

const collectionId = computed(() => String(route.params.collectionId))
const collection = computed(() => store.collectionList.find((c) => c.id === collectionId.value))
const notFound = computed(() => !collection.value)

const SORT_OPTIONS = ['Popularity', 'Newest', 'Price: low to high', 'Price: high to low', 'Best selling']
const OPERATOR_OPTIONS: Array<{ title: string; value: CollectionFilterOperator }> = [
  { title: 'equals', value: 'equals' },
  { title: 'contains', value: 'contains' },
]

/* ── Editable draft (committed on Save) ───────────────────────── */
function blankFilters(): CollectionFilter[] {
  return [{ id: `cf${Date.now()}`, field: 'Category', operator: 'equals', value: collection.value?.name ?? '' }]
}

const draft = ref({
  useShopifyFilters: collection.value?.useShopifyFilters ?? (collection.value?.filterType === 'synced'),
  pageUrl: collection.value?.pageUrl ?? collection.value?.name ?? '',
  filters: (collection.value?.filters ?? blankFilters()).map((f) => ({ ...f })),
  sortBy: collection.value?.sortBy ?? 'Popularity',
})
const savedSnapshot = ref(JSON.stringify(draft.value))
const dirty = computed(() => JSON.stringify(draft.value) !== savedSnapshot.value)

const { confirmLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel } = useDirtyLeaveGuard(dirty, {
  title: 'Leave collection editor?',
  message: 'You have unsaved changes to this collection. Leaving now will discard them.',
})

// Activation first — SMB merchants activate before configuring advanced filters.
const activeTab = ref('activation')
const tabs = [
  { label: 'Activation', key: 'activation' },
  { label: 'Shopify Filters', key: 'shopify' },
  { label: 'Filters & Sorting', key: 'sorting' },
]

function addFilter() {
  draft.value.filters.push({ id: `cf${Date.now()}-${draft.value.filters.length}`, field: '', operator: 'equals', value: '' })
}

function removeFilter(index: number) {
  draft.value.filters.splice(index, 1)
}

function save() {
  if (!collection.value || !dirty.value) return
  store.saveCollectionConfig(collection.value.id, {
    useShopifyFilters: draft.value.useShopifyFilters,
    pageUrl: draft.value.pageUrl.trim(),
    filters: draft.value.filters,
    sortBy: draft.value.sortBy,
  })
  savedSnapshot.value = JSON.stringify(draft.value)
  toast.success('Collection saved')
}
</script>

<template>
  <div v-if="!notFound && collection" class="h-100 d-flex flex-column gap-5">
    <MpPageHeader :title="collection.name" subtitle="Smart collection configuration" :back-to="listRoute">
      <template #actions>
        <MpStatusChip
          :status="collection.status === 'active' ? 'Active' : 'Inactive'"
          type="general"
          size="md"
          variant="flat"
          class="mr-2"
        />
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" :disabled="!dirty" @click="save">
          Save
        </v-btn>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Collection configuration tabs" />

    <!-- Tab 1: Shopify Filters -->
    <v-card v-if="activeTab === 'shopify'" flat border rounded="lg" class="pa-6">
      <div class="text-subtitle-1 font-weight-bold mb-1">Shopify filters</div>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Import this collection's membership rules directly from Shopify. Turn off to configure filters manually below.
      </p>
      <MpFormGrid>
        <v-switch
          v-model="draft.useShopifyFilters"
          color="success"
          label="Use Shopify filters for this collection"
        />
        <v-alert
          v-if="draft.useShopifyFilters"
          type="info"
          variant="tonal"
          density="compact"
          text="Membership mirrors the Shopify collection. Changes made in Shopify sync automatically."
        />
      </MpFormGrid>
    </v-card>

    <!-- Tab 2: Activation -->
    <v-card v-else-if="activeTab === 'activation'" flat border rounded="lg" class="pa-6">
      <div class="text-subtitle-1 font-weight-bold mb-1">Activation</div>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Map this smart collection to the storefront page where it should appear.
      </p>
      <MpFormGrid>
        <v-text-field
          v-model="draft.pageUrl"
          label="Page URL *"
          placeholder="collections/summer-sale"
          prefix="/"
          :rules="[(v: string) => Boolean(v?.trim()) || 'Page URL is required']"
        />
      </MpFormGrid>
    </v-card>

    <!-- Tab 3: Configured Filters & Sorting -->
    <v-card v-else flat border rounded="lg" class="pa-6">
      <div class="d-flex align-center justify-space-between mb-1">
        <div class="text-subtitle-1 font-weight-bold">Configured filters &amp; sorting</div>
        <span class="text-caption text-medium-emphasis">{{ COLLECTION_FILTER_LABELS[collection.filterType] }}</span>
      </div>
      <p class="text-body-2 text-medium-emphasis mb-4">Products match <strong>all</strong> of the conditions below.</p>

      <MpFormGrid>
        <div v-for="(filter, index) in draft.filters" :key="filter.id" class="mp-form-grid__trailing">
          <div class="d-flex gap-3">
            <v-text-field
              v-model="filter.field"
              label="Field"
              placeholder="e.g. Category"
              class="flex-grow-1"
            />
            <v-select
              v-model="filter.operator"
              :items="OPERATOR_OPTIONS"
              label="Operator"
              class="collection-op"
            />
            <v-text-field
              v-model="filter.value"
              label="Value"
              placeholder="e.g. Accessories"
              class="flex-grow-1"
            />
          </div>
          <v-btn
            icon="trash-2"
            variant="text"
            size="small"
            class="text-medium-emphasis"
            :aria-label="`Remove filter ${index + 1}`"
            @click="removeFilter(index)"
          />
        </div>
        <div>
          <v-btn variant="text" size="small" class="text-none" prepend-icon="plus" @click="addFilter">Add filter</v-btn>
        </div>

        <MpFormSection title="Sorting" />
        <v-select
          v-model="draft.sortBy"
          :items="SORT_OPTIONS"
          label="Sort by"
          class="collection-sort"
        />
      </MpFormGrid>
    </v-card>

    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />

  </div>

  <div v-else class="pa-10">
    <MpErrorState
      icon="layers"
      title="Collection not found"
      description="This collection may have been deleted, or the link is incorrect."
      action-label="Back to Collections"
      action-icon="arrow-left"
      @action="router.push(listRoute)"
    />
  </div>
</template>

<style scoped>
.collection-op {
  width: 140px;
  flex: 0 0 auto;
}

.collection-sort {
  max-width: 320px;
}
</style>
