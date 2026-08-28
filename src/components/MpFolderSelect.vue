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
        class="text-none mp-folder-select__activator"
        prepend-icon="folder"
        append-icon="chevron-down"
        :aria-label="`Filter by folder: ${selectedName}`"
      >
        {{ selectedName }}
      </v-btn>
    </template>

    <v-card min-width="240" max-width="320" flat border class="mp-folder-select__panel">
      <v-list density="compact" class="py-1" aria-label="Folders">
        <v-list-item
          rounded="lg"
          class="mx-1"
          :active="model === null"
          :aria-current="model === null ? 'true' : undefined"
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
          :aria-current="model === folder.id ? 'true' : undefined"
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
/* P4-7: the activator is a control, so it takes the shared control height —
   the same token the toolbar's Filter button and search field resolve to. It
   was a `height="40"` attribute, i.e. the right number stated the wrong way. */
.mp-folder-select__activator {
  height: var(--mp-component-control-height);
  border-color: var(--border-default);
  color: var(--text-primary);
  font-weight: var(--mp-fontWeight-medium);
}

/* A menu panel is 12 on the concentric radius scale (P2-6), not the 16 that
   `rounded="lg"` resolves to through global.scss's card override. */
.mp-folder-select__panel {
  border-radius: var(--mp-component-menu-radius);
}

.mp-folder-select__child {
  padding-inline-start: var(--mp-space-28) !important;
}
</style>
