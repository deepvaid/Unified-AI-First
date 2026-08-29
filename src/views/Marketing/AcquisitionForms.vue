<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFormsStore, embedScriptFor, type AcquisitionForm } from '@/stores/useForms'
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
import MpDialog from '@/components/MpDialog.vue'
import MpFormField from '@/components/MpFormField.vue'

/**
 * Acquisition Forms list. Rebuilt from UAT `/acquisition/forms`;
 * see docs/rebuild/acquisition-forms/.
 *
 * The source has no search, no filters and no bulk action but delete, and it
 * unmounts its own primary CTA the moment a row is selected. All four are fixed
 * here; the feature set is otherwise the source's.
 */
const store = useFormsStore()
const foldersStore = useFoldersStore()
const { forms } = storeToRefs(store)
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))

// ── Filters (all routable — none of this reaches the URL in the source) ──
const search = ref(String(route.query.q ?? ''))
const selectedFolderId = ref<string | null>((route.query.folder as string) ?? null)
const typeQuickFilter = {
  key: 'type',
  label: 'Form type',
  options: [
    { label: 'Popup', value: 'Popup' },
    { label: 'Embedded', value: 'Embedded' },
  ],
}
const typeFilter = ref<string[]>([])
const builderFilter = ref<string>('')

watch([search, selectedFolderId], () => {
  router.replace({
    query: {
      ...route.query,
      q: search.value.trim() || undefined,
      folder: selectedFolderId.value ?? undefined,
    },
  })
})

const formFolders = computed(() => foldersStore.foldersByScope('forms'))
const folderCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const folder of formFolders.value) {
    const ids = [folder.id, ...foldersStore.childrenOf(folder.id).map(f => f.id)]
    counts[folder.id] = forms.value.filter(f => f.folderId && ids.includes(f.folderId)).length
  }
  return counts
})

const activeFilterEntries = computed(() => {
  const entries: Array<{ key: string; label: string }> = []
  const folder = foldersStore.getFolder(selectedFolderId.value)
  if (folder) entries.push({ key: 'folder', label: `Folder: ${folder.name}` })
  if (typeFilter.value.length) entries.push({ key: 'type', label: `Form type: ${typeFilter.value.join(', ')}` })
  if (builderFilter.value) entries.push({ key: 'builder', label: `Built with: ${builderFilter.value}` })
  return entries
})

function removeFilter(key: string) {
  if (key === 'folder') selectedFolderId.value = null
  if (key === 'type') typeFilter.value = []
  if (key === 'builder') builderFilter.value = ''
}

function clearAllFilters() {
  selectedFolderId.value = null
  typeFilter.value = []
  builderFilter.value = ''
  search.value = ''
}

const hasFilters = computed(() => activeFilterEntries.value.length > 0 || Boolean(search.value.trim()))

const items = computed(() => {
  const term = search.value.trim().toLowerCase()
  const folderIds = selectedFolderId.value
    ? [selectedFolderId.value, ...foldersStore.childrenOf(selectedFolderId.value).map(f => f.id)]
    : null
  return forms.value.filter((f) => {
    if (folderIds && (!f.folderId || !folderIds.includes(f.folderId))) return false
    if (typeFilter.value.length && !typeFilter.value.includes(f.type)) return false
    if (builderFilter.value && f.builderType !== builderFilter.value) return false
    if (term && !f.name.toLowerCase().includes(term)) return false
    return true
  })
})

// ── Table ────────────────────────────────────────────────────────────
const loading = ref(false)
const loadError = ref(false)
const selected = ref<number[]>([])

const headers = [
  { title: 'Name', key: 'name', sortable: true, minWidth: '240px' },
  { title: 'Form type', key: 'builderType', minWidth: '140px' },
  { title: 'Status', key: 'enabled', minWidth: '128px' },
  { title: 'Updated at', key: 'updated', sortable: true, minWidth: '150px' },
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

function editForm(form: AcquisitionForm) {
  router.push({ name: 'FormBuilder', params: { accountId: accountId.value }, query: { formId: String(form.id) } })
}

function newForm() {
  router.push({ name: 'FormSelection', params: { accountId: accountId.value } })
}

function toggleEnabled(form: AcquisitionForm) {
  const next = !form.enabled
  store.setEnabled([form.id], next)
  toast.success(next ? `"${form.name}" is live on your site` : `"${form.name}" is no longer showing`)
}

// ── Show script link ─────────────────────────────────────────────────
const scriptDialog = ref(false)
const scriptForm = ref<AcquisitionForm | null>(null)
const scripts = computed(() =>
  scriptForm.value ? embedScriptFor(scriptForm.value, accountId.value) : { script: '', manual: '' },
)

function openScript(form: AcquisitionForm) {
  scriptForm.value = form
  scriptDialog.value = true
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  } catch {
    toast.error(`Couldn't copy the ${label.toLowerCase()} — select it and copy manually.`)
  }
}

// ── Preview ──────────────────────────────────────────────────────────
const previewDialog = ref(false)
const previewForm = ref<AcquisitionForm | null>(null)

function openPreview(form: AcquisitionForm) {
  previewForm.value = form
  previewDialog.value = true
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
  store.remove(ids)
  selected.value = selected.value.filter(id => !ids.includes(id))
  toast.success(ids.length === 1 ? 'Form deleted' : `${ids.length} forms deleted`)
  pendingDeleteIds.value = []
}

const deleteMessage = computed(() => {
  const ids = pendingDeleteIds.value
  const live = forms.value.filter(f => ids.includes(f.id) && f.enabled).length
  const base = ids.length === 1
    ? 'This form and its collected-submission history are removed permanently.'
    : `These ${ids.length} forms and their collected-submission history are removed permanently.`
  return live
    ? `${base} ${live} of them ${live === 1 ? 'is' : 'are'} currently live on your site and will stop appearing immediately.`
    : base
})

// ── Folders ──────────────────────────────────────────────────────────
const manageFolders = ref(false)
const moveDialog = ref(false)

function doMove(folderId: string | null) {
  store.moveToFolder(selected.value, folderId)
  const name = foldersStore.getFolder(folderId)?.name ?? 'Unfiled'
  toast.success(`${selected.value.length} form${selected.value.length === 1 ? '' : 's'} moved to ${name}`)
  selected.value = []
}

function doDuplicate(form: AcquisitionForm) {
  store.duplicate(form.id)
  toast.success(`"${form.name}" duplicated`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Acquisition"
      title="Acquisition Forms"
      subtitle="Popup and embedded sign-up forms for your website"
    >
      <template #actions>
        <v-btn variant="text" class="text-none" prepend-icon="folder" @click="manageFolders = true">
          Manage folders
        </v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="newForm">
          New form
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:quick-filter-value="typeFilter"
        :quick-filter="typeQuickFilter"
        title="All forms"
        search-placeholder="Search forms by name"
        :total-count="items.length"
        :active-filters="activeFilterEntries"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #actions>
          <MpFolderSelect
            v-model="selectedFolderId"
            :folders="formFolders"
            :counts="folderCounts"
            :total-count="forms.length"
            label="All folders"
            @manage="manageFolders = true"
          />
        </template>

        <template #filter-content>
          <MpFormField label="Built with">
            <template #default="{ labelId }">
              <v-radio-group v-model="builderFilter" :aria-labelledby="labelId" hide-details density="compact">
                <v-radio label="Any builder" value="" />
                <v-radio label="Drag and Drop" value="Drag and Drop" />
                <v-radio label="Legacy" value="Legacy" />
              </v-radio-group>
            </template>
          </MpFormField>
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="6" :columns="6" />

      <MpErrorState
        v-else-if="loadError"
        title="Couldn't load your forms"
        description="The request timed out. Your forms are safe — try again."
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
        :items-per-page="10"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <!-- Vuetify's own select checkboxes ship with no accessible name. -->
        <template #header.data-table-select="{ allSelected, selectAll, someSelected }">
          <v-checkbox-btn
            :model-value="allSelected"
            :indeterminate="someSelected && !allSelected"
            aria-label="Select all forms on this page"
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
          <button type="button" class="af-name" @click="editForm(item)">{{ item.name }}</button>
        </template>

        <template #item.builderType="{ item }">
          <MpStatusChip :status="item.builderType" type="general" size="sm" variant="tonal" />
        </template>

        <template #item.enabled="{ item }">
          <v-switch
            :model-value="item.enabled"
            :label="item.enabled ? 'Live' : 'Paused'"
            :aria-label="`${item.name} — ${item.enabled ? 'live, switch off to pause' : 'paused, switch on to go live'}`"
            color="primary"
            density="compact"
            hide-details
            inset
            class="af-status"
            @update:model-value="toggleEnabled(item)"
          />
        </template>

        <template #item.updated="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.updated) }}</span>
        </template>

        <template #item.createdAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.createdAt) }}</span>
        </template>

        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Form actions" :item-label="item.name">
            <MpMenuItem icon="pencil" title="Edit" @click="editForm(item)" />
            <MpMenuItem icon="eye" title="Preview form" @click="openPreview(item)" />
            <MpMenuItem icon="code" title="Show script link" @click="openScript(item)" />
            <MpMenuItem icon="copy" title="Duplicate" @click="doDuplicate(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete([item.id])" />
          </MpRowActionsMenu>
        </template>

        <template #no-data>
          <MpEmptyState
            :icon="hasFilters ? 'search-x' : 'clipboard-list'"
            :variant="hasFilters ? 'stack' : 'launcher'"
            :title="hasFilters ? 'No forms match your filters' : 'No forms yet'"
            :description="hasFilters
              ? 'Try a different search term, or clear the filters to see every form.'
              : 'Acquisition forms capture email sign-ups from your website — as a popup, or embedded in the page.'"
            :action-label="hasFilters ? 'Clear filters' : 'New form'"
            :action-icon="hasFilters ? undefined : 'plus'"
            class="py-10"
            @action="hasFilters ? clearAllFilters() : newForm()"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- The source replaces its own New form button with this. Floating keeps both. -->
    <MpFloatingBulkBar :count="selected.length" :total="items.length" @clear="selected = []">
      <v-btn variant="text" class="text-none" prepend-icon="folder-input" @click="moveDialog = true">
        Move to folder
      </v-btn>
      <v-btn variant="text" class="text-none" prepend-icon="play" @click="store.setEnabled(selected, true); selected = []">
        Set live
      </v-btn>
      <v-btn variant="text" class="text-none" prepend-icon="pause" @click="store.setEnabled(selected, false); selected = []">
        Pause
      </v-btn>
      <v-btn variant="text" class="text-none" prepend-icon="trash-2" @click="askDelete([...selected])">
        Delete
      </v-btn>
    </MpFloatingBulkBar>

    <!-- ── Script link ──────────────────────────────────────────────── -->
    <MpDialog
      v-model="scriptDialog"
      title="Acquisition form script"
      :subtitle="scriptForm?.name"
      size="lg"
    >
      <MpFormField
        label="Script tag"
        hint="Paste this inside the <head> of every page the form should appear on. To show it everywhere, add it to a shared layout such as your footer template."
      >
        <template #default="{ labelId, descriptionId }">
          <div class="af-snippet">
            <code :aria-labelledby="labelId" :aria-describedby="descriptionId">{{ scripts.script }}</code>
            <v-btn
              icon="copy"
              variant="text"
              size="small"
              aria-label="Copy script tag"
              @click="copy(scripts.script, 'Script tag')"
            />
          </div>
        </template>
      </MpFormField>

      <MpFormField
        label="Manual integration"
        hint="Use this instead if you need to control exactly where the form mounts on the page."
      >
        <template #default="{ labelId, descriptionId }">
          <div class="af-snippet">
            <code :aria-labelledby="labelId" :aria-describedby="descriptionId">{{ scripts.manual }}</code>
            <v-btn
              icon="copy"
              variant="text"
              size="small"
              aria-label="Copy manual integration snippet"
              @click="copy(scripts.manual, 'Manual integration snippet')"
            />
          </div>
        </template>
      </MpFormField>

      <template #footer>
        <v-btn variant="flat" color="primary" class="text-none" @click="scriptDialog = false">Done</v-btn>
      </template>
    </MpDialog>

    <!-- ── Preview ──────────────────────────────────────────────────── -->
    <MpDialog
      v-model="previewDialog"
      title="Form preview"
      :subtitle="previewForm?.name"
      size="md"
    >
      <div v-if="previewForm" class="af-preview">
        <p class="af-preview__headline">{{ previewForm.headline }}</p>
        <p class="af-preview__body">Sign up to get email-only offers.</p>
        <label class="af-preview__label" for="af-preview-email">Email</label>
        <input id="af-preview-email" class="af-preview__input" type="email" disabled placeholder="you@example.com">
        <span class="af-preview__button">{{ previewForm.buttonLabel }}</span>
      </div>
      <p class="text-body-2 text-medium-emphasis mb-0">
        A static representation of the form's content. Open the builder to change its design.
      </p>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="previewDialog = false">Close</v-btn>
        <v-btn
          v-if="previewForm"
          color="primary"
          variant="flat"
          class="text-none"
          @click="previewDialog = false; editForm(previewForm)"
        >
          Edit form
        </v-btn>
      </template>
    </MpDialog>

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="pendingDeleteIds.length === 1 ? 'Delete this form?' : `Delete ${pendingDeleteIds.length} forms?`"
      :message="deleteMessage"
      confirm-label="Delete permanently"
      danger
      @confirm="doDelete"
    />

    <MpMoveToFolderDialog
      v-model="moveDialog"
      scope="forms"
      :current-folder-id="selectedFolderId"
      :item-label="`${selected.length} form${selected.length === 1 ? '' : 's'}`"
      @move="doMove"
    />

    <MpManageFoldersDrawer v-model="manageFolders" scope="forms" :counts="folderCounts" />
  </div>
</template>

<style scoped>
.af-name {
  color: rgb(var(--v-theme-primary));
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  text-align: left;
}

.af-name:hover {
  text-decoration: underline;
}

.af-status :deep(.v-label) {
  white-space: nowrap;
  font-size: var(--mp-fontSize-13);
}

.af-snippet {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-8);
  padding: var(--mp-space-12);
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--mp-component-input-radius);
}

.af-snippet code {
  flex: 1;
  overflow-x: auto;
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface));
  white-space: pre-wrap;
  word-break: break-all;
}

.af-preview {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  padding: var(--mp-component-card-paddingSpacious);
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-component-card-radius);
  text-align: center;
}

.af-preview__headline {
  margin: 0;
  font-size: var(--mp-fontSize-20);
  font-weight: var(--mp-fontWeight-semibold);
  color: rgb(var(--v-theme-on-surface));
}

.af-preview__body {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  color: rgb(var(--v-theme-on-surface-variant));
}

.af-preview__label {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  color: rgb(var(--v-theme-on-surface-variant));
  text-align: left;
}

.af-preview__input {
  padding: var(--mp-space-10) var(--mp-space-12);
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-component-input-radius);
  background: rgb(var(--v-theme-surface));
  font-size: var(--mp-fontSize-14);
}

.af-preview__button {
  padding: var(--mp-space-10) var(--mp-space-16);
  border-radius: var(--mp-component-button-radius);
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
}
</style>
