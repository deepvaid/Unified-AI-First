<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketingAssetsStore, type ImageGroup } from '@/stores/useMarketingAssets'
import { useFoldersStore } from '@/stores/useFolders'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFolderSelect from '@/components/MpFolderSelect.vue'
import MpManageFoldersDrawer from '@/components/MpManageFoldersDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

// UAT parity: /accounts/:id/image_groups — "Optimize On Open" image groups
// (open-time image swaps). List with folders + bulk select; groups are built
// in the full-page editor at /image_groups/new and /:id/edit.
// UAT mixes "Optimise"/"Optimize"/"My Image Groups"; one spelling is used
// here (IMPROVEMENTS.md).

const store = useMarketingAssetsStore()
const foldersStore = useFoldersStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const search = ref('')
const selected = ref<number[]>([])

// ── Folders ───────────────────────────────────────────────────────────────
const groupFolders = computed(() => foldersStore.foldersByScope('image_groups'))
const selectedFolderId = ref<string | null>(null)
const manageFoldersOpen = ref(false)

const folderCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const folder of groupFolders.value) {
    const ids = [folder.id, ...foldersStore.childrenOf(folder.id).map(f => f.id)]
    counts[folder.id] = store.imageGroups.filter(g => g.folderId && ids.includes(g.folderId)).length
  }
  return counts
})

const visibleGroups = computed(() => {
  if (!selectedFolderId.value) return store.imageGroups
  const ids = [selectedFolderId.value, ...foldersStore.childrenOf(selectedFolderId.value).map(f => f.id)]
  return store.imageGroups.filter(g => g.folderId && ids.includes(g.folderId))
})

const activeFilterEntries = computed(() => {
  const folder = foldersStore.getFolder(selectedFolderId.value)
  return folder ? [{ key: 'folder', label: `Folder: ${folder.name}` }] : []
})

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Created At', key: 'createdAt', sortable: true },
  { title: 'Updated At', key: 'updatedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

function openEditor(group?: ImageGroup) {
  router.push(group
    ? { name: 'ImageGroupEdit', params: { accountId: accountId.value, id: group.id } }
    : { name: 'ImageGroupCreate', params: { accountId: accountId.value } })
}

// ── Delete ────────────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<number[]>([])
function askDelete(ids: number[]) {
  pendingDelete.value = ids
  confirmDelete.value = true
}
function doDelete() {
  for (const id of pendingDelete.value) store.deleteImageGroup(id)
  selected.value = selected.value.filter(id => !pendingDelete.value.includes(id))
  toast.success(pendingDelete.value.length === 1 ? 'Image group deleted' : `${pendingDelete.value.length} image groups deleted`)
  pendingDelete.value = []
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Optimize On Open"
      :subtitle="`${store.imageGroups.length} image groups`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="folder" class="text-none" color="surface" @click="manageFoldersOpen = true">Manage Folders</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openEditor()">New Group</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Image groups"
        search-placeholder="Search image groups"
        :total-count="visibleGroups.length"
        :active-filters="activeFilterEntries"
        @remove-filter="selectedFolderId = null"
        @clear-filters="selectedFolderId = null"
      >
        <template #actions>
          <MpFolderSelect
            v-model="selectedFolderId"
            :folders="groupFolders"
            :counts="folderCounts"
            :total-count="store.imageGroups.length"
            @manage="manageFoldersOpen = true"
          />
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="visibleGroups"
        :search="search"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :items-per-page="10"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.name="{ item }">
          <button type="button" class="group-name" @click="openEditor(item)">{{ item.name }}</button>
          <div v-if="item.folderId" class="text-caption text-medium-emphasis">
            {{ foldersStore.getFolder(item.folderId)?.name }}
          </div>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Image group actions" :itemLabel="item.name">
            <MpMenuItem icon="pencil" title="Edit Image Group" @click="openEditor(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete Image Group" danger @click="askDelete([item.id])" />
          </MpRowActionsMenu>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="images"
            :title="search || selectedFolderId ? 'No image groups match your filters' : 'No image groups yet'"
            :description="search || selectedFolderId ? 'Try a different search or clear the folder filter.' : 'Swap an email image at open time — a default image until it expires, then the expiry image.'"
            :action-label="!search && !selectedFolderId ? 'New Group' : undefined"
            action-icon="plus"
            class="py-10"
            @action="openEditor()"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="visibleGroups.length"
      @clear="selected = []"
    >
      <v-btn size="small" variant="text" class="text-none text-error" prepend-icon="trash-2" @click="askDelete([...selected])">Delete</v-btn>
    </MpFloatingBulkBar>

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="pendingDelete.length === 1 ? 'Delete image group?' : `Delete ${pendingDelete.length} image groups?`"
      message="Emails referencing a deleted group show its last rendered image."
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />

    <MpManageFoldersDrawer
      v-model="manageFoldersOpen"
      scope="image_groups"
      :counts="folderCounts"
    />
  </div>
</template>

<style scoped>
.group-name {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  text-align: left;
}

.group-name:hover,
.group-name:focus-visible {
  text-decoration: underline;
}
</style>
