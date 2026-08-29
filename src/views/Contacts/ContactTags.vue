<script setup lang="ts">
import { ref } from 'vue'
import { useCdpEntitiesStore, type CdpTag } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const store = useCdpEntitiesStore()
const toast = useToast()
const search = ref('')

const headers = [
  { title: 'Tag Name', key: 'name', sortable: true },
  { title: 'Contacts', key: 'count', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Only 3 columns, all load-bearing (name, count, actions) — nothing is tiered;
// the composable is wired so a future column gets priority handling for free.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

// Create / edit drawer
const drawer = ref(false)
const editingId = ref<number | null>(null)
const tagName = ref('')

function openCreate() { editingId.value = null; tagName.value = ''; drawer.value = true }
function openEdit(tag: CdpTag) { editingId.value = tag.id; tagName.value = tag.name; drawer.value = true }

function save() {
  const name = tagName.value.trim()
  if (!name) return
  if (editingId.value != null) {
    store.updateTag(editingId.value, name)
    toast.success('Tag updated')
  } else {
    store.addTag(name)
    toast.success('Tag created')
  }
  drawer.value = false
}

// Delete
const deleteDialog = ref(false)
const pendingTag = ref<CdpTag | null>(null)
function askDelete(tag: CdpTag) { pendingTag.value = tag; deleteDialog.value = true }
function confirmDelete() {
  if (pendingTag.value) { store.deleteTag(pendingTag.value.id); toast.success('Tag deleted') }
  pendingTag.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Contact Tags"
      :subtitle="`${store.tags.length} tags`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Tag</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Tags"
        :total-count="store.tags.length"
      />

      <MpTableSkeleton v-if="loading" :rows="7" :columns="3" />

      <v-data-table v-else
        :headers="visibleHeaders"
        :items="store.tags"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.count="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.count.toLocaleString() }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Tag actions" :itemLabel="item.name">
            <MpMenuItem icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="tags"
            :title="search ? 'No tags match your search' : 'No tags yet'"
            :description="search ? 'Try a different search term.' : 'Create a tag to group and target contacts.'"
            action-label="New Tag"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit tag -->
    <MpFormDrawer v-model="drawer" :title="editingId != null ? 'Edit Tag' : 'New Tag'">
      <MpFormGrid>
        <v-text-field
          v-model="tagName"
          label="Tag Name *"
          autofocus
          @keyup.enter="save"
        />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!tagName.trim()" @click="save">Save</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete tag?"
      :message="`Delete the tag “${pendingTag?.name}”? Contacts will no longer be grouped by it.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>
