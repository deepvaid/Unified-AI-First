<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFoldersStore, type FolderScope } from '@/stores/useFolders'
import MpFormDrawer from './MpFormDrawer.vue'
import MpConfirmDialog from './MpConfirmDialog.vue'

const model = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  scope: FolderScope
  /** Item counts per folder id, shown next to each folder. */
  counts?: Record<string, number>
}>(), {
  counts: () => ({}),
})

const emit = defineEmits<{
  /** Fired after a folder is deleted so the view can re-file its items. */
  deleted: [folderId: string]
}>()

const store = useFoldersStore()

const folders = computed(() => store.foldersByScope(props.scope))
const parentOptions = computed(() => [
  { title: 'No parent (top level)', value: null as string | null },
  ...folders.value.filter(f => !f.parentId).map(f => ({ title: f.name, value: f.id as string | null })),
])

// Create
const newName = ref('')
const newParentId = ref<string | null>(null)

function addFolder() {
  const name = newName.value.trim()
  if (!name) return
  store.createFolder(props.scope, name, newParentId.value)
  newName.value = ''
  newParentId.value = null
}

// Inline rename
const renamingId = ref<string | null>(null)
const renameValue = ref('')

function startRename(id: string, current: string) {
  renamingId.value = id
  renameValue.value = current
}

function commitRename() {
  const name = renameValue.value.trim()
  if (renamingId.value && name) store.renameFolder(renamingId.value, name)
  renamingId.value = null
}

// Delete confirm
const deletingId = ref<string | null>(null)
const deletingFolder = computed(() => store.getFolder(deletingId.value))
const deleteTitle = computed(() => `Delete "${deletingFolder.value?.name ?? ''}"?`)
const deleteMessage = computed(() => {
  const base = 'Items in this folder will be moved to All folders.'
  const hasChildren = !!deletingId.value && store.childrenOf(deletingId.value).length > 0
  return hasChildren
    ? `${base} Its subfolders will be kept and moved to the top level.`
    : base
})

function confirmDelete() {
  if (!deletingId.value) return
  const id = deletingId.value
  store.deleteFolder(id)
  deletingId.value = null
  emit('deleted', id)
}
</script>

<template>
  <MpFormDrawer
    v-model="model"
    title="Manage folders"
    subtitle="Organize items into folders your whole team can use."
  >
    <!-- New folder -->
    <div class="mb-6">
      <div class="text-subtitle-2 font-weight-bold mb-3">New folder</div>
      <v-text-field
        v-model="newName"
        label="Folder name"
        variant="outlined"
        density="comfortable"
        hide-details
        class="mb-3"
        @keyup.enter="addFolder"
      />
      <v-select
        v-model="newParentId"
        label="Nest under (optional)"
        :items="parentOptions"
        variant="outlined"
        density="comfortable"
        hide-details
        class="mb-3"
      />
      <v-btn
        color="primary"
        variant="flat"
        class="text-none"
        prepend-icon="folder-plus"
        :disabled="!newName.trim()"
        @click="addFolder"
      >
        Add Folder
      </v-btn>
    </div>

    <v-divider class="mb-4" />

    <!-- Folder list -->
    <div class="text-subtitle-2 font-weight-bold mb-2">Folders</div>
    <div v-if="!folders.length" class="text-body-2 text-medium-emphasis py-4">
      No folders yet. Create one above to start organizing.
    </div>
    <v-list density="compact" class="py-0">
      <v-list-item
        v-for="folder in folders"
        :key="folder.id"
        rounded="lg"
        class="px-2 mp-manage-folders__row"
        :class="{ 'ml-6': folder.parentId }"
      >
        <template #prepend>
          <v-icon size="18">{{ folder.parentId ? 'corner-down-right' : 'folder' }}</v-icon>
        </template>

        <template v-if="renamingId === folder.id">
          <v-text-field
            v-model="renameValue"
            variant="outlined"
            density="compact"
            hide-details
            autofocus
            :aria-label="`New name for ${folder.name}`"
            @keyup.enter="commitRename"
            @keyup.esc="renamingId = null"
          />
        </template>
        <template v-else>
          <v-list-item-title class="text-body-2">
            {{ folder.name }}
            <span class="text-caption text-medium-emphasis ml-1">({{ counts[folder.id] ?? 0 }})</span>
          </v-list-item-title>
        </template>

        <template #append>
          <template v-if="renamingId === folder.id">
            <v-btn icon="check" variant="text" size="x-small" color="primary" aria-label="Save name" @click="commitRename" />
            <v-btn icon="x" variant="text" size="x-small" aria-label="Cancel rename" @click="renamingId = null" />
          </template>
          <template v-else>
            <v-btn icon="pencil" variant="text" size="x-small" color="medium-emphasis" aria-label="Rename folder" @click="startRename(folder.id, folder.name)" />
            <v-btn icon="trash-2" variant="text" size="x-small" color="medium-emphasis" aria-label="Delete folder" @click="deletingId = folder.id" />
          </template>
        </template>
      </v-list-item>
    </v-list>

    <template #footer>
      <v-btn variant="flat" color="primary" class="text-none" @click="model = false">Done</v-btn>
    </template>
  </MpFormDrawer>

  <!-- Delete confirmation -->
  <MpConfirmDialog
    :model-value="!!deletingId"
    :title="deleteTitle"
    :message="deleteMessage"
    confirm-label="Delete Folder"
    danger
    @update:model-value="deletingId = null"
    @confirm="confirmDelete"
  />
</template>

<style scoped>
.mp-manage-folders__row {
  min-height: 44px;
}
</style>
