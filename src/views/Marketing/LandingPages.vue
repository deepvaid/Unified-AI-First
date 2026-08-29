<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  useLandingPagesStore,
  EDITOR_TYPE_LABEL,
  EDITOR_TYPE_OPTIONS,
  type EditorType,
  type LandingPage,
} from '@/stores/useLandingPages'
import { useFoldersStore } from '@/stores/useFolders'
import { useToast } from '@/composables/useToast'
import { useInitialLoad } from '@/composables/useInitialLoad'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFolderSelect from '@/components/MpFolderSelect.vue'
import MpManageFoldersDrawer from '@/components/MpManageFoldersDrawer.vue'
import MpMoveToFolderDialog from '@/components/MpMoveToFolderDialog.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'

/**
 * Landing Pages list. Rebuilt from UAT `/accounts/:id/landing_pages`;
 * see docs/rebuild/landing-pages/AUDIT.md §1 and FLOWS.md.
 *
 * The source has no search, no URL state, one bulk action, and unmounts its own
 * primary CTA the moment a row is ticked. All four are fixed here — see
 * docs/rebuild/marketing-acquisition/IMPROVEMENTS.md.
 */
const store = useLandingPagesStore()
const foldersStore = useFoldersStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { pages } = storeToRefs(store)
const { loading } = useInitialLoad()

const accountId = computed(() => String(route.params.accountId))
/** Reserved for the failed-fetch branch once a real API is wired. */
const loadError = ref(false)

// ── Filter state, mirrored into the URL ──────────────────────────────
// The source keeps folder, filter and page in component state, so no view is
// bookmarkable and Back leaves the page instead of undoing the filter.
function queryList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  return typeof value === 'string' && value ? value.split(',') : []
}

const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const editorTypeFilter = ref<string[]>(queryList(route.query.type))
const selectedFolderId = ref<string | null>(
  typeof route.query.folder === 'string' && route.query.folder ? route.query.folder : null,
)

watch([search, editorTypeFilter, selectedFolderId], () => {
  const query: Record<string, string> = {}
  if (search.value.trim()) query.q = search.value.trim()
  if (editorTypeFilter.value.length) query.type = editorTypeFilter.value.join(',')
  if (selectedFolderId.value) query.folder = selectedFolderId.value
  void router.replace({ query })
}, { deep: true })

const editorTypeQuickFilter = {
  key: 'editorType',
  label: 'Editor type',
  icon: 'layout-template',
  options: EDITOR_TYPE_OPTIONS.map(o => ({ label: o.label, value: o.value })),
}

// ── Folders ──────────────────────────────────────────────────────────
const manageFoldersOpen = ref(false)
const landingFolders = computed(() => foldersStore.foldersByScope('landing_pages'))

const folderCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const folder of landingFolders.value) {
    const ids = [folder.id, ...foldersStore.childrenOf(folder.id).map(f => f.id)]
    counts[folder.id] = pages.value.filter(p => p.folderId && ids.includes(p.folderId)).length
  }
  return counts
})

function folderName(id: string | null) {
  return foldersStore.getFolder(id)?.name ?? 'Unfiled'
}

// ── Filtering ────────────────────────────────────────────────────────
const items = computed(() => {
  const term = search.value.trim().toLowerCase()
  const folderIds = selectedFolderId.value
    ? [selectedFolderId.value, ...foldersStore.childrenOf(selectedFolderId.value).map(f => f.id)]
    : null
  return pages.value.filter((p) => {
    if (folderIds && !(p.folderId && folderIds.includes(p.folderId))) return false
    if (editorTypeFilter.value.length && !editorTypeFilter.value.includes(p.editorType)) return false
    if (!term) return true
    return `${p.name} ${p.url}`.toLowerCase().includes(term)
  })
})

const activeFilterEntries = computed(() => {
  const entries: Array<{ key: string; label: string }> = []
  if (editorTypeFilter.value.length) {
    const labels = editorTypeFilter.value.map(v => EDITOR_TYPE_LABEL[v as EditorType] ?? v)
    entries.push({ key: 'editorType', label: `Editor type: ${labels.join(', ')}` })
  }
  if (selectedFolderId.value) {
    entries.push({ key: 'folder', label: `Folder: ${folderName(selectedFolderId.value)}` })
  }
  return entries
})

const hasFilters = computed(
  () => Boolean(search.value.trim()) || editorTypeFilter.value.length > 0 || selectedFolderId.value !== null,
)

function removeFilter(key: string) {
  if (key === 'editorType') editorTypeFilter.value = []
  if (key === 'folder') selectedFolderId.value = null
}

function clearAllFilters() {
  search.value = ''
  editorTypeFilter.value = []
  selectedFolderId.value = null
}

// ── Columns ──────────────────────────────────────────────────────────
const headers = [
  { title: 'Name', key: 'name', sortable: true, minWidth: '220px' },
  { title: 'Editor Type', key: 'editorType', sortable: false, minWidth: '150px' },
  { title: 'Domain Status', key: 'status', sortable: false, minWidth: '130px' },
  { title: 'Publish At', key: 'publishAt', sortable: true, minWidth: '170px' },
  { title: 'Expire At', key: 'expireAt', sortable: true, minWidth: '170px' },
  { title: 'Updated At', key: 'updatedAt', sortable: true, minWidth: '170px' },
  { title: '', key: 'actions', sortable: false, width: 56 },
]

/** UAT's own format: `Mar 26, 2026 at 02:30 PM`. */
function formatDateTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${date} at ${time}`
}

function editorRoute(page: LandingPage) {
  return { name: 'LandingPageEditor', params: { accountId: accountId.value, id: String(page.id) } }
}

function newPage() {
  void router.push({ name: 'LandingPageTemplates', params: { accountId: accountId.value } })
}

// ── Row actions ──────────────────────────────────────────────────────
function verifyDomain(page: LandingPage) {
  store.verifyDomain(page.id)
  toast.success(`${page.url} is verified — “${page.name}” can now be published on that domain.`)
}

function previewPage(page: LandingPage) {
  // The source's Preview item links to the editor, byte-identical to the row's
  // own name link (AUDIT D1). Here it opens the page's read-only preview.
  void router.push({ ...editorRoute(page), query: { preview: '1' } })
}

function duplicate(page: LandingPage) {
  const id = store.duplicate(page.id)
  if (id === null) return
  toast.success(`“${page.name}” duplicated`, {
    action: { label: 'Open copy', onClick: () => router.push({ name: 'LandingPageEditor', params: { accountId: accountId.value, id: String(id) } }) },
  })
}

// ── Delete ───────────────────────────────────────────────────────────
const pendingDelete = ref<LandingPage | null>(null)
// The dialog outlives its target by one close transition, so the name it shows
// is held separately — reading it off a cleared target renders "undefined".
const deleteLabel = ref('')
const confirmDeleteOpen = computed({
  get: () => pendingDelete.value !== null,
  set: (open: boolean) => { if (!open) pendingDelete.value = null },
})

function askDelete(page: LandingPage) {
  deleteLabel.value = page.name
  pendingDelete.value = page
}

function doDelete() {
  if (!pendingDelete.value) return
  const { id, name } = pendingDelete.value
  store.remove([id])
  selected.value = selected.value.filter(s => s !== id)
  toast.success(`“${name}” deleted`)
  pendingDelete.value = null
}

// ── Selection + bulk actions ─────────────────────────────────────────
// The source removes NEW PAGE from the DOM on selection and offers delete only.
const selected = ref<number[]>([])
const bulkDeleteOpen = ref(false)
const bulkMoveOpen = ref(false)

const selectedCountLabel = computed(
  () => `${selected.value.length} landing page${selected.value.length === 1 ? '' : 's'}`,
)
/** Frozen at open time, for the same reason `deleteLabel` is. */
const bulkLabel = ref('')

function openBulkDelete() {
  bulkLabel.value = selectedCountLabel.value
  bulkDeleteOpen.value = true
}

function openBulkMove() {
  bulkLabel.value = selectedCountLabel.value
  bulkMoveOpen.value = true
}

function bulkDelete() {
  const count = selected.value.length
  store.remove(selected.value)
  selected.value = []
  toast.success(`${count} landing page${count === 1 ? '' : 's'} deleted`)
}

function onBulkMove(folderId: string | null) {
  const count = selected.value.length
  store.moveToFolder(selected.value, folderId)
  selected.value = []
  toast.success(`${count} landing page${count === 1 ? '' : 's'} moved to ${folderName(folderId)}`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Marketing · Acquisition"
      title="Landing Pages"
      subtitle="Standalone pages on your own domain that capture sign-ups from campaigns, ads and social posts"
    >
      <template #actions>
        <!-- Stays mounted while rows are selected: the bulk bar is an addition,
             not a replacement for the page's primary action (AUDIT friction 2). -->
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="newPage">
          New page
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:quick-filter-value="editorTypeFilter"
        :quick-filter="editorTypeQuickFilter"
        title="All landing pages"
        search-placeholder="Search by name or URL"
        :total-count="items.length"
        :active-filters="activeFilterEntries"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #actions>
          <MpFolderSelect
            v-model="selectedFolderId"
            :folders="landingFolders"
            :counts="folderCounts"
            :total-count="pages.length"
            @manage="manageFoldersOpen = true"
          />
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <MpErrorState
        v-else-if="loadError"
        title="Couldn't load your landing pages"
        description="The request timed out. Your pages are safe — try again."
        action-label="Retry"
        class="py-10"
        @action="loadError = false"
      />

      <v-data-table
        v-else
        v-model="selected"
        :headers="headers"
        :items="items"
        item-value="id"
        show-select
        hover
        density="comfortable"
        fixed-header
        :items-per-page="10"
        class="flex-grow-1"
      >
        <!-- Vuetify's own select checkboxes ship with no accessible name. -->
        <template #header.data-table-select="{ allSelected, selectAll, someSelected }">
          <v-checkbox-btn
            :model-value="allSelected"
            :indeterminate="someSelected && !allSelected"
            aria-label="Select all landing pages on this page"
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
          <RouterLink :to="editorRoute(item)" class="lp-name">{{ item.name }}</RouterLink>
          <div v-if="item.folderId && !selectedFolderId" class="text-caption text-medium-emphasis">
            {{ folderName(item.folderId) }}
          </div>
        </template>

        <template #item.editorType="{ item }">
          <span class="text-body-2">{{ EDITOR_TYPE_LABEL[item.editorType as EditorType] }}</span>
        </template>

        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>

        <template #item.publishAt="{ item }">
          <span v-if="item.publishAt" class="text-body-2 text-medium-emphasis">{{ formatDateTime(item.publishAt) }}</span>
          <template v-else>
            <span aria-hidden="true" class="text-medium-emphasis">—</span>
            <span class="d-sr-only">Not scheduled</span>
          </template>
        </template>

        <template #item.expireAt="{ item }">
          <span v-if="item.expireAt" class="text-body-2 text-medium-emphasis">{{ formatDateTime(item.expireAt) }}</span>
          <template v-else>
            <span aria-hidden="true" class="text-medium-emphasis">—</span>
            <span class="d-sr-only">No expiry</span>
          </template>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDateTime(item.updatedAt) }}</span>
        </template>

        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Landing page actions" :item-label="item.name">
            <!-- Disabled on a verified domain, exactly as the source does — but
                 the source never says why. The tooltip carries the reason and
                 wires `aria-describedby`; the pointer-events reset below is what
                 lets it open at all, so the click is guarded explicitly.
                 GAP: MpMenuItem has no `disabledReason` — see
                 docs/rebuild/marketing-acquisition/GAPS.md G4. -->
            <MpMenuItem
              title="Verify domain"
              icon="shield-check"
              :disabled="item.status === 'Verified'"
              :aria-disabled="item.status === 'Verified' || undefined"
              :class="item.status === 'Verified' ? 'lp-menu-item--reasoned' : undefined"
              @click="item.status === 'Verified' ? undefined : verifyDomain(item)"
            >
              <v-tooltip
                v-if="item.status === 'Verified'"
                activator="parent"
                location="start"
                text="Already verified — nothing to check."
              />
            </MpMenuItem>
            <MpMenuItem title="Preview" icon="eye" @click="previewPage(item)" />
            <MpMenuItem title="Duplicate" icon="copy" @click="duplicate(item)" />
            <v-divider class="my-1" />
            <MpMenuItem title="Delete" icon="trash-2" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template #no-data>
          <MpEmptyState
            v-if="hasFilters"
            icon="search-x"
            title="No landing pages match your filters"
            :description="selectedFolderId && !search.trim() && !editorTypeFilter.length
              ? `Nothing is filed under ${folderName(selectedFolderId)} yet.`
              : 'Try a different search term, or clear the editor-type and folder filters.'"
            action-label="Clear filters"
            class="py-10"
            @action="clearAllFilters"
          />
          <MpEmptyState
            v-else
            variant="launcher"
            icon="layout-template"
            title="No landing pages yet"
            description="A landing page lives on your own domain and captures sign-ups from campaigns, ads and social posts."
            action-label="New page"
            action-icon="plus"
            class="py-10"
            @action="newPage"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="items.length"
      @clear="selected = []"
      @select-all="selected = items.map(p => p.id)"
    >
      <v-btn size="small" variant="text" class="text-none" prepend-icon="folder-input" @click="openBulkMove">
        Move to folder
      </v-btn>
      <v-btn size="small" variant="text" class="text-none text-error" prepend-icon="trash-2" @click="openBulkDelete">
        Delete
      </v-btn>
    </MpFloatingBulkBar>

    <MpManageFoldersDrawer
      v-model="manageFoldersOpen"
      scope="landing_pages"
      :counts="folderCounts"
      @deleted="store.reassignFolder"
    />

    <MpMoveToFolderDialog
      v-model="bulkMoveOpen"
      scope="landing_pages"
      :current-folder-id="selectedFolderId"
      :item-label="bulkLabel"
      @move="onBulkMove"
    />

    <MpConfirmDialog
      v-model="confirmDeleteOpen"
      :title="`Delete “${deleteLabel}”?`"
      message="The page and its published URL go away immediately. Anyone who follows a link to it will get a 404."
      confirm-label="Delete page"
      danger
      @confirm="doDelete"
    />

    <MpConfirmDialog
      v-model="bulkDeleteOpen"
      :title="`Delete ${bulkLabel}?`"
      message="Their published URLs go away immediately. Anyone who follows a link to one will get a 404."
      confirm-label="Delete pages"
      danger
      @confirm="bulkDelete"
    />
  </div>
</template>

<style scoped>
.lp-name {
  color: rgb(var(--v-theme-primary));
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  text-decoration: none;
}

.lp-name:hover {
  text-decoration: underline;
}

/* Vuetify kills pointer events on a disabled list item, which also kills the
   tooltip that explains why it is disabled. Restore them for the one item that
   carries a reason — a disabled v-list-item binds no click handler, so this
   makes the row hoverable without making it activatable. */
.lp-menu-item--reasoned {
  pointer-events: auto;
}
</style>
