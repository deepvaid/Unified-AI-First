<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useContentStore, type ContentItem } from '@/stores/useContent'
import { useFoldersStore } from '@/stores/useFolders'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFolderSelect from '@/components/MpFolderSelect.vue'
import MpManageFoldersDrawer from '@/components/MpManageFoldersDrawer.vue'
import MpMoveToFolderDialog from '@/components/MpMoveToFolderDialog.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * Email Content list. Rebuilt from UAT `/contents`; see docs/rebuild/email-content/.
 *
 * The source holds 489 records behind 49 pages of 10 with no search of any kind.
 * That is the defining problem of the page and the first thing fixed here.
 */
const store = useContentStore()
const foldersStore = useFoldersStore()
const { activeItems } = storeToRefs(store)
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))

// ── Filters — all routable ───────────────────────────────────────────
const search = ref(String(route.query.q ?? ''))
const selectedFolderId = ref<string | null>((route.query.folder as string) ?? null)
const editorQuickFilter = {
  key: 'editorType',
  label: 'Editor type',
  options: [
    { label: 'Drag & Drop', value: 'Drag & Drop' },
    { label: 'WYSIWYG', value: 'WYSIWYG' },
    { label: 'HTML Code Editor', value: 'HTML Code Editor' },
    { label: 'Pull from URL', value: 'Pull from URL' },
  ],
}
const editorFilter = ref<string[]>([])

watch([search, selectedFolderId], () => {
  router.replace({
    query: {
      ...route.query,
      q: search.value.trim() || undefined,
      folder: selectedFolderId.value ?? undefined,
    },
  })
})

const contentFolders = computed(() => foldersStore.foldersByScope('contents'))
const folderCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const folder of contentFolders.value) {
    const ids = [folder.id, ...foldersStore.childrenOf(folder.id).map(f => f.id)]
    counts[folder.id] = activeItems.value.filter(i => i.folderId && ids.includes(i.folderId)).length
  }
  return counts
})

const activeFilterEntries = computed(() => {
  const entries: Array<{ key: string; label: string }> = []
  const folder = foldersStore.getFolder(selectedFolderId.value)
  if (folder) entries.push({ key: 'folder', label: `Folder: ${folder.name}` })
  if (editorFilter.value.length) entries.push({ key: 'editorType', label: `Editor: ${editorFilter.value.join(', ')}` })
  return entries
})

function removeFilter(key: string) {
  if (key === 'folder') selectedFolderId.value = null
  if (key === 'editorType') editorFilter.value = []
}

function clearAllFilters() {
  selectedFolderId.value = null
  editorFilter.value = []
  search.value = ''
}

const hasFilters = computed(() => activeFilterEntries.value.length > 0 || Boolean(search.value.trim()))

const items = computed(() => {
  const term = search.value.trim().toLowerCase()
  const folderIds = selectedFolderId.value
    ? [selectedFolderId.value, ...foldersStore.childrenOf(selectedFolderId.value).map(f => f.id)]
    : null
  return activeItems.value.filter((item) => {
    if (folderIds && (!item.folderId || !folderIds.includes(item.folderId))) return false
    if (editorFilter.value.length && !editorFilter.value.includes(item.editorType)) return false
    if (term && !item.name.toLowerCase().includes(term)) return false
    return true
  })
})

// ── Table ────────────────────────────────────────────────────────────
const loading = ref(false)
const loadError = ref(false)
const selected = ref<number[]>([])

const headers = [
  { title: 'Name', key: 'name', sortable: true, minWidth: '260px' },
  { title: 'Editor type', key: 'editorType', sortable: true, minWidth: '150px' },
  { title: 'Used by', key: 'usedByCampaigns', sortable: true, minWidth: '120px' },
  { title: 'Updated at', key: 'updatedAt', sortable: true, minWidth: '150px' },
  { title: 'Created at', key: 'createdAt', sortable: true, minWidth: '150px' },
  { title: '', key: 'actions', sortable: false, width: 56 },
]

function formatDate(iso: string) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  return new Date(t).toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function editContent(item: ContentItem) {
  router.push({
    name: 'EmailContentEditor',
    params: { accountId: accountId.value, id: String(item.id) },
  })
}

function previewContent(item: ContentItem) {
  router.push({ name: 'EmailContentPreview', params: { accountId: accountId.value, id: String(item.id) } })
}

function createCampaignFrom(item: ContentItem) {
  router.push({
    name: 'CreateEmailCampaign',
    params: { accountId: accountId.value },
    query: { contentId: String(item.id) },
  })
}

function newContent() {
  router.push({ name: 'ContentTemplates', params: { accountId: accountId.value } })
}

function openTemplates() {
  router.push({ name: 'ContentTemplates', params: { accountId: accountId.value }, query: { tab: 'mine' } })
}

function doDuplicate(item: ContentItem) {
  const copy = store.cloneContent(item.id)
  if (copy) toast.success(`"${copy.name}" created`)
}

// ── Archive ──────────────────────────────────────────────────────────
function archive(ids: number[]) {
  store.setArchived(ids, true)
  selected.value = selected.value.filter(id => !ids.includes(id))
  toast.success(
    ids.length === 1 ? 'Content archived' : `${ids.length} items archived`,
    { action: { label: 'Undo', onClick: () => store.setArchived(ids, false) } },
  )
}

// ── Delete ───────────────────────────────────────────────────────────
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

const deleteMessage = computed(() => {
  const ids = pendingDeleteIds.value
  const inUse = activeItems.value.filter(i => ids.includes(i.id) && i.usedByCampaigns > 0)
  const base = ids.length === 1
    ? 'This email body is removed permanently. Archiving keeps it out of the way but recoverable.'
    : `These ${ids.length} email bodies are removed permanently. Archiving keeps them out of the way but recoverable.`
  if (!inUse.length) return base
  const campaigns = inUse.reduce((sum, i) => sum + i.usedByCampaigns, 0)
  return `${base}\n\n${inUse.length === 1 ? 'One of them is' : `${inUse.length} of them are`} still used by ${campaigns} campaign${campaigns === 1 ? '' : 's'}, which will lose their content.`
})

// ── Folders ──────────────────────────────────────────────────────────
const manageFolders = ref(false)
const moveDialog = ref(false)

function doMove(folderId: string | null) {
  store.moveToFolder(selected.value, folderId)
  const name = foldersStore.getFolder(folderId)?.name ?? 'Unfiled'
  toast.success(`${selected.value.length} item${selected.value.length === 1 ? '' : 's'} moved to ${name}`)
  selected.value = []
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Content"
      title="Email Content"
      subtitle="Reusable email bodies your campaigns can point at"
    >
      <template #actions>
        <v-btn
          variant="text"
          class="text-none"
          prepend-icon="archive"
          :to="{ name: 'ContentArchives', params: { accountId } }"
        >
          Archives
        </v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="folder" @click="manageFolders = true">
          Manage folders
        </v-btn>
        <v-btn variant="outlined" class="text-none" prepend-icon="layout-template" @click="openTemplates">
          My templates
        </v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="newContent">
          New content
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:quick-filter-value="editorFilter"
        :quick-filter="editorQuickFilter"
        title="All content"
        search-placeholder="Search content by name"
        :total-count="items.length"
        :active-filters="activeFilterEntries"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #actions>
          <MpFolderSelect
            v-model="selectedFolderId"
            :folders="contentFolders"
            :counts="folderCounts"
            :total-count="activeItems.length"
            label="All folders"
            @manage="manageFolders = true"
          />
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <MpErrorState
        v-else-if="loadError"
        title="Couldn't load your content"
        description="The request timed out. Your content is safe — try again."
        action-label="Retry"
        @action="loadError = false"
      />

      <v-data-table
        v-else
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
            aria-label="Select all content on this page"
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
          <button type="button" class="ec-name" @click="editContent(item)">{{ item.name }}</button>
        </template>

        <template #item.editorType="{ item }">
          <MpStatusChip :status="item.editorType" type="general" size="sm" variant="tonal" />
        </template>

        <template #item.usedByCampaigns="{ item }">
          <span v-if="item.usedByCampaigns" class="text-body-2">
            {{ item.usedByCampaigns }} campaign{{ item.usedByCampaigns === 1 ? '' : 's' }}
          </span>
          <span v-else class="text-body-2 text-medium-emphasis">—</span>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.updatedAt) }}</span>
        </template>

        <template #item.createdAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.createdAt) }}</span>
        </template>

        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Content actions" :item-label="item.name">
            <MpMenuItem icon="pencil" title="Edit" @click="editContent(item)" />
            <MpMenuItem icon="eye" title="Preview" @click="previewContent(item)" />
            <MpMenuItem icon="send" title="Create a campaign" @click="createCampaignFrom(item)" />
            <MpMenuItem icon="copy" title="Duplicate" @click="doDuplicate(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="archive" title="Archive" @click="archive([item.id])" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete([item.id])" />
          </MpRowActionsMenu>
        </template>

        <template #no-data>
          <MpEmptyState
            :icon="hasFilters ? 'search-x' : 'mail'"
            :variant="hasFilters ? 'stack' : 'launcher'"
            :title="hasFilters ? 'No content matches your filters' : 'No email content yet'"
            :description="hasFilters
              ? 'Try a different search term, or clear the filters to see everything.'
              : 'Email content is the creative your campaigns send. Start from a template, or build one from scratch.'"
            :action-label="hasFilters ? 'Clear filters' : 'New content'"
            :action-icon="hasFilters ? undefined : 'plus'"
            @action="hasFilters ? clearAllFilters() : newContent()"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar :count="selected.length" :total="items.length" @clear="selected = []">
      <v-btn variant="text" class="text-none" prepend-icon="folder-input" @click="moveDialog = true">
        Move to folder
      </v-btn>
      <v-btn variant="text" class="text-none" prepend-icon="archive" @click="archive([...selected])">
        Archive
      </v-btn>
      <v-btn variant="text" class="text-none" prepend-icon="trash-2" @click="askDelete([...selected])">
        Delete
      </v-btn>
    </MpFloatingBulkBar>

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="pendingDeleteIds.length === 1 ? 'Delete this content?' : `Delete ${pendingDeleteIds.length} items?`"
      :message="deleteMessage"
      confirm-label="Delete permanently"
      danger
      @confirm="doDelete"
    />

    <MpMoveToFolderDialog
      v-model="moveDialog"
      scope="contents"
      :current-folder-id="selectedFolderId"
      :item-label="`${selected.length} item${selected.length === 1 ? '' : 's'}`"
      @move="doMove"
    />

    <MpManageFoldersDrawer v-model="manageFolders" scope="contents" :counts="folderCounts" />
  </div>
</template>

<style scoped>
.ec-name {
  color: var(--accent-default);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  text-align: left;
}

.ec-name:hover,
.ec-name:focus-visible {
  text-decoration: underline;
}
</style>
