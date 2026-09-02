<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useCommerceStore, type DraftOrder } from '@/stores/useCommerce'
import { downloadCsv } from '@/utils/exportCsv'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import { useToast } from '@/composables/useToast'

const store = useCommerceStore()
const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)
const search = ref('')
const selected = ref<number[]>([])
const { loading } = useInitialLoad()

const toast = useToast()
function notify(text: string) { toast.success(text) }

// ── Navigation to the full-page composer ─────────────────────────
function goCreate() {
  router.push({ name: 'CreateDraftOrder', params: { accountId: accountId.value } })
}
function goEdit(draft: DraftOrder) {
  router.push({ name: 'EditDraftOrder', params: { accountId: accountId.value, draftId: String(draft.id) } })
}

// ── Filters ──────────────────────────────────────────────────────
// Status is this table's only filter, so it lives in the toolbar as a pill and
// there is no drawer at all.
const statusQuickFilter = {
  key: 'status',
  label: 'Status',
  options: ['Open', 'Invoice Sent'].map((v) => ({ label: v, value: v })),
}
const statusFilter = ref<string[]>([])

const filteredDrafts = computed(() => {
  let drafts = store.draftOrders
  if (statusFilter.value.length) drafts = drafts.filter(d => statusFilter.value.includes(d.status))
  return drafts
})

const activeFilterEntries = computed(() =>
  statusFilter.value.length ? [{ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` }] : [],
)

function clearAllFilters() {
  statusFilter.value = []
}

function selectAll() {
  selected.value = filteredDrafts.value.map(d => d.id)
}

// ── Row / bulk actions ───────────────────────────────────────────
function sendInvoice(draft: DraftOrder) {
  store.setDraftOrderStatus(draft.id, 'Invoice Sent')
  notify(`Invoice sent for ${draft.draftNumber}`)
}

function sendInvoicesBulk() {
  selected.value.forEach(id => store.setDraftOrderStatus(id, 'Invoice Sent'))
  notify(`Invoice sent for ${selected.value.length} draft${selected.value.length === 1 ? '' : 's'}`)
  selected.value = []
}

const deleteDialog = ref(false)
const pendingDelete = ref<DraftOrder | null>(null)
const bulkDelete = ref(false)
function askDeleteRow(draft: DraftOrder) {
  pendingDelete.value = draft
  bulkDelete.value = false
  deleteDialog.value = true
}
function askDeleteBulk() {
  pendingDelete.value = null
  bulkDelete.value = true
  deleteDialog.value = true
}
const deleteMessage = computed(() =>
  bulkDelete.value
    ? `Delete ${selected.value.length} selected draft${selected.value.length === 1 ? '' : 's'}? This cannot be undone.`
    : `Delete ${pendingDelete.value?.draftNumber ?? ''} for ${pendingDelete.value?.customer ?? 'Guest'}? This cannot be undone.`,
)
function confirmDelete() {
  if (bulkDelete.value) {
    store.deleteDraftOrders([...selected.value])
    notify('Drafts deleted')
    selected.value = []
  } else if (pendingDelete.value) {
    store.deleteDraftOrders([pendingDelete.value.id])
    notify(`${pendingDelete.value.draftNumber} deleted`)
  }
}

// Export the currently visible rows
function exportDrafts() {
  downloadCsv('draft-orders', filteredDrafts.value, [
    { title: 'Draft', value: 'draftNumber' },
    { title: 'Contact', value: 'customer' },
    { title: 'Email', value: 'email' },
    { title: 'Sales Channel', value: 'salesChannel' },
    { title: 'Items', value: 'items' },
    { title: 'Total', value: 'total' },
    { title: 'Status', value: 'status' },
    { title: 'Date Added', value: 'createdAt' },
  ])
  notify(`Exported ${filteredDrafts.value.length} drafts`)
}

// Table — legacy columns: Draft | Contact | Sales Channel | Total | Date Added | Actions
const headers = [
  { title: 'Draft', key: 'draftNumber', sortable: true },
  { title: 'Contact', key: 'customer' },
  { title: 'Sales Channel', key: 'salesChannel', hideBelow: 'md' as const },
  { title: 'Items', key: 'items', align: 'center' as const, hideBelow: 'lg' as const },
  { title: 'Total', key: 'total', align: 'end' as const },
  { title: 'Status', key: 'status' },
  { title: 'Date Added', key: 'createdAt', hideBelow: 'md' as const },
  { title: '', key: 'actions', align: 'end' as const, sortable: false, width: 48 },
]

const { visibleHeaders } = useResponsiveTableHeaders(headers)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Draft Orders"
      :subtitle="`${store.draftOrders.length} drafts · Create manual orders on behalf of customers`"
    >
      <template #actions>
        <v-btn variant="outlined" prepend-icon="download" class="text-none" @click="exportDrafts">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="goCreate">New Draft Order</v-btn>
      </template>
    </MpPageHeader>

    <!-- Table Card -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:quick-filter-value="statusFilter"
        title="All Draft Orders"
        :quick-filter="statusQuickFilter"
        :active-filters="activeFilterEntries"
        :total-count="filteredDrafts.length"
        @remove-filter="clearAllFilters"
        @clear-filters="clearAllFilters"
      />

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
        v-model="selected"
        :headers="visibleHeaders"
        :items="filteredDrafts"
        :search="search"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1 drafts-table"
        @click:row="(_e: unknown, { item }: { item: DraftOrder }) => goEdit(item)"
      >
        <template v-slot:item.draftNumber="{ item }">
          <span class="font-weight-bold text-primary">{{ item.draftNumber }}</span>
        </template>
        <template v-slot:item.customer="{ item }">
          <div class="py-1">
            <div class="text-body-2 font-weight-medium">{{ item.customer || 'Guest' }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.email || '—' }}</div>
          </div>
        </template>
        <template v-slot:item.salesChannel="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ item.salesChannel }}</span>
        </template>
        <template v-slot:item.total="{ item }">
          <span class="font-weight-bold">${{ parseFloat(item.total || '0').toFixed(2) }}</span>
        </template>
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>
        <template v-slot:item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Draft order actions" :itemLabel="item.draftNumber">
              <MpMenuItem icon="pencil" title="Edit draft" @click="goEdit(item)"></MpMenuItem>
              <MpMenuItem icon="send" title="Send invoice" :disabled="item.status === 'Invoice Sent'" @click="sendInvoice(item)"></MpMenuItem>
              <v-divider class="my-1" />
              <MpMenuItem icon="trash-2" title="Delete" danger @click="askDeleteRow(item)"></MpMenuItem>
            </MpRowActionsMenu>
          </div>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="shopping-cart"
            :title="search || activeFilterEntries.length ? 'No draft orders match' : 'No draft orders yet'"
            :description="search || activeFilterEntries.length ? 'Try a different search term or clear the filters.' : 'Create a manual order for a customer or wholesale buyer.'"
            :action-label="!search && !activeFilterEntries.length ? 'New Draft Order' : undefined"
            action-icon="plus"
            @action="goCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredDrafts.length"
      @clear="selected = []"
      @select-all="selectAll"
    >
      <v-btn size="small" variant="flat" color="primary" class="text-none" prepend-icon="send" rounded="lg" @click="sendInvoicesBulk">Send Invoice</v-btn>
      <v-btn size="small" variant="flat" color="error" class="text-none" prepend-icon="trash-2" rounded="lg" @click="askDeleteBulk">Delete Drafts</v-btn>
    </MpFloatingBulkBar>

    <!-- Delete confirmation (row + bulk) -->
    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete draft order?"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
/* Row click opens the composer for editing */
.drafts-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
