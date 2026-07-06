<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
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

const titleId = useId()
</script>

<template>
  <v-dialog v-model="model" max-width="420" :aria-labelledby="titleId">
    <v-card flat border rounded="lg">
      <v-card-title :id="titleId" class="text-subtitle-1 font-weight-bold pt-4 px-5">Move to folder</v-card-title>
      <v-card-subtitle v-if="itemLabel" class="px-5 text-body-2">{{ itemLabel }}</v-card-subtitle>

      <v-card-text class="px-3 py-2">
        <v-list density="compact" class="py-0 mp-move-dialog__list" aria-label="Choose a folder">
          <v-list-item
            rounded="lg"
            :active="selectedId === null"
            @click="selectedId = null"
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
            rounded="lg"
            :class="{ 'mp-move-dialog__child': folder.parentId }"
            :active="selectedId === folder.id"
            @click="selectedId = folder.id"
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

        <div class="px-2 pt-2">
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
              placeholder="Folder name"
              variant="outlined"
              density="compact"
              hide-details
              autofocus
              @keyup.enter="createAndSelect"
            />
            <v-btn variant="flat" color="primary" size="small" class="text-none" :disabled="!newName.trim()" @click="createAndSelect">Add</v-btn>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="justify-end px-4 pb-4">
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
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.mp-move-dialog__list {
  max-height: 280px;
  overflow-y: auto;
}

.mp-move-dialog__child {
  padding-inline-start: 28px !important;
}
</style>
