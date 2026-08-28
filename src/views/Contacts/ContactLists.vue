<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCdpEntitiesStore, type CdpList } from '@/stores/useCdpEntities'
import { useContactsStore } from '@/stores/useContacts'
import { downloadCsv, type CsvColumn } from '@/utils/exportCsv'
import type { Contact } from '@/stores/useContacts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const store = useCdpEntitiesStore()
const contactsStore = useContactsStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const search = ref('')

const listTypes = ['Normal', 'Premium', 'Transactional', 'Automation']
const languages = ['English', 'Spanish', 'French', 'German']

const headers = [
  { title: 'List Name', key: 'name', sortable: true },
  { title: 'Contacts', key: 'count', align: 'end' as const },
  { title: 'Type', key: 'type', hideBelow: 'sm' as const },
  { title: 'Created', key: 'created', hideBelow: 'md' as const },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Row identity + its headline count always show; supporting columns drop out
// progressively. The actions column is never tiered — the kebab must stay
// reachable at every width.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

const contactCsvColumns: CsvColumn<Contact>[] = [
  { title: 'First Name', value: 'firstName' },
  { title: 'Last Name', value: 'lastName' },
  { title: 'Email', value: 'email' },
  { title: 'Phone', value: 'phone' },
  { title: 'Company', value: (r) => r.company ?? '' },
  { title: 'Status', value: 'status' },
]


// Create / edit drawer
const drawer = ref(false)
const editingId = ref<number | null>(null)
type ListForm = Omit<CdpList, 'id' | 'count' | 'created'>
function blankForm(): ListForm {
  return { name: '', type: 'Normal', brand: '', displayName: '', description: '', fromName: '', fromEmail: '', replyTo: '', language: 'English', address: '' }
}
const form = ref<ListForm>(blankForm())

function openCreate() { editingId.value = null; form.value = blankForm(); drawer.value = true }
function openEdit(list: CdpList) {
  editingId.value = list.id
  form.value = {
    name: list.name, type: list.type, brand: list.brand, displayName: list.displayName,
    description: list.description, fromName: list.fromName, fromEmail: list.fromEmail,
    replyTo: list.replyTo, language: list.language, address: list.address,
  }
  drawer.value = true
}

const canSave = () => form.value.name.trim().length > 0 && form.value.address.trim().length > 0

function save() {
  if (!canSave()) return
  if (editingId.value != null) {
    store.updateList(editingId.value, { ...form.value })
    toast.success('List updated')
  } else {
    store.addList({ ...form.value })
    toast.success('List created')
  }
  drawer.value = false
}

function viewContacts() {
  router.push(`/accounts/${route.params.accountId}/contacts`)
}

function exportContacts(list: CdpList) {
  downloadCsv(`${list.name.replace(/\s+/g, '-').toLowerCase()}-contacts`, contactsStore.contacts, contactCsvColumns)
  toast.success('Contacts exported')
}

function duplicate(list: CdpList) {
  store.duplicateList(list.id)
  toast.success('List duplicated')
}

// Delete
const deleteDialog = ref(false)
const pendingList = ref<CdpList | null>(null)
function askDelete(list: CdpList) { pendingList.value = list; deleteDialog.value = true }
function confirmDelete() {
  if (pendingList.value) { store.deleteList(pendingList.value.id); toast.success('List deleted') }
  pendingList.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Contact Lists"
      :subtitle="`${store.lists.length} lists`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">Create List</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Lists"
        :total-count="store.lists.length"
      />

      <MpTableSkeleton v-if="loading" :rows="7" :columns="5" />

      <v-data-table v-else
        :headers="visibleHeaders"
        :items="store.lists"
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
          <MpRowActionsMenu ariaLabel="List actions" :itemLabel="item.name">
            <v-list-item prepend-icon="users" title="View Contacts" @click="viewContacts" />
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-list-item prepend-icon="share" title="Export Contacts" @click="exportContacts(item)" />
            <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicate(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="list"
            :title="search ? 'No lists match your search' : 'No contact lists yet'"
            :description="search ? 'Try a different search term.' : 'Create a list to organize your contacts and send targeted campaigns.'"
            action-label="Create List"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit list -->
    <MpFormDrawer v-model="drawer" :title="editingId != null ? 'Edit List' : 'Create List'">
      <MpFormSection title="List details" />
      <MpFormGrid :cols="2">
        <v-text-field v-model="form.name" label="List Name *" counter="150" maxlength="150" class="mp-form-grid__full" />
        <v-select v-model="form.type" label="List Type" :items="listTypes" />
        <v-text-field v-model="form.brand" label="Brand" />
        <v-text-field v-model="form.displayName" label="Display Name" class="mp-form-grid__full" />
        <v-textarea v-model="form.description" label="Description" rows="3" auto-grow class="mp-form-grid__full" />
      </MpFormGrid>

      <MpFormSection title="Sender" />
      <MpFormGrid :cols="2">
        <v-text-field v-model="form.fromName" label="From Name" />
        <v-text-field v-model="form.fromEmail" label="From Email" type="email" />
        <v-text-field v-model="form.replyTo" label="Reply To" type="email" />
        <v-select v-model="form.language" label="Language" :items="languages" />
        <v-text-field v-model="form.address" label="Address *" prepend-inner-icon="map-pin" class="mp-form-grid__full" />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave()" @click="save">Save</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete list?"
      :message="`Delete “${pendingList?.name}”? This does not delete the contacts, only the list.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>
