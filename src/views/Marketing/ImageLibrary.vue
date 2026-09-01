<script setup lang="ts">
import { computed, ref } from 'vue'
import { useImagesStore, type ImageItem } from '@/stores/useImages'
import { useFoldersStore } from '@/stores/useFolders'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFolderSelect from '@/components/MpFolderSelect.vue'
import MpManageFoldersDrawer from '@/components/MpManageFoldersDrawer.vue'
import MpMoveToFolderDialog from '@/components/MpMoveToFolderDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import { useToast } from '@/composables/useToast'

// UAT parity: the Image Library lives at /accounts/:id/folders (yes — that is
// the production route). List/grid views, folder filtering, upload, rename,
// copy CDN link, selection with preview + delete. UAT's hover-only drag /
// copy / kebab controls become always-reachable actions (IMPROVEMENTS.md).

const store = useImagesStore()
const foldersStore = useFoldersStore()
const toast = useToast()

const search = ref('')
const view = ref<string | null>('list')
const VIEW_ITEMS = [
  { value: 'list', icon: 'list', label: 'List view' },
  { value: 'grid', icon: 'layout-grid', label: 'Grid view' },
]

// ── Folders ───────────────────────────────────────────────────────────────
const imageFolders = computed(() => foldersStore.foldersByScope('images'))
const selectedFolderId = ref<string | null>(null)
const manageFoldersOpen = ref(false)

const folderCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const folder of imageFolders.value) {
    const ids = [folder.id, ...foldersStore.childrenOf(folder.id).map(f => f.id)]
    counts[folder.id] = store.items.filter(i => i.folderId && ids.includes(i.folderId)).length
  }
  return counts
})

const visibleImages = computed(() => {
  let rows = store.items
  if (selectedFolderId.value) {
    const ids = [selectedFolderId.value, ...foldersStore.childrenOf(selectedFolderId.value).map(f => f.id)]
    rows = rows.filter(i => i.folderId && ids.includes(i.folderId))
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    rows = rows.filter(i => i.name.toLowerCase().includes(q))
  }
  return rows
})

const activeFilterEntries = computed(() => {
  const folder = foldersStore.getFolder(selectedFolderId.value)
  return folder ? [{ key: 'folder', label: `Folder: ${folder.name}` }] : []
})

const headers = [
  { title: '', key: 'thumb', sortable: false, width: 72 },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Created At', key: 'date', sortable: true },
  { title: 'Updated At', key: 'updatedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

// ── Selection & bulk bar ──────────────────────────────────────────────────
const selected = ref<number[]>([])
function toggleSelect(id: number) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(x => x !== id)
    : [...selected.value, id]
}

// ── Upload ("New Images") ─────────────────────────────────────────────────
const uploadOpen = ref(false)
const fileInput = ref<HTMLInputElement>()
const pendingFiles = ref<string[]>([])

function openUpload() {
  pendingFiles.value = []
  uploadOpen.value = true
}

function onFilesChosen(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files) return
  pendingFiles.value = [...pendingFiles.value, ...Array.from(files).map(f => f.name)]
}

function saveUpload() {
  if (!pendingFiles.value.length) return
  store.addImages(pendingFiles.value, selectedFolderId.value)
  toast.success(`${pendingFiles.value.length} image${pendingFiles.value.length === 1 ? '' : 's'} added to the library`)
  uploadOpen.value = false
}

// ── Rename ("Edit Image") ─────────────────────────────────────────────────
const renameOpen = ref(false)
const renameTarget = ref<ImageItem | null>(null)
const renameValue = ref('')
function openRename(item: ImageItem) {
  renameTarget.value = item
  renameValue.value = item.name
  renameOpen.value = true
}
function confirmRename() {
  if (!renameTarget.value || renameValue.value.trim() === '') return
  store.renameImage(renameTarget.value.id, renameValue.value.trim())
  toast.success('Image renamed')
  renameOpen.value = false
}

// ── Preview ───────────────────────────────────────────────────────────────
const previewOpen = ref(false)
const previewItem = ref<ImageItem | null>(null)
function openPreview(item: ImageItem) {
  previewItem.value = item
  previewOpen.value = true
}
function previewSelected() {
  const item = store.items.find(i => i.id === selected.value[0])
  if (item) openPreview(item)
}

// ── Copy link ─────────────────────────────────────────────────────────────
async function copyLink(item: ImageItem) {
  try {
    await navigator.clipboard.writeText(store.cdnLink(item))
    toast.success('Image link copied')
  } catch {
    toast.error('Could not copy the link')
  }
}

// ── Move to folder ────────────────────────────────────────────────────────
const moveTarget = ref<{ id: number; name: string; folderId: string | null } | null>(null)
function onMove(folderId: string | null) {
  if (moveTarget.value) store.moveToFolder(moveTarget.value.id, folderId)
  toast.success('Image moved')
  moveTarget.value = null
}

// ── Delete ────────────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<number[]>([])
function askDelete(ids: number[]) {
  pendingDelete.value = ids
  confirmDelete.value = true
}
function doDelete() {
  store.deleteImages(pendingDelete.value)
  selected.value = selected.value.filter(id => !pendingDelete.value.includes(id))
  toast.success(pendingDelete.value.length === 1 ? 'Image deleted' : `${pendingDelete.value.length} images deleted`)
  pendingDelete.value = []
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Image Library"
      :subtitle="`${store.items.length} images`"
    >
      <template #actions>
        <MpSegmentedControl v-model="view" :items="VIEW_ITEMS" size="sm" ariaLabel="Library view" />
        <v-btn variant="flat" prepend-icon="folder" class="text-none" color="surface" @click="manageFoldersOpen = true">Manage Folders</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openUpload">Add New</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Images"
        search-placeholder="Search images"
        :total-count="visibleImages.length"
        :active-filters="activeFilterEntries"
        @remove-filter="selectedFolderId = null"
        @clear-filters="selectedFolderId = null"
      >
        <template #actions>
          <MpFolderSelect
            v-model="selectedFolderId"
            :folders="imageFolders"
            :counts="folderCounts"
            :total-count="store.items.length"
            @manage="manageFoldersOpen = true"
          />
        </template>
      </MpDataTableToolbar>

      <!-- List view -->
      <v-data-table
        v-if="view === 'list'"
        v-model="selected"
        :headers="headers"
        :items="visibleImages"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :items-per-page="10"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.thumb="{ item }">
          <v-img :src="item.url" :alt="item.name" width="48" height="36" cover rounded class="my-1" />
        </template>
        <template v-slot:item.name="{ item }">
          <button type="button" class="image-name" @click="openPreview(item)">{{ item.name }}</button>
          <div v-if="item.folderId" class="text-caption text-medium-emphasis">
            {{ foldersStore.getFolder(item.folderId)?.name }}
          </div>
        </template>
        <template v-slot:item.actions="{ item }">
          <div class="d-flex align-center justify-end">
            <v-btn icon="link" variant="text" size="small" :aria-label="`Copy link to ${item.name}`" @click="copyLink(item)" />
            <MpRowActionsMenu ariaLabel="Image actions" :itemLabel="item.name">
              <MpMenuItem icon="pencil" title="Edit Image" @click="openRename(item)" />
              <MpMenuItem icon="folder-input" title="Move to folder…" @click="moveTarget = { id: item.id, name: item.name, folderId: item.folderId }" />
              <v-divider class="my-1" />
              <MpMenuItem icon="trash-2" title="Delete Image" danger @click="askDelete([item.id])" />
            </MpRowActionsMenu>
          </div>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="image"
            :title="search || selectedFolderId ? 'No images match your filters' : 'No images yet'"
            :description="search || selectedFolderId ? 'Try a different search or clear the folder filter.' : 'Upload images to build your library.'"
            :action-label="!search && !selectedFolderId ? 'Add New' : undefined"
            action-icon="plus"
            class="py-10"
            @action="openUpload"
          />
        </template>
      </v-data-table>

      <!-- Grid view -->
      <div v-else class="pa-5 flex-grow-1 overflow-y-auto">
        <v-row v-if="visibleImages.length" dense>
          <v-col v-for="img in visibleImages" :key="img.id" cols="12" sm="6" md="3" lg="2">
            <v-card
              variant="flat"
              border
              rounded="lg"
              class="overflow-hidden image-card"
              :class="{ 'image-card--selected': selected.includes(img.id) }"
            >
              <div class="image-card__check">
                <v-checkbox-btn
                  :model-value="selected.includes(img.id)"
                  :aria-label="`Select ${img.name}`"
                  density="compact"
                  @click.stop="toggleSelect(img.id)"
                />
              </div>
              <div class="image-card__menu">
                <MpRowActionsMenu ariaLabel="Image actions" :itemLabel="img.name">
                  <MpMenuItem icon="pencil" title="Edit Image" @click="openRename(img)" />
                  <MpMenuItem icon="link" title="Copy link" @click="copyLink(img)" />
                  <MpMenuItem icon="folder-input" title="Move to folder…" @click="moveTarget = { id: img.id, name: img.name, folderId: img.folderId }" />
                  <v-divider class="my-1" />
                  <MpMenuItem icon="trash-2" title="Delete Image" danger @click="askDelete([img.id])" />
                </MpRowActionsMenu>
              </div>
              <v-img
                :src="img.url"
                :alt="img.name"
                cover
                height="140"
                class="image-card__media"
                role="button"
                tabindex="0"
                :aria-label="`Preview ${img.name}`"
                @click="openPreview(img)"
                @keydown.enter="openPreview(img)"
              />
              <v-card-text class="pa-3">
                <div class="text-body-2 font-weight-medium text-truncate">{{ img.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ img.size }} · {{ img.date }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <MpEmptyState
          v-else
          icon="image"
          :title="search || selectedFolderId ? 'No images match your filters' : 'No images yet'"
          :description="search || selectedFolderId ? 'Try a different search or clear the folder filter.' : 'Upload images to build your library.'"
          :action-label="!search && !selectedFolderId ? 'Add New' : undefined"
          action-icon="plus"
          class="py-10"
          @action="openUpload"
        />
      </div>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="visibleImages.length"
      @clear="selected = []"
    >
      <v-btn v-if="selected.length === 1" size="small" variant="text" class="text-none" prepend-icon="eye" @click="previewSelected">Preview</v-btn>
      <v-btn size="small" variant="text" class="text-none text-error" prepend-icon="trash-2" @click="askDelete([...selected])">Delete</v-btn>
    </MpFloatingBulkBar>

    <!-- New Images (upload) -->
    <MpDialog v-model="uploadOpen" title="New Images" size="md">
      <p class="text-body-2 mb-4">
        To add new images, upload from your computer. The suggested file size is up to 2MB and
        the expected extensions are: PNG, JPG, GIF, JPEG.
      </p>
      <button type="button" class="upload-dropzone" @click="fileInput?.click()">
        <v-icon size="28" class="mb-2">upload</v-icon>
        <span>Drag and drop, or <span class="text-primary">browse files</span></span>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".png,.jpg,.jpeg,.gif"
        multiple
        class="d-none"
        aria-label="Choose images to upload"
        @change="onFilesChosen"
      />
      <div v-if="pendingFiles.length" class="d-flex flex-wrap ga-2 mt-4">
        <v-chip
          v-for="(file, i) in pendingFiles"
          :key="`${file}-${i}`"
          size="small"
          closable
          @click:close="pendingFiles.splice(i, 1)"
        >
          {{ file }}
        </v-chip>
      </div>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="uploadOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!pendingFiles.length" @click="saveUpload">Save</v-btn>
      </template>
    </MpDialog>

    <!-- Edit Image (rename) -->
    <MpDialog v-model="renameOpen" title="Edit Image" size="sm">
      <v-text-field
        v-model="renameValue"
        label="Image Name *"
        :rules="[v => !!v || 'Image name is required']"
        @keydown.enter="confirmRename"
      />
      <template #footer>
        <v-btn variant="text" class="text-none" @click="renameOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!renameValue.trim()" @click="confirmRename">Confirm</v-btn>
      </template>
    </MpDialog>

    <!-- Preview -->
    <MpDialog v-model="previewOpen" :title="previewItem?.name ?? 'Preview'" size="lg">
      <template v-if="previewItem">
        <div class="preview-meta">
          <div class="text-body-2">URL: <code class="preview-url">{{ store.cdnLink(previewItem) }}</code></div>
          <div class="text-caption text-medium-emphasis">Updated at: {{ previewItem.updatedAt }}</div>
        </div>
        <v-img :src="previewItem.url" :alt="previewItem.name" max-height="420" contain class="mt-4" />
      </template>
      <template #footer>
        <v-btn variant="text" class="text-none" prepend-icon="link" @click="previewItem && copyLink(previewItem)">Copy link</v-btn>
        <v-btn variant="text" class="text-none text-error" prepend-icon="trash-2" @click="previewItem && (previewOpen = false, askDelete([previewItem.id]))">Delete</v-btn>
      </template>
    </MpDialog>

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="pendingDelete.length === 1 ? 'Delete image?' : `Delete ${pendingDelete.length} images?`"
      message="Deleted images are removed permanently; emails already sent keep their copies."
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />

    <MpMoveToFolderDialog
      :model-value="moveTarget !== null"
      scope="images"
      :current-folder-id="moveTarget?.folderId ?? null"
      :item-label="moveTarget?.name"
      @update:model-value="(v: boolean) => { if (!v) moveTarget = null }"
      @move="onMove"
    />

    <MpManageFoldersDrawer
      v-model="manageFoldersOpen"
      scope="images"
      :counts="folderCounts"
      @deleted="store.reassignFolder"
    />
  </div>
</template>

<style scoped>
.image-name {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  text-align: left;
}

.image-name:hover,
.image-name:focus-visible {
  text-decoration: underline;
}

.image-card__check,
.image-card__menu {
  position: absolute;
  top: var(--mp-space-4);
  z-index: 2;
  border-radius: var(--mp-radius-8);
  background: rgb(var(--v-theme-surface));
}

.image-card__check {
  left: var(--mp-space-4);
}

.image-card__menu {
  right: var(--mp-space-4);
}

.image-card__media {
  cursor: pointer;
}

.image-card--selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}

.upload-dropzone {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--mp-space-32);
  border: 2px dashed rgba(var(--v-border-color), calc(var(--v-border-opacity) * 2));
  border-radius: var(--mp-radius-12);
  color: var(--text-secondary, rgba(var(--v-theme-on-surface), 0.6));
}

.upload-dropzone:hover,
.upload-dropzone:focus-visible {
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}

.preview-url {
  word-break: break-all;
}
</style>
