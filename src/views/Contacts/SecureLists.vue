<script setup lang="ts">
import { ref } from 'vue'
import { useCdpEntitiesStore, type SecureList } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const store = useCdpEntitiesStore()
const search = ref('')

const headers = [
  { title: 'List Name', key: 'name', sortable: true },
  { title: 'Contacts', key: 'contacts', align: 'end' as const },
  { title: 'Last Accessed', key: 'lastAccessed' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
function notify(text: string) { snackbarText.value = text; snackbar.value = true }

// Create / edit drawer
const drawer = ref(false)
const editingId = ref<number | null>(null)
const listName = ref('')

function openCreate() { editingId.value = null; listName.value = ''; drawer.value = true }
function openEdit(list: SecureList) { editingId.value = list.id; listName.value = list.name; drawer.value = true }

function save() {
  const name = listName.value.trim()
  if (!name) return
  if (editingId.value != null) {
    store.updateSecureList(editingId.value, name)
    notify('Secure list updated')
  } else {
    store.addSecureList(name)
    notify('Secure list created')
  }
  drawer.value = false
}

// Delete
const deleteDialog = ref(false)
const pendingList = ref<SecureList | null>(null)
function askDelete(list: SecureList) { pendingList.value = list; deleteDialog.value = true }
function confirmDelete() {
  if (pendingList.value) { store.deleteSecureList(pendingList.value.id); notify('Secure list deleted') }
  pendingList.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Secure Lists"
      :subtitle="`${store.secureLists.length} secure lists`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Secure List</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Secure Lists"
        :total-count="store.secureLists.length"
      />

      <v-data-table
        :headers="headers"
        :items="store.secureLists"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.contacts="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.contacts.toLocaleString() }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Secure list actions">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="shield"
            :title="search ? 'No secure lists match your search' : 'No secure lists yet'"
            :description="search ? 'Try a different search term.' : 'Create a secure list to restrict access to sensitive contacts.'"
            action-label="New Secure List"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit secure list -->
    <MpFormDrawer v-model="drawer" :title="editingId != null ? 'Edit Secure List' : 'New Secure List'">
      <v-text-field
        v-model="listName"
        label="List Name *"
        variant="outlined"
        density="comfortable"
        autofocus
        @keyup.enter="save"
      />
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!listName.trim()" @click="save">Save</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete secure list?"
      :message="`Delete “${pendingList?.name}”? This cannot be undone.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />

    <v-snackbar v-model="snackbar" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackbarText }}</div>
    </v-snackbar>
  </div>
</template>
