<script setup lang="ts">
import { computed } from 'vue'
import type { Folder } from '@/stores/useFolders'

const model = defineModel<string | null>({ default: null })

const props = withDefaults(defineProps<{
  /** Flattened folder list: parents followed by their children (see useFoldersStore.foldersByScope). */
  folders: Folder[]
  /** Item counts per folder id. A parent's count should include its children's items. */
  counts?: Record<string, number>
  /** Count shown next to "All folders". */
  totalCount?: number
  label?: string
}>(), {
  counts: () => ({}),
  totalCount: 0,
  label: 'All folders',
})

defineEmits<{
  manage: []
}>()

const selectedName = computed(() => {
  if (!model.value) return props.label
  return props.folders.find(f => f.id === model.value)?.name ?? props.label
})
</script>

<template>
  <v-menu location="bottom start" :close-on-content-click="true">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        variant="outlined"
        height="40"
        class="text-none mp-folder-select__activator"
        prepend-icon="folder"
        append-icon="chevron-down"
        aria-label="Filter by folder"
      >
        {{ selectedName }}
      </v-btn>
    </template>

    <v-card min-width="240" max-width="320" flat border rounded="lg" class="mt-1">
      <v-list density="compact" class="py-1" aria-label="Folders">
        <v-list-item
          rounded="lg"
          class="mx-1"
          :active="model === null"
          @click="model = null"
        >
          <template #prepend>
            <v-icon size="18">folders</v-icon>
          </template>
          <v-list-item-title class="text-body-2">All folders</v-list-item-title>
          <template #append>
            <span class="text-caption text-medium-emphasis">{{ totalCount }}</span>
          </template>
        </v-list-item>

        <v-divider class="my-1" />

        <v-list-item
          v-for="folder in folders"
          :key="folder.id"
          rounded="lg"
          class="mx-1"
          :class="{ 'mp-folder-select__child': folder.parentId }"
          :active="model === folder.id"
          @click="model = folder.id"
        >
          <template #prepend>
            <v-icon size="18">{{ folder.parentId ? 'corner-down-right' : 'folder' }}</v-icon>
          </template>
          <v-list-item-title class="text-body-2">{{ folder.name }}</v-list-item-title>
          <template #append>
            <span class="text-caption text-medium-emphasis">{{ counts[folder.id] ?? 0 }}</span>
          </template>
        </v-list-item>

        <v-divider class="my-1" />

        <v-list-item rounded="lg" class="mx-1" @click="$emit('manage')">
          <template #prepend>
            <v-icon size="18">settings-2</v-icon>
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">Manage folders</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<style scoped>
.mp-folder-select__activator {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
}

.mp-folder-select__child {
  padding-inline-start: 28px !important;
}
</style>
