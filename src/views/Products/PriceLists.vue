<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductExtrasStore, type PricingConfiguration, type PricingStatus } from '@/stores/useProductExtras'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * Price lists — scheduled, audience-scoped price adjustments per sales channel.
 * Rebuilt from UAT `/price-lists`; see docs/rebuild/price-lists/.
 *
 * NOTE: this route previously showed a per-SKU channel price matrix. That
 * surface was retired here so there is one page per task, per the "match UAT
 * surfaces, replace existing" decision — logged in docs/rebuild/IMPROVEMENTS.md.
 */
const store = useProductExtrasStore()
const salesChannels = useSalesChannelsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const basePath = computed(() => `/commerce/${accountId.value}/price-lists`)

const search = ref('')
const statusFilter = ref<'All statuses' | PricingStatus>('All statuses')
const channelFilter = ref<'All channels' | string>('All channels')

const headers = [
  { title: 'Title', key: 'title', sortable: true, minWidth: '240px' },
  { title: 'Sales channel', key: 'salesChannel', sortable: true },
  { title: 'Audience', key: 'audienceValue' },
  { title: 'Schedule', key: 'startDate', sortable: true },
  { title: 'Adjustment', key: 'percentage', align: 'end' as const, sortable: true },
  { title: 'Products', key: 'productCount', align: 'end' as const, sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: '', key: 'actions', sortable: false, width: 56 },
]

const channels = computed(() => {
  const fromStore = salesChannels.channelsForAccount(accountId.value).map((c) => c.name)
  return Array.from(new Set([...fromStore, ...store.pricingConfigurations.map((p) => p.salesChannel)]))
})

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return store.pricingConfigurations.filter((p) => {
    const byTerm = !term || p.title.toLowerCase().includes(term) || p.audienceValue.toLowerCase().includes(term)
    const byStatus = statusFilter.value === 'All statuses' || p.status === statusFilter.value
    const byChannel = channelFilter.value === 'All channels' || p.salesChannel === channelFilter.value
    return byTerm && byStatus && byChannel
  })
})

const hasFilters = computed(() =>
  Boolean(search.value) || statusFilter.value !== 'All statuses' || channelFilter.value !== 'All channels',
)

function clearFilters() {
  search.value = ''
  statusFilter.value = 'All statuses'
  channelFilter.value = 'All channels'
}

function formatDate(date: string): string {
  if (!date) return ''
  const d = new Date(`${date}T00:00:00`)
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function scheduleLabel(config: PricingConfiguration): string {
  if (!config.startDate) return 'No schedule'
  const start = `${formatDate(config.startDate)}${config.startTime ? `, ${config.startTime}` : ''}`
  if (!config.endDate) return `From ${start}`
  return `${start} → ${formatDate(config.endDate)}${config.endTime ? `, ${config.endTime}` : ''}`
}

function createConfig() {
  router.push(`${basePath.value}/new`)
}

function openEdit(config: PricingConfiguration) {
  router.push(`${basePath.value}/${config.id}`)
}

const confirmDelete = ref(false)
const pendingDelete = ref<PricingConfiguration | null>(null)

function askDelete(config: PricingConfiguration) {
  pendingDelete.value = config
  confirmDelete.value = true
}

function doDelete() {
  if (!pendingDelete.value) return
  store.deletePricingConfiguration(pendingDelete.value.id)
  toast.success('Price list deleted')
  pendingDelete.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Products"
      title="Price lists"
      :subtitle="`${store.pricingConfigurations.filter(p => p.status === 'Active').length} active of ${store.pricingConfigurations.length}`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="createConfig">
          New price list
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <div class="pl-toolbar d-flex flex-wrap align-center ga-3">
        <v-text-field
          v-model="search"
          label="Search price lists"
          placeholder="Title or audience"
          prepend-inner-icon="search"
          clearable
          hide-details
          class="pl-toolbar__search"
        />
        <v-select v-model="statusFilter" :items="['All statuses', 'Draft', 'Active']" label="Status" hide-details class="pl-toolbar__select" />
        <v-select v-model="channelFilter" :items="['All channels', ...channels]" label="Sales channel" hide-details class="pl-toolbar__select" />
        <v-btn v-if="hasFilters" variant="text" class="text-none" @click="clearFilters">Clear</v-btn>
      </div>

      <v-data-table
        :headers="headers"
        :items="filtered"
        :items-per-page="10"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.title="{ item }">
          <div class="py-1">
            <div class="text-body-2 font-weight-medium">{{ item.title }}</div>
            <div v-if="item.description" class="text-caption text-medium-emphasis text-truncate pl-desc">{{ item.description }}</div>
          </div>
        </template>
        <template #item.audienceValue="{ item }">
          <span v-if="item.audienceValue" class="text-body-2">
            {{ item.audienceAttribute }} {{ item.audienceOperator.toLowerCase() }} {{ item.audienceValue }}
          </span>
          <span v-else class="text-body-2 text-medium-emphasis">Everyone</span>
        </template>
        <template #item.startDate="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ scheduleLabel(item) }}</span>
        </template>
        <template #item.percentage="{ item }">
          <span class="text-body-2 font-weight-medium" :class="item.adjustment === 'Decrease' ? 'text-success' : ''">
            {{ item.adjustment === 'Decrease' ? '−' : '+' }}{{ item.percentage }}%
          </span>
        </template>
        <template #item.productCount="{ item }">
          <span class="text-body-2">{{ item.productCount }}</span>
        </template>
        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Price list actions" :item-label="item.title">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="tag"
            :title="hasFilters ? 'No price lists match your filters' : 'No price lists yet'"
            :description="hasFilters ? 'Try a different search term or clear your filters.' : 'A price list adjusts prices for a sales channel and audience over a scheduled window.'"
            :action-label="hasFilters ? 'Clear filters' : 'New price list'"
            :action-icon="hasFilters ? 'x' : 'plus'"
            class="py-10"
            @action="hasFilters ? clearFilters() : createConfig()"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete this price list?"
      :message="`“${pendingDelete?.title}” stops applying immediately and its adjustment is removed from ${pendingDelete?.salesChannel}.`"
      confirm-label="Delete price list"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.pl-toolbar {
  padding: var(--mp-component-card-padding);
  border-bottom: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  min-height: var(--mp-component-toolbar-minHeight);
}

.pl-toolbar__search {
  max-width: var(--mp-component-toolbar-searchWidth);
  min-width: var(--mp-component-toolbar-searchMinWidth);
}

.pl-toolbar__select {
  max-width: 200px;
  min-width: 160px;
}

.pl-desc {
  max-width: 280px;
}
</style>
