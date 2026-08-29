<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useCommerceStore, type Promotion } from '@/stores/useCommerce'
import { downloadCsv } from '@/utils/exportCsv'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { useToast } from '@/composables/useToast'

const store = useCommerceStore()
const route = useRoute()
const router = useRouter()
const search = ref('')
const selected = ref<number[]>([])
const { loading } = useInitialLoad()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

// ── Tabs (All / Active / Inactive) ────────────────────────────────
const activeTab = ref('all')
const tabs = computed(() => [
  { label: 'All', key: 'all', count: store.promotions.length },
  { label: 'Active', key: 'Active', count: store.promotions.filter(p => p.status === 'Active').length },
  { label: 'Inactive', key: 'Inactive', count: store.promotions.filter(p => p.status === 'Inactive').length },
])

const tabbedPromotions = computed(() =>
  activeTab.value === 'all' ? store.promotions : store.promotions.filter(p => p.status === activeTab.value),
)

// ── Filters ──────────────────────────────────────────────────────
// Discount Method is the promoted filter: a multi-select pill in the toolbar, so the
// cut people make most often doesn't cost a trip to the drawer.
const methodQuickFilter = {
  key: 'method',
  label: 'Discount Method',
  options: (['Order', 'Product']).map((v) => ({ label: v, value: v })),
}
const methodFilter = ref<string[]>([])

const filters = ref({
  mechanism: null as string | null,
})

const filterOptions = {
  mechanism: ['Code', 'Automatic'],
}

const filterLabels: Record<string, string> = {
  method: 'Discount Method',
  mechanism: 'Mechanism',
}

const activeFilterEntries = computed(() => {
  const entries =
    Object.entries(filters.value)
      .filter(([, v]) => v !== null)
      .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` }))
  if (methodFilter.value.length) {
    entries.unshift({ key: 'method', label: `Discount Method: ${methodFilter.value.join(', ')}` })
  }
  return entries
})

function removeFilter(key: string) {
  if (key === 'method') {
    methodFilter.value = []
    return
  }
  filters.value[key as keyof typeof filters.value] = null
}

function clearAllFilters() {
  methodFilter.value = []
  filters.value = { mechanism: null }
}

const filteredPromotions = computed(() => {
  let rows = tabbedPromotions.value
  if (methodFilter.value.length) rows = rows.filter(p => methodFilter.value.includes(p.method))
  if (filters.value.mechanism) rows = rows.filter(p => p.mechanism === filters.value.mechanism)
  return rows
})

function selectAll() {
  selected.value = filteredPromotions.value.map(p => p.id)
}

// ── Create / edit navigation (full-page composer) ─────────────────
function openNewPromotion() {
  router.push({ name: 'CreatePromotion', params: { accountId: accountId.value } })
}
function openEditPromotion(promotion: Promotion) {
  router.push({ name: 'EditPromotion', params: { accountId: accountId.value, promoId: promotion.id } })
}

function duplicate(promotion: Promotion) {
  store.duplicatePromotion(promotion.id)
  notify('Promotion duplicated')
}

function toggleActive(promotion: Promotion) {
  const next = promotion.status === 'Active' ? 'Inactive' : 'Active'
  store.setPromotionStatus(promotion.id, next)
  notify(next === 'Active' ? 'Promotion activated' : 'Promotion deactivated')
}

function bulkDeactivate() {
  const count = selected.value.length
  selected.value.forEach(id => store.setPromotionStatus(id, 'Inactive'))
  selected.value = []
  notify(`${count} promotion${count === 1 ? '' : 's'} deactivated`)
}

// ── Delete (row + bulk) ────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<Promotion | null>(null)
const bulkDelete = ref(false)

function askDelete(promotion: Promotion) {
  pendingDelete.value = promotion
  bulkDelete.value = false
  confirmDelete.value = true
}

function askBulkDelete() {
  pendingDelete.value = null
  bulkDelete.value = true
  confirmDelete.value = true
}

function doDelete() {
  if (bulkDelete.value) {
    const count = selected.value.length
    store.deletePromotions(selected.value)
    selected.value = []
    notify(`${count} promotion${count === 1 ? '' : 's'} deleted`)
  } else if (pendingDelete.value) {
    store.deletePromotion(pendingDelete.value.id)
    notify('Promotion deleted')
  }
  pendingDelete.value = null
  bulkDelete.value = false
}

const deleteMessage = computed(() =>
  bulkDelete.value
    ? `${selected.value.length} promotion${selected.value.length === 1 ? '' : 's'} will be permanently deleted. This cannot be undone.`
    : `“${pendingDelete.value?.title}” will be permanently deleted. This cannot be undone.`
)

// ── Export CSV ──────────────────────────────────────────────────────
function exportCsv() {
  const rows = selected.value.length ? filteredPromotions.value.filter(p => selected.value.includes(p.id)) : filteredPromotions.value
  downloadCsv('Promotions_Export', rows, [
    { title: 'Name', value: 'title' },
    { title: 'Code / Automatic', value: (p) => p.mechanism === 'Code' ? (p.code ?? '') : 'Automatic' },
    { title: 'Discount Method', value: 'method' },
    { title: 'Discount Type', value: (p) => p.discountType === 'Percentage' ? `${p.value}%` : `$${p.value}` },
    { title: 'Sales Channels', value: (p) => p.salesChannels.join('; ') },
    { title: 'Start Date', value: 'startDate' },
    { title: 'End Date', value: (p) => p.endDate ?? '' },
    { title: 'Status', value: 'status' },
  ])
  notify(`Exported ${rows.length} promotion${rows.length === 1 ? '' : 's'} as CSV`)
}

// ── Table ────────────────────────────────────────────────────────
const headers = [
  { title: 'Name', key: 'title', sortable: true, minWidth: '200px' },
  { title: 'Code / Automatic', key: 'code' },
  { title: 'Discount Method', key: 'method', hideBelow: 'lg' as const },
  { title: 'Discount Type', key: 'discount' },
  { title: 'Sales Channels', key: 'salesChannels', sortable: false, hideBelow: 'lg' as const },
  { title: 'Usage', key: 'usage', hideBelow: 'md' as const },
  { title: 'Start Date', key: 'startDate', hideBelow: 'md' as const },
  { title: 'End Date', key: 'endDate', hideBelow: 'md' as const },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
]

const { visibleHeaders } = useResponsiveTableHeaders(headers)

const toast = useToast()
function notify(text: string) { toast.success(text) }

const flashMessages: Record<string, string> = {
  'promotion-created': 'Promotion created',
  'promotion-updated': 'Promotion updated',
}

onMounted(() => {
  const flash = route.query.flash
  const key = Array.isArray(flash) ? flash[0] : flash
  if (key && flashMessages[key]) {
    notify(flashMessages[key])
    router.replace({ query: {} })
  }
})
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Promotions"
      :subtitle="`${store.promotions.filter(p => p.status==='Active').length} active · ${store.promotions.reduce((a,p)=>a+p.usage,0).toLocaleString()} total uses`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openNewPromotion">New Promotion</v-btn>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="activeTab" :tabs="tabs" />

    <!-- Table Card -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="methodFilter"
        :quick-filter="methodQuickFilter"
        v-model:search="search"
        title="All Promotions"
        :active-filters="activeFilterEntries"
        :total-count="filteredPromotions.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <!-- Toolbar filters stay compact and suppress details deliberately: this is a
                 dense popover, not a form, and no select here carries validation. -->
            <MpFormGrid>
              <v-select
                v-for="(options, key) in filterOptions"
                :key="key"
                v-model="filters[key as keyof typeof filters]"
                :label="filterLabels[key]"
                :items="options"
                density="compact"
                hide-details
                clearable
              />
            </MpFormGrid>
          </div>
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="7" />

      <v-data-table
        v-else
        v-model="selected"
        :headers="visibleHeaders"
        :items="filteredPromotions"
        :search="search"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.title="{ item }">
          <div class="text-body-2 font-weight-medium">{{ item.title }}</div>
          <div v-if="item.description" class="text-caption text-medium-emphasis text-truncate" style="max-width: 220px">{{ item.description }}</div>
        </template>

        <template v-slot:item.code="{ item }">
          <v-chip v-if="item.mechanism === 'Code'" variant="outlined" color="secondary" size="small" class="font-weight-bold font-mono">{{ item.code }}</v-chip>
          <v-chip v-else variant="tonal" color="primary" size="small" prepend-icon="zap">Automatic</v-chip>
        </template>

        <template v-slot:item.method="{ item }">
          <span class="text-body-2">{{ item.method }} discount</span>
        </template>

        <template v-slot:item.discount="{ item }">
          <span class="font-weight-bold">{{ item.discountType === 'Percentage' ? `${item.value}% off` : `$${item.value} off` }}</span>
        </template>

        <template v-slot:item.salesChannels="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip v-for="ch in item.salesChannels.slice(0, 2)" :key="ch" size="x-small" variant="tonal" label>{{ ch }}</v-chip>
            <v-chip v-if="item.salesChannels.length > 2" size="x-small" variant="outlined" label>+{{ item.salesChannels.length - 2 }}</v-chip>
          </div>
        </template>

        <template v-slot:item.usage="{ item }">
          <div style="min-width: 88px">
            <span class="font-weight-bold text-body-2">{{ item.usage.toLocaleString() }}</span>
            <v-progress-linear v-if="item.limit" :model-value="(item.usage/item.limit)*100"
              :color="item.usage/item.limit>0.9?'error':'primary'" height="4" rounded class="mt-1"></v-progress-linear>
            <div v-else class="text-caption text-medium-emphasis">∞ Unlimited</div>
          </div>
        </template>

        <template v-slot:item.startDate="{ item }"><span class="text-body-2">{{ item.startDate }}</span></template>
        <template v-slot:item.endDate="{ item }"><span class="text-body-2">{{ item.endDate || 'No end date' }}</span></template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="coupon" size="sm" />
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Promotion actions">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEditPromotion(item)" />
            <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicate(item)" />
            <v-list-item
              :prepend-icon="item.status === 'Active' ? 'pause' : 'play'"
              :title="item.status === 'Active' ? 'Deactivate' : 'Activate'"
              @click="toggleActive(item)"
            />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="tag"
            :title="search || activeFilterEntries.length ? 'No promotions match your filters' : 'No promotions yet'"
            :description="search || activeFilterEntries.length ? 'Try a different search term or clear filters.' : 'Create discount codes and automatic promotions to drive sales.'"
            :action-label="!search && !activeFilterEntries.length ? 'New Promotion' : undefined"
            action-icon="plus"
            @action="openNewPromotion"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredPromotions.length"
      @clear="selected = []"
      @select-all="selectAll"
    >
      <v-btn size="small" variant="flat" color="surface" class="text-none" prepend-icon="download" rounded="lg" @click="exportCsv">Export</v-btn>
      <v-btn size="small" variant="flat" color="warning" class="text-none" prepend-icon="pause" rounded="lg" @click="bulkDeactivate">Deactivate</v-btn>
      <v-btn size="small" variant="flat" color="error" class="text-none" prepend-icon="trash-2" rounded="lg" @click="askBulkDelete">Delete</v-btn>
    </MpFloatingBulkBar>

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="bulkDelete ? 'Delete selected promotions?' : 'Delete promotion?'"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.font-mono { font-family: monospace; }
</style>
