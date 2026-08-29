<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductExtrasStore, type PricingConfiguration } from '@/stores/useProductExtras'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
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
// Status is the promoted filter: a multi-select pill in the toolbar rather
// than a single-value select, so several values can be compared at once.
const statusQuickFilter = {
  key: 'status',
  label: 'Status',
  options: (['Draft', 'Active']).map((v) => ({ label: v, value: v })),
}
const statusFilter = ref<string[]>([])
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
    const byStatus = !statusFilter.value.length || statusFilter.value.includes(p.status)
    const byChannel = channelFilter.value === 'All channels' || p.salesChannel === channelFilter.value
    return byTerm && byStatus && byChannel
  })
})

const hasFilters = computed(() =>
  Boolean(search.value) || statusFilter.value.length || channelFilter.value !== 'All channels',
)

function clearFilters() {
  search.value = ''
  statusFilter.value = []
  channelFilter.value = 'All channels'
}

const activeFilterEntries = computed(() => {
  const entries: Array<{ key: string; label: string }> = []
  if (statusFilter.value.length) entries.push({ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` })
  if (channelFilter.value !== 'All channels') entries.push({ key: 'channel', label: `Channel: ${channelFilter.value}` })
  return entries
})

function removeFilter(key: string) {
  if (key === 'status') statusFilter.value = []
  if (key === 'channel') channelFilter.value = 'All channels'
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
      <MpDataTableToolbar
        v-model:quick-filter-value="statusFilter"
        :quick-filter="statusQuickFilter"
        v-model:search="search"
        title="All price lists"
        search-placeholder="Search title or audience"
        :total-count="filtered.length"
        :active-filters="activeFilterEntries"
        :headers="headers"
        @remove-filter="removeFilter"
        @clear-filters="clearFilters"
      >
        <!-- Filter drawer: `hide-details` is deliberate — a table filter never
             carries a hint, and the drawer is a dense surface. -->
        <template #filter-content>
          <MpFormSection title="Filter by" />
          <MpFormGrid>
            <v-select v-model="channelFilter" :items="['All channels', ...channels]" label="Sales channel" hide-details />
          </MpFormGrid>
        </template>
      </MpDataTableToolbar>

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
            <v-list-item role="menuitem" prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <v-list-item role="menuitem" prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
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
.pl-desc {
  max-width: 280px;
}
</style>
