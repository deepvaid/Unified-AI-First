<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import { useToast } from '@/composables/useToast'
import {
  useMerchandisingStore,
  COLLECTION_FILTER_LABELS,
  type CollectionFilterType,
  type SmartCollection,
} from '@/stores/useMerchandising'

const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()
const toast = useToast()
const search = ref('')

/** Route to the collection configuration editor (Shopify Filters / Activation / Sorting). */
function collectionRoute(collection: SmartCollection) {
  return { name: 'MerchandisingChannelCollectionEdit', params: { accountId: route.params.accountId, channelId: route.params.channelId, collectionId: collection.id } }
}

function editCollection(collection: SmartCollection) {
  router.push(collectionRoute(collection))
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
// Type is the promoted filter: a multi-select pill in the toolbar rather
// than a single-value select, so several values can be compared at once.
const filterTypeQuickFilter = computed(() => ({
  key: 'type',
  label: 'Type',
  options: ([
              { title: 'All types', value: 'all' },
              { title: 'Manual', value: 'manual' },
              { title: 'Synced', value: 'synced' },
            ])
    .filter((o) => o.value !== 'all')
    .map((o) => ({ label: o.title, value: o.value })),
}))
const filterType = ref<string[]>([])

const headers = [
  { title: 'Status', key: 'status', sortable: false, width: 150 },
  { title: 'Collection', key: 'name', sortable: true },
  { title: 'Filter Type', key: 'filterType', sortable: false, width: 160 },
  { title: 'Last Update', key: 'updatedAt', sortable: true, align: 'end' as const, width: 220 },
  { title: '', key: 'actions', sortable: false, width: 64 },
]

const filteredCollections = computed(() => {
  let rows = store.collectionList
  if (filterType.value.length) rows = rows.filter((c) => filterType.value.includes(c.filterType))
  return rows
})

function onToggle(collection: SmartCollection) {
  store.toggleCollectionStatus(collection.id)
}

function duplicate(collection: SmartCollection) {
  const copy = store.duplicateCollection(collection.id)
  if (copy) toast.info(`Collection duplicated as “${copy.name}”`)
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
    toast.info(`Collection “${pendingDelete.value.name}” deleted`)
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
  toast.info(`Collection “${name}” created`)
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
        v-model:quick-filter-value="filterType"
        :quick-filter="filterTypeQuickFilter"
        v-model:search="search"
        search-placeholder="Filter collections…"
        :total-count="filteredCollections.length"
      />

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
          <MpStatusChip :status="item.status === 'active' ? 'Active' : 'Inactive'" type="general" size="sm" />
        </template>

        <template #item.name="{ item }">
          <router-link class="font-weight-bold text-body-2 text-primary collection-link" :to="collectionRoute(item)">{{ item.name }}</router-link>
        </template>

        <template #item.filterType="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ COLLECTION_FILTER_LABELS[item.filterType] }}</span>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.updatedAt }}</span>
        </template>

        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Collection actions" :item-label="item.name">
            <MpMenuItem icon="pencil" title="Edit collection" @click="editCollection(item)" />
            <MpMenuItem icon="pin" title="Edit pins" @click="editPins(item)" />
            <MpMenuItem icon="copy" title="Duplicate" @click="duplicate(item)" />
            <MpMenuItem
              :icon="item.status === 'active' ? 'circle-pause' : 'circle-play'"
              :title="item.status === 'active' ? 'Disable' : 'Enable'"
              @click="onToggle(item)"
            />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
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
      <MpFormGrid>
        <v-text-field
          v-model="newCollection.name"
          label="Collection name *"
          placeholder="collections/summer-sale"
          autofocus
        />
        <v-select
          v-model="newCollection.filterType"
          label="Filter type"
          :items="[
            { title: 'Manual — curate products by hand', value: 'manual' },
            { title: 'Synced — mirrors your store platform', value: 'synced' },
          ]"
          hint="Manual collections can be pinned and merchandised in Default Merchandising"
          persistent-hint
        />
      </MpFormGrid>
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

  </div>
</template>

<style scoped>
.collection-link {
  text-decoration: none;
}
.collection-link:hover {
  text-decoration: underline;
}
.collection-link:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--mp-radius-4);
}
</style>
