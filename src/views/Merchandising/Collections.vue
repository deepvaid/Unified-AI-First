<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import {
  useMerchandisingStore,
  COLLECTION_FILTER_LABELS,
  type CollectionFilterType,
  type SmartCollection,
} from '@/stores/useMerchandising'

const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()
const search = ref('')

/** Open the collection configuration editor (Shopify Filters / Activation / Sorting). */
function editCollection(collection: SmartCollection) {
  router.push({ name: 'MerchandisingChannelCollectionEdit', params: { accountId: route.params.accountId, channelId: route.params.channelId, collectionId: collection.id } })
}

/** Open the channel-scoped pinning editor for this collection. */
function editPins(collection: SmartCollection) {
  const existing = store.pinningRuleList.find((r) => r.collectionId === collection.id)
  router.push({
    name: 'MerchandisingChannelPinning',
    params: { accountId: route.params.accountId, channelId: route.params.channelId, ruleId: existing?.id ?? 'new' },
    query: existing ? undefined : { collection: collection.id },
  })
}
const filterType = ref<'all' | 'manual' | 'synced'>('all')

const headers = [
  { title: 'Status', key: 'status', sortable: false, width: 150 },
  { title: 'Collection', key: 'name', sortable: true },
  { title: 'Filter Type', key: 'filterType', sortable: false, width: 160 },
  { title: 'Last Update', key: 'updatedAt', sortable: true, align: 'end' as const, width: 220 },
  { title: '', key: 'actions', sortable: false, width: 64 },
]

const filteredCollections = computed(() => {
  let rows = store.collectionList
  if (filterType.value !== 'all') rows = rows.filter((c) => c.filterType === filterType.value)
  return rows
})

const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) {
  snackbar.value = { visible: true, message }
}

function onToggle(collection: SmartCollection) {
  store.toggleCollectionStatus(collection.id)
}

function duplicate(collection: SmartCollection) {
  const copy = store.duplicateCollection(collection.id)
  if (copy) showToast(`Collection duplicated as “${copy.name}”`)
}

/* ── Delete confirm ────────────────────────────────────────────── */
const confirmDeleteOpen = ref(false)
const pendingDelete = ref<SmartCollection | null>(null)

function askDelete(collection: SmartCollection) {
  pendingDelete.value = collection
  confirmDeleteOpen.value = true
}

function doDelete() {
  if (pendingDelete.value) {
    store.deleteCollection(pendingDelete.value.id)
    showToast(`Collection “${pendingDelete.value.name}” deleted`)
  }
  pendingDelete.value = null
}

/* ── Create collection drawer ─────────────────────────────────── */
const createDrawer = ref(false)
const newCollection = ref<{ name: string; filterType: CollectionFilterType }>({ name: '', filterType: 'manual' })

function openCreate() {
  newCollection.value = { name: '', filterType: 'manual' }
  createDrawer.value = true
}

function submitCreate() {
  const name = newCollection.value.name.trim()
  if (!name) return
  store.createCollection({ name, filterType: newCollection.value.filterType })
  createDrawer.value = false
  showToast(`Collection “${name}” created`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Collections"
      :subtitle="`${store.collectionList.length} smart collections · ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="plus"
          @click="openCreate"
        >
          Create collection
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        search-placeholder="Filter collections…"
        :total-count="filteredCollections.length"
      >
        <template #filter-content>
          <v-select
            v-model="filterType"
            label="Filter type"
            density="comfortable"
            variant="outlined"
            hide-details
            :items="[
              { title: 'All types', value: 'all' },
              { title: 'Manual', value: 'manual' },
              { title: 'Synced', value: 'synced' },
            ]"
          />
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="headers"
        :items="filteredCollections"
        :search="search"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="20"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.status="{ item }">
          <MpStatusChip :status="item.status === 'active' ? 'Active' : 'Inactive'" type="general" size="x-small" variant="flat" />
        </template>

        <template #item.name="{ item }">
          <a class="font-weight-bold text-body-2 text-primary cursor-pointer" @click="editCollection(item)">{{ item.name }}</a>
        </template>

        <template #item.filterType="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ COLLECTION_FILTER_LABELS[item.filterType] }}</span>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.updatedAt }}</span>
        </template>

        <template #item.actions="{ item }">
          <v-menu>
            <template #activator="{ props: activator }">
              <v-btn
                v-bind="activator"
                icon="more-vertical"
                variant="text"
                size="x-small"
                class="text-medium-emphasis"
                aria-label="Row actions"
              />
            </template>
            <v-list density="compact" min-width="180">
              <v-list-item prepend-icon="pencil" title="Edit collection" @click="editCollection(item)" />
              <v-list-item prepend-icon="pin" title="Edit pins" @click="editPins(item)" />
              <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicate(item)" />
              <v-list-item
                :prepend-icon="item.status === 'active' ? 'circle-pause' : 'circle-play'"
                :title="item.status === 'active' ? 'Disable' : 'Enable'"
                @click="onToggle(item)"
              />
              <v-divider />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
            </v-list>
          </v-menu>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="layers"
            :title="search ? 'No collections match your search' : 'No collections yet'"
            :description="search ? 'Try a different keyword or clear filters.' : 'Create your first smart collection to start merchandising.'"
            :action-label="!search ? 'Create collection' : undefined"
            action-icon="plus"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create collection drawer -->
    <MpFormDrawer v-model="createDrawer" title="Create collection" subtitle="Add a smart collection to this store">
      <v-text-field
        v-model="newCollection.name"
        label="Collection name"
        placeholder="collections/summer-sale"
        variant="outlined"
        density="comfortable"
        class="mb-3"
        autofocus
      />
      <v-select
        v-model="newCollection.filterType"
        label="Filter type"
        :items="[
          { title: 'Manual — curate products by hand', value: 'manual' },
          { title: 'Synced — mirrors your store platform', value: 'synced' },
        ]"
        variant="outlined"
        density="comfortable"
        hint="Manual collections can be pinned and merchandised in Default Merchandising"
        persistent-hint
      />
      <template #footer>
        <v-btn variant="text" class="text-none" @click="createDrawer = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="plus"
          :disabled="!newCollection.name.trim()"
          @click="submitCreate"
        >
          Create collection
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDeleteOpen"
      title="Delete collection?"
      :message="`“${pendingDelete?.name}” will be permanently deleted. This cannot be undone.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
