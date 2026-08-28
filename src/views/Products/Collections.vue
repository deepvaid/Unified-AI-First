<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProductExtrasStore, type Collection, type CollectionType } from '@/stores/useProductExtras'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const store = useProductExtrasStore()
const search = ref('')
const toast = useToast()

const TYPES: CollectionType[] = ['Automated', 'Manual']
const STATUSES = ['Active', 'Draft'] as const

const headers = [
  { title: 'Title', key: 'title', sortable: true, minWidth: '220px' },
  { title: 'Handle', key: 'handle' },
  { title: 'Type', key: 'type' },
  { title: 'Products', key: 'productCount', align: 'end' as const, sortable: true },
  { title: 'Status', key: 'status' },
  { title: 'Updated at', key: 'updatedAt', sortable: true },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// ── Filters ────────────────────────────────────────────────────────────
const filters = ref({ type: [] as string[], status: [] as string[] })
const filterLabels: Record<string, string> = { type: 'Type', status: 'Status' }
const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v.length > 0)
    .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${(value as string[]).join(', ')}` })),
)
function removeFilter(key: string) { filters.value[key as keyof typeof filters.value] = [] }
function clearAllFilters() { filters.value = { type: [], status: [] } }

const filteredCollections = computed(() => {
  let items = store.collections
  if (filters.value.type.length) items = items.filter(c => filters.value.type.includes(c.type))
  if (filters.value.status.length) items = items.filter(c => filters.value.status.includes(c.status))
  return items
})

// ── Create / Edit drawer ─────────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const form = ref<{ title: string; handle: string; type: CollectionType; status: 'Active' | 'Draft' }>({
  title: '', handle: '', type: 'Automated', status: 'Active',
})
const handleEdited = ref(false)

// Keep the handle in sync with the title until the user edits it directly.
watch(() => form.value.title, (title) => {
  if (!handleEdited.value) form.value.handle = store.toHandle(title)
})

function openCreate() {
  editingId.value = null
  form.value = { title: '', handle: '', type: 'Automated', status: 'Active' }
  handleEdited.value = false
  drawer.value = true
}
function openEdit(collection: Collection) {
  editingId.value = collection.id
  form.value = { title: collection.title, handle: collection.handle, type: collection.type, status: collection.status }
  handleEdited.value = true
  drawer.value = true
}
function saveCollection() {
  const payload = {
    title: form.value.title.trim() || 'Untitled collection',
    handle: form.value.handle.trim(),
    type: form.value.type,
    status: form.value.status,
  }
  if (editingId.value !== null) {
    store.updateCollection(editingId.value, payload)
    toast.success('Collection updated')
  } else {
    store.addCollection(payload)
    toast.success('Collection created')
  }
  drawer.value = false
}

// ── Delete ────────────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<Collection | null>(null)
function askDelete(collection: Collection) {
  pendingDelete.value = collection
  confirmDelete.value = true
}
function doDelete() {
  if (pendingDelete.value) {
    store.deleteCollection(pendingDelete.value.id)
    toast.success('Collection deleted')
  }
  pendingDelete.value = null
}

// ── Export ──────────────────────────────────────────────────────────────
function exportCollections() {
  downloadCsv('collections', filteredCollections.value, [
    { title: 'Title', value: 'title' },
    { title: 'Handle', value: 'handle' },
    { title: 'Type', value: 'type' },
    { title: 'Products', value: 'productCount' },
    { title: 'Status', value: 'status' },
    { title: 'Updated at', value: 'updatedAt' },
  ])
}

</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Collections"
      :subtitle="`${store.collections.length} collections`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCollections">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Collection</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Collections"
        :active-filters="activeFilterEntries"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <!-- Filter popover: `hide-details` is deliberate — these selects can never
             carry a hint or an error, and the popover is a dense surface. -->
        <template #filter-content>
          <div class="pa-4">
            <MpFormGrid>
              <MpFormSection title="Filter by" />
              <v-select v-model="filters.type" :items="[...TYPES] as string[]" label="Type" multiple chips closable-chips hide-details />
              <v-select v-model="filters.status" :items="[...STATUSES] as string[]" label="Status" multiple chips closable-chips hide-details />
            </MpFormGrid>
          </div>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="headers"
        :items="filteredCollections"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.title="{ item }">
          <div class="py-1">
            <div class="text-body-2 font-weight-medium">{{ item.title }}</div>
            <div v-if="item.root" class="text-caption text-medium-emphasis">Root</div>
          </div>
        </template>
        <template v-slot:item.handle="{ item }">
          <span class="text-body-2 font-mono text-medium-emphasis">{{ item.handle }}</span>
        </template>
        <template v-slot:item.type="{ item }">
          <v-chip size="small" variant="tonal" :color="item.type === 'Automated' ? 'primary' : 'secondary'" label>
            <v-icon start size="13">{{ item.type === 'Automated' ? 'wand-sparkles' : 'hand' }}</v-icon>
            {{ item.type }}
          </v-chip>
        </template>
        <template v-slot:item.productCount="{ item }">
          <span class="font-weight-medium">{{ item.productCount }}</span>
        </template>
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" />
        </template>
        <template v-slot:item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.updatedAt }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Collection actions">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="folder"
            :title="search || activeFilterEntries.length ? 'No collections match your filters' : 'No collections yet'"
            :description="search || activeFilterEntries.length ? 'Try a different search term or clear your filters.' : 'Create a collection to group and merchandise your products.'"
            :action-label="search || activeFilterEntries.length ? undefined : 'New Collection'"
            :action-icon="search || activeFilterEntries.length ? undefined : 'plus'"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / Edit drawer -->
    <MpFormDrawer
      v-model="drawer"
      :title="editingId !== null ? 'Edit Collection' : 'New Collection'"
      subtitle="Group products for merchandising and navigation"
    >
      <MpFormGrid>
        <v-text-field v-model="form.title" label="Title" />
        <v-text-field
          v-model="form.handle"
          label="Handle"
          prefix="/"
          hint="Auto-generated from the title — edit to override"
          persistent-hint
          @update:model-value="handleEdited = true"
        />
        <v-select v-model="form.type" :items="TYPES" label="Type" />
        <v-select v-model="form.status" :items="[...STATUSES] as string[]" label="Status" />
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="saveCollection">
          {{ editingId !== null ? 'Save Changes' : 'Create Collection' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete collection?"
      :message="`“${pendingDelete?.title}” will be permanently deleted. This cannot be undone.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.font-mono { font-family: monospace; }
</style>
