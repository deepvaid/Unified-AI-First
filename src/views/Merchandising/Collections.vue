<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import {
  useMerchandisingStore,
  COLLECTION_FILTER_LABELS,
  type SmartCollection,
} from '@/stores/useMerchandising'

const store = useMerchandisingStore()
const search = ref('')
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
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Collections"
      :subtitle="`Smart collections curated for ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-btn variant="outlined" class="text-none" prepend-icon="filter">Filter</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="plus"
          @click="showToast('Create collection — coming soon')"
        >
          Create collection
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Collections"
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
          <div class="d-flex align-center gap-2">
            <v-switch
              :model-value="item.status === 'active'"
              color="success"
              density="compact"
              hide-details
              :aria-label="`Toggle ${item.name}`"
              @update:model-value="onToggle(item)"
            />
            <span
              class="text-caption font-weight-medium"
              :class="item.status === 'active' ? 'text-success' : 'text-medium-emphasis'"
            >
              {{ item.status === 'active' ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </template>

        <template #item.name="{ item }">
          <span class="font-weight-medium text-body-2">{{ item.name }}</span>
        </template>

        <template #item.filterType="{ item }">
          <v-chip
            size="x-small"
            variant="tonal"
            :color="item.filterType === 'synced' ? 'success' : 'secondary'"
            class="font-weight-medium"
          >
            {{ COLLECTION_FILTER_LABELS[item.filterType] }}
          </v-chip>
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
                color="medium-emphasis"
                aria-label="Row actions"
              />
            </template>
            <v-list density="compact" min-width="180">
              <v-list-item prepend-icon="pencil" title="Edit" @click="showToast('Edit — coming soon')" />
              <v-list-item prepend-icon="copy" title="Duplicate" @click="showToast('Duplicated')" />
              <v-list-item
                :prepend-icon="item.status === 'active' ? 'circle-pause' : 'circle-play'"
                :title="item.status === 'active' ? 'Disable' : 'Enable'"
                @click="onToggle(item)"
              />
              <v-divider />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="showToast('Deleted')" />
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
            @action="showToast('Create collection — coming soon')"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>
