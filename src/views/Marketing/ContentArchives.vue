<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useContentStore, type ContentItem } from '@/stores/useContent'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * Archives. Rebuilt from UAT `/archive?filter=contents`;
 * see docs/rebuild/email-content/.
 *
 * The source breadcrumbs this page under `Settings > Archives` — the wrong
 * parent — and offers no route back to Email Content. Here it is a child of
 * Email Content, which is the only place that links to it.
 */
const store = useContentStore()
const { archivedItems } = storeToRefs(store)
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const listPath = computed(() => `/accounts/${accountId.value}/contents`)

// The source's archive is shared across five record types, selected by a filter.
const TYPE_OPTIONS = ['Content', 'Dynamic Content', 'Campaign Tag', 'Contact List', 'Segment']
const recordType = ref('Content')
const search = ref('')
const selected = ref<number[]>([])

const headers = [
  { title: 'Name', key: 'name', sortable: true, minWidth: '260px' },
  { title: 'Editor type', key: 'editorType', minWidth: '150px' },
  { title: 'Archived from', key: 'folderId', minWidth: '160px' },
  { title: 'Updated at', key: 'updatedAt', sortable: true, minWidth: '150px' },
  { title: '', key: 'actions', sortable: false, width: 56 },
]

const items = computed(() => {
  if (recordType.value !== 'Content') return []
  const term = search.value.trim().toLowerCase()
  return archivedItems.value.filter(i => !term || i.name.toLowerCase().includes(term))
})

function formatDate(iso: string) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function restore(ids: number[]) {
  store.setArchived(ids, false)
  selected.value = selected.value.filter(id => !ids.includes(id))
  toast.success(ids.length === 1 ? 'Content restored' : `${ids.length} items restored`)
}

const confirmDelete = ref(false)
const pendingDeleteIds = ref<number[]>([])

function askDelete(ids: number[]) {
  pendingDeleteIds.value = ids
  confirmDelete.value = true
}

function doDelete() {
  const ids = pendingDeleteIds.value
  store.removeContent(ids)
  selected.value = selected.value.filter(id => !ids.includes(id))
  toast.success(ids.length === 1 ? 'Content deleted' : `${ids.length} items deleted`)
  pendingDeleteIds.value = []
}

function previewContent(item: ContentItem) {
  router.push({ name: 'EmailContentPreview', params: { accountId: accountId.value, id: String(item.id) } })
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Email Content"
      title="Archives"
      subtitle="Archived records stay out of your working lists, and can be restored at any time"
      :back-to="listPath"
      back-label="Back to Email Content"
    />

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Archived records"
        search-placeholder="Search archived records"
        :total-count="items.length"
      >
        <template #actions>
          <v-select
            v-model="recordType"
            :items="TYPE_OPTIONS"
            label="Record type"
            density="compact"
            hide-details
            class="ca-type"
          />
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        item-value="id"
        show-select
        :items-per-page="10"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template #header.data-table-select="{ allSelected, selectAll, someSelected }">
          <v-checkbox-btn
            :model-value="allSelected"
            :indeterminate="someSelected && !allSelected"
            aria-label="Select all archived records on this page"
            @update:model-value="selectAll(!allSelected)"
          />
        </template>
        <template #item.data-table-select="{ internalItem, isSelected, toggleSelect }">
          <v-checkbox-btn
            :model-value="isSelected(internalItem)"
            :aria-label="`Select ${internalItem.raw.name}`"
            @update:model-value="toggleSelect(internalItem)"
          />
        </template>

        <template #item.name="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
        </template>
        <template #item.editorType="{ item }">
          <MpStatusChip :status="item.editorType" type="general" size="sm" variant="tonal" />
        </template>
        <template #item.folderId="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.folderId ? 'A folder' : 'Unfiled' }}</span>
        </template>
        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.updatedAt) }}</span>
        </template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Archived record actions" :item-label="item.name">
            <MpMenuItem icon="undo-2" title="Restore" @click="restore([item.id])" />
            <MpMenuItem icon="eye" title="Preview" @click="previewContent(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete([item.id])" />
          </MpRowActionsMenu>
        </template>

        <template #no-data>
          <MpEmptyState
            :icon="search ? 'search-x' : 'archive'"
            :title="search ? 'No archived records match your search' : 'You have no archived items'"
            :description="search
              ? 'Try a different search term.'
              : `Archive outdated ${recordType.toLowerCase()} to keep your working lists tidy. Nothing is deleted — you can restore it whenever you need it.`"
            :action-label="search ? 'Clear search' : undefined"
            class="py-10"
            @action="search = ''"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar :count="selected.length" :total="items.length" @clear="selected = []">
      <v-btn variant="text" class="text-none" prepend-icon="undo-2" @click="restore([...selected])">
        Restore
      </v-btn>
      <v-btn variant="text" class="text-none" prepend-icon="trash-2" @click="askDelete([...selected])">
        Delete
      </v-btn>
    </MpFloatingBulkBar>

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="pendingDeleteIds.length === 1 ? 'Delete this record?' : `Delete ${pendingDeleteIds.length} records?`"
      message="Deleting removes the record permanently. Leaving it archived keeps it recoverable."
      confirm-label="Delete permanently"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.ca-type {
  max-width: 220px;
}
</style>
