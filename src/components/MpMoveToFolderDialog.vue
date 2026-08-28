<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpDialog from './MpDialog.vue'
import { useFoldersStore, type FolderScope } from '@/stores/useFolders'

const model = defineModel<boolean>({ default: false })

const props = defineProps<{
  scope: FolderScope
  /** The item's current folder, preselected in the list. */
  currentFolderId: string | null
  /** Shown in the context line, e.g. the campaign name. */
  itemLabel?: string
}>()

const emit = defineEmits<{
  move: [folderId: string | null]
}>()

const store = useFoldersStore()
const folders = computed(() => store.foldersByScope(props.scope))

const selectedId = ref<string | null>(null)
watch(model, open => {
  if (open) {
    selectedId.value = props.currentFolderId
    creating.value = false
    newName.value = ''
  }
})

// Bridges the single `selectedId` ref to VList's array-shaped selection model so
// Vuetify renders role="listbox"/"option" (A11Y-006) instead of a bare list.
const selectedList = computed<(string | null)[]>({
  get: () => [selectedId.value],
  set: value => {
    selectedId.value = value[0] ?? null
  },
})

// Inline "new folder"
const creating = ref(false)
const newName = ref('')

function createAndSelect() {
  const name = newName.value.trim()
  if (!name) return
  const folder = store.createFolder(props.scope, name)
  selectedId.value = folder.id
  creating.value = false
  newName.value = ''
}

function move() {
  emit('move', selectedId.value)
  model.value = false
}
</script>

<template>
  <!-- Composes MpDialog (P4-6): this used to carry three different insets of its
       own (pt-4 px-5 · px-3 py-2 · px-4 pb-4). Only the folder picker is left. -->
  <MpDialog v-model="model" size="sm" title="Move to folder" :subtitle="itemLabel">
    <v-list
      v-model:selected="selectedList"
      density="compact"
      class="py-0 mp-move-dialog__list"
      aria-label="Choose a folder"
      selectable
      mandatory
      select-strategy="single-independent"
    >
      <v-list-item
        :value="null"
        rounded="lg"
        :active="selectedId === null"
      >
        <template #prepend>
          <v-icon size="18">folders</v-icon>
        </template>
        <v-list-item-title class="text-body-2">No folder</v-list-item-title>
        <template #append>
          <v-icon v-if="selectedId === null" size="16" color="primary">check</v-icon>
        </template>
      </v-list-item>

      <v-list-item
        v-for="folder in folders"
        :key="folder.id"
        :value="folder.id"
        rounded="lg"
        :class="{ 'mp-move-dialog__child': folder.parentId }"
        :active="selectedId === folder.id"
      >
        <template #prepend>
          <v-icon size="18">{{ folder.parentId ? 'corner-down-right' : 'folder' }}</v-icon>
        </template>
        <v-list-item-title class="text-body-2">{{ folder.name }}</v-list-item-title>
        <template #append>
          <v-icon v-if="selectedId === folder.id" size="16" color="primary">check</v-icon>
        </template>
      </v-list-item>
    </v-list>

    <div>
      <v-btn
        v-if="!creating"
        variant="text"
        size="small"
        class="text-none"
        prepend-icon="plus"
        @click="creating = true"
      >
        New folder
      </v-btn>
      <div v-else class="d-flex align-center ga-2">
        <v-text-field
          v-model="newName"
          label="Folder name"
          autofocus
          @keyup.enter="createAndSelect"
        />
        <v-btn variant="flat" color="primary" size="small" class="text-none" :disabled="!newName.trim()" @click="createAndSelect">Add</v-btn>
      </div>
    </div>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="model = false">Cancel</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        class="text-none"
        :disabled="selectedId === currentFolderId"
        @click="move"
      >
        Move
      </v-btn>
    </template>
  </MpDialog>
</template>

<style scoped>
.mp-move-dialog__list {
  /* A scroll measure for the folder list, not a spacing step. */
  max-height: 280px;
  overflow-y: auto;
}

.mp-move-dialog__child {
  padding-inline-start: var(--mp-space-28) !important;
}
</style>
