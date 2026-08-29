<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useProductExtrasStore, formatStamp,
  type Collection, type CollectionType, type CollectionStatus,
} from '@/stores/useProductExtras'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'

/**
 * Product collections — automated (rule-driven) or manual groupings used for
 * storefront merchandising. Rebuilt from UAT; see docs/rebuild/collections/.
 */
const store = useProductExtrasStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const basePath = computed(() => `/commerce/${accountId.value}/products/collections`)

const search = ref('')
const typeFilter = ref<'All types' | CollectionType>('All types')
// Status is the promoted filter: a multi-select pill in the toolbar rather
// than a single-value select, so several values can be compared at once.
const statusQuickFilter = {
  key: 'status',
  label: 'Status',
  options: (['Active', 'Inactive']).map((v) => ({ label: v, value: v })),
}
const statusFilter = ref<string[]>([])
const parentFilter = ref<'All parents' | string>('All parents')
const selected = ref<number[]>([])

const headers = [
  { title: 'Title', key: 'title', sortable: true, minWidth: '260px' },
  { title: 'Handle', key: 'handle', sortable: true },
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Products', key: 'productCount', align: 'end' as const, sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Updated at', key: 'updatedAt', sortable: true },
  { title: '', key: 'actions', sortable: false, width: 56 },
]

const parents = computed(() => Array.from(new Set(store.collections.map((c) => c.parent))))

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return store.collections.filter((c) => {
    const byTerm = !term || c.title.toLowerCase().includes(term) || c.handle.toLowerCase().includes(term)
    const byType = typeFilter.value === 'All types' || c.type === typeFilter.value
    const byStatus = !statusFilter.value.length || statusFilter.value.includes(c.status)
    const byParent = parentFilter.value === 'All parents' || c.parent === parentFilter.value
    return byTerm && byType && byStatus && byParent
  })
})

const hasFilters = computed(() =>
  Boolean(search.value) || typeFilter.value !== 'All types'
  || statusFilter.value.length || parentFilter.value !== 'All parents',
)

function clearFilters() {
  search.value = ''
  typeFilter.value = 'All types'
  statusFilter.value = []
  parentFilter.value = 'All parents'
}

const activeFilterEntries = computed(() => {
  const entries: Array<{ key: string; label: string }> = []
  if (typeFilter.value !== 'All types') entries.push({ key: 'type', label: `Type: ${typeFilter.value}` })
  if (statusFilter.value.length) entries.push({ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` })
  if (parentFilter.value !== 'All parents') entries.push({ key: 'parent', label: `Parent: ${parentFilter.value}` })
  return entries
})

function removeFilter(key: string) {
  if (key === 'type') typeFilter.value = 'All types'
  if (key === 'status') statusFilter.value = []
  if (key === 'parent') parentFilter.value = 'All parents'
}

function ruleSummary(collection: Collection): string {
  if (collection.type !== 'Automated' || collection.rules.length === 0) return ''
  const [first] = collection.rules
  const suffix = collection.rules.length > 1 ? ` +${collection.rules.length - 1} more` : ''
  return `${first!.field} ${first!.operator.toLowerCase()} “${first!.value}”${suffix}`
}

// ── Create / edit ───────────────────────────────────────────────────
function createCollection(type: CollectionType) {
  router.push(`${basePath.value}/new?type=${type === 'Automated' ? 'automated' : 'manual'}`)
}

function openEdit(collection: Collection) {
  router.push(`${basePath.value}/${collection.id}`)
}

// ── Delete ──────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<Collection | null>(null)

function askDelete(collection: Collection) {
  pendingDelete.value = collection
  confirmDelete.value = true
}

function doDelete() {
  if (!pendingDelete.value) return
  store.deleteCollection(pendingDelete.value.id)
  selected.value = selected.value.filter((id) => id !== pendingDelete.value?.id)
  toast.success('Collection deleted')
  pendingDelete.value = null
}

// ── Bulk actions ────────────────────────────────────────────────────
const confirmBulkDelete = ref(false)

function bulkStatus(status: CollectionStatus) {
  store.setCollectionsStatus(selected.value, status)
  toast.success(`${selected.value.length} collection${selected.value.length === 1 ? '' : 's'} set to ${status.toLowerCase()}`)
  selected.value = []
}

function doBulkDelete() {
  const count = selected.value.length
  store.deleteCollections(selected.value)
  selected.value = []
  toast.success(`${count} collection${count === 1 ? '' : 's'} deleted`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Products"
      title="Collections"
      :subtitle="`${store.collections.length} collections across ${parents.length} parent${parents.length === 1 ? '' : 's'}`"
    >
      <template #actions>
        <v-menu>
          <template #activator="{ props: menu }">
            <v-btn v-bind="menu" color="primary" variant="flat" prepend-icon="plus" append-icon="chevron-down" class="text-none">
              New collection
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item
              prepend-icon="wand-sparkles"
              title="Automated collection"
              subtitle="Products join automatically when they match your rules"
              @click="createCollection('Automated')"
            />
            <v-list-item
              prepend-icon="hand"
              title="Manual collection"
              subtitle="You pick the exact products it contains"
              @click="createCollection('Manual')"
            />
          </v-list>
        </v-menu>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="statusFilter"
        :quick-filter="statusQuickFilter"
        v-model:search="search"
        title="All collections"
        search-placeholder="Search title or handle"
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
            <v-select v-model="typeFilter" :items="['All types', 'Automated', 'Manual']" label="Type" hide-details />
            <v-select v-model="parentFilter" :items="['All parents', ...parents]" label="Parent collection" hide-details />
          </MpFormGrid>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="filtered"
        :items-per-page="10"
        item-value="id"
        show-select
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template #header.data-table-select="{ allSelected, selectAll, someSelected }">
          <v-checkbox-btn
            :model-value="allSelected"
            :indeterminate="someSelected && !allSelected"
            aria-label="Select all rows"
            @update:model-value="selectAll(!allSelected)"
          />
        </template>
        <template #item.data-table-select="{ internalItem, isSelected, toggleSelect }">
          <v-checkbox-btn
            :model-value="isSelected(internalItem)"
            :aria-label="`Select ${internalItem.raw.title}`"
            @update:model-value="toggleSelect(internalItem)"
          />
        </template>
        <template #item.title="{ item }">
          <div class="py-1">
            <div class="text-body-2 font-weight-medium">{{ item.title }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ item.parent }}<template v-if="ruleSummary(item)"> · {{ ruleSummary(item) }}</template>
            </div>
          </div>
        </template>
        <template #item.handle="{ item }">
          <span class="col-mono text-body-2 text-medium-emphasis">{{ item.handle }}</span>
        </template>
        <template #item.type="{ item }">
          <v-chip size="small" variant="tonal" :color="item.type === 'Automated' ? 'primary' : 'secondary'" label>
            <v-icon start size="13">{{ item.type === 'Automated' ? 'wand-sparkles' : 'hand' }}</v-icon>
            {{ item.type }}
          </v-chip>
        </template>
        <template #item.productCount="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.productCount }}</span>
        </template>
        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>
        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatStamp(item.updatedAt) }}</span>
        </template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Collection actions" :item-label="item.title">
            <MpMenuItem icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="folder"
            :title="hasFilters ? 'No collections match your filters' : 'No collections yet'"
            :description="hasFilters ? 'Try a different search term or clear your filters.' : 'Collections group products for storefront merchandising and navigation.'"
            :action-label="hasFilters ? 'Clear filters' : 'New automated collection'"
            :action-icon="hasFilters ? 'x' : 'plus'"
            class="py-10"
            @action="hasFilters ? clearFilters() : createCollection('Automated')"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar :count="selected.length" :total="filtered.length" @clear="selected = []">
      <v-btn variant="text" class="text-none" prepend-icon="circle-check" @click="bulkStatus('Active')">Set active</v-btn>
      <v-btn variant="text" class="text-none" prepend-icon="circle-pause" @click="bulkStatus('Inactive')">Set inactive</v-btn>
      <v-btn variant="text" class="text-none text-error" prepend-icon="trash-2" @click="confirmBulkDelete = true">Delete</v-btn>
    </MpFloatingBulkBar>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete this collection?"
      :message="`“${pendingDelete?.title}” is removed from your storefront. Its products aren't deleted.`"
      confirm-label="Delete collection"
      danger
      @confirm="doDelete"
    />

    <MpConfirmDialog
      v-model="confirmBulkDelete"
      title="Delete selected collections?"
      :message="`${selected.length} collection${selected.length === 1 ? '' : 's'} will be removed from your storefront. Their products aren't deleted.`"
      confirm-label="Delete collections"
      danger
      @confirm="doBulkDelete"
    />
  </div>
</template>

<style scoped>
.col-mono {
  font-family: var(--mp-fontFamily-mono);
}
</style>
